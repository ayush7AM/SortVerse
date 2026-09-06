import json
import os
import subprocess
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
PORT = 8080


def run_process(command, cwd, timeout=8):
    try:
        result = subprocess.run(command, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return None, 'Timed out. Check for an infinite loop.'
    if result.returncode != 0:
        return None, (result.stderr or result.stdout or 'The program failed.').strip()[-1200:]
    return result.stdout, None


def values(items):
    return ','.join(str(int(item)) for item in items)


def cpp_vector(items):
    return 'vector<int>{' + values(items) + '}'


def java_array(items):
    return 'new int[]{' + values(items) + '}'


def call_parts(problem_id, language, fn, test):
    inputs = test['input']
    if language == 'cpp':
        vector = cpp_vector
        if problem_id == 'partial-hand':
            return f'{fn}({vector(inputs[0])}, {int(inputs[1])})'
        return f'{fn}({vector(inputs[0])})'
    array = java_array
    if problem_id == 'partial-hand':
        return f'Solution.{fn}({array(inputs[0])}, {int(inputs[1])})'
    return f'Solution.{fn}({array(inputs[0])})'


def parse_output(value, expected):
    if isinstance(expected, list):
        return [] if not value else [int(item) for item in value.split(',')]
    try:
        return int(value)
    except ValueError:
        return value


def run_python(payload):
    tests = json.dumps(payload['tests'])
    harness = f'''\nimport json\n_tests = {tests}\n_results = []\nfor _test in _tests:\n    try:\n        _actual = {payload['fn']}(*_test["input"])\n        _results.append({{"passed": _actual == _test["expected"], "actual": _actual}})\n    except Exception as _error:\n        _results.append({{"passed": False, "actual": str(_error)}})\nprint(json.dumps(_results))\n'''
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / 'solution.py'
        source.write_text(payload['code'] + harness, encoding='utf-8')
        output, error = run_process([sys.executable, '-I', str(source)], directory)
    if error:
        return {'error': error}
    try:
        return {'results': json.loads(output)}
    except (TypeError, json.JSONDecodeError):
        return {'error': 'The Python runner returned invalid output.'}


def run_cpp(payload):
    lines = []
    is_number = payload['problemId'] in ('how-many-picks', 'how-many-slides')
    for test in payload['tests']:
        call = call_parts(payload['problemId'], 'cpp', payload['fn'], test)
        expected = test['expected']
        expected_expr = str(int(expected)) if is_number else cpp_vector(expected)
        actual_expr = f'auto _actual = {call};'
        comparison = f'_actual == {expected_expr}'
        actual_output = 'to_string(_actual)' if is_number else 'repr(_actual)'
        lines.append(f'{{ {actual_expr} bool _pass = {comparison}; cout << (_pass ? "PASS" : "FAIL") << "\\t" << {actual_output} << "\\n"; }}')
    harness = '''\n#include <iostream>\n#include <string>\nusing namespace std;\nstring repr(const vector<int>& values) { string result; for (size_t i = 0; i < values.size(); i++) { if (i) result += ","; result += to_string(values[i]); } return result; }\nint main() {\n''' + '\n'.join(lines) + '\nreturn 0; }\n'
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / 'solution.cpp'
        binary = Path(directory) / 'solution'
        source.write_text(payload['code'] + harness, encoding='utf-8')
        _, error = run_process(['/usr/bin/g++', '-std=c++17', str(source), '-o', str(binary)], directory)
        if error:
            return {'error': error}
        output, error = run_process([str(binary)], directory)
    if error:
        return {'error': error}
    return {'results': parse_compiled_results(output, payload['tests'])}


def run_java(payload):
    lines = []
    is_number = payload['problemId'] in ('how-many-picks', 'how-many-slides')
    for test in payload['tests']:
        call = call_parts(payload['problemId'], 'java', payload['fn'], test)
        expected = test['expected']
        expected_expr = str(int(expected)) if is_number else java_array(expected)
        actual_output = 'Integer.toString(_actual)' if is_number else 'repr(_actual)'
        comparison = f'_actual == {expected_expr}' if is_number else f'Arrays.equals(_actual, {expected_expr})'
        lines.append(f'{{ {'int' if is_number else 'int[]'} _actual = {call}; boolean _pass = {comparison}; System.out.println((_pass ? "PASS" : "FAIL") + "\\t" + {actual_output}); }}')
    harness = '''\nclass Runner {\n    static String repr(int[] values) { StringBuilder result = new StringBuilder(); for (int i = 0; i < values.length; i++) { if (i > 0) result.append(","); result.append(values[i]); } return result.toString(); }\n    public static void main(String[] args) {\n''' + '\n'.join(lines) + '\n    }\n}\n'
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / 'Solution.java'
        source.write_text(payload['code'] + harness, encoding='utf-8')
        _, error = run_process(['/usr/bin/javac', str(source)], directory)
        if error:
            return {'error': error}
        output, error = run_process(['/usr/bin/java', '-cp', directory, 'Runner'], directory)
    if error:
        return {'error': error}
    return {'results': parse_compiled_results(output, payload['tests'])}


def parse_compiled_results(output, tests):
    results = []
    for line, test in zip(output.splitlines(), tests):
        parts = line.split('\t', 1)
        actual_text = parts[1] if len(parts) > 1 else ''
        results.append({'passed': parts[0] == 'PASS', 'actual': parse_output(actual_text, test['expected'])})
    while len(results) < len(tests):
        results.append({'passed': False, 'actual': 'No result returned.'})
    return results


def execute(payload):
    if payload.get('language') == 'python':
        return run_python(payload)
    if payload.get('language') == 'cpp':
        return run_cpp(payload)
    if payload.get('language') == 'java':
        return run_java(payload)
    return {'error': 'Unsupported language.'}


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/api/run':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            payload = json.loads(self.rfile.read(length))
            response = execute(payload)
            body = json.dumps(response).encode('utf-8')
            self.send_response(200 if 'error' not in response else 400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as error:
            body = json.dumps({'error': str(error)}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def log_message(self, format, *args):
        if self.path != '/api/run':
            super().log_message(format, *args)


if __name__ == '__main__':
    os.chdir(ROOT)
    server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
    print(f'SortVerse running at http://localhost:{PORT}', flush=True)
    server.serve_forever()
