import json
import subprocess
import sys
import tempfile
import urllib.request
from http.server import BaseHTTPRequestHandler
from pathlib import Path


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/run":
            self._send({"error": "Not found."}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            language = payload.get("language")
            if language == "python":
                self._send(run_python(payload))
            elif language in ("cpp", "java"):
                self._send(run_wandbox(payload))
            else:
                self._send({"error": "Unsupported language."}, 400)
        except Exception as error:
            self._send({"error": str(error)}, 500)

    def _send(self, payload, status=200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_args):
        return


def run_python(payload):
    tests = json.dumps(payload["tests"])
    function_name = payload["fn"]
    harness = f'''\nimport json\n_tests = {tests}\n_results = []\nfor _test in _tests:\n    try:\n        _actual = {function_name}(*_test["input"])\n        _results.append({{"passed": _actual == _test["expected"], "actual": _actual}})\n    except Exception as _error:\n        _results.append({{"passed": False, "actual": str(_error)}})\nprint(json.dumps(_results))\n'''
    with tempfile.TemporaryDirectory() as directory:
        source = Path(directory) / "solution.py"
        source.write_text(payload["code"] + harness, encoding="utf-8")
        try:
            result = subprocess.run(
                [sys.executable, "-I", str(source)],
                cwd=directory,
                capture_output=True,
                text=True,
                timeout=8,
            )
        except subprocess.TimeoutExpired:
            return {"error": "Timed out. Check for an infinite loop."}
    if result.returncode != 0:
        return {"error": (result.stderr or result.stdout or "The Python program failed.").strip()[-1200:]}
    try:
        return {"results": json.loads(result.stdout)}
    except json.JSONDecodeError:
        return {"error": "The Python runner returned invalid output."}


def array_literal(values, language):
    joined = ",".join(str(int(value)) for value in values)
    return ("vector<int>{" + joined + "}") if language == "cpp" else ("new int[]{" + joined + "}")


def call_expression(payload, test):
    problem_id = payload["problemId"]
    function_name = payload["fn"]
    inputs = test["input"]
    prefix = "" if payload["language"] == "cpp" else "Solution."
    if problem_id == "partial-hand":
        return f"{prefix}{function_name}({array_literal(inputs[0], payload['language'])}, {int(inputs[1])})"
    return f"{prefix}{function_name}({array_literal(inputs[0], payload['language'])})"


def run_wandbox(payload):
    language = payload["language"]
    numeric_result = payload["problemId"] in ("how-many-picks", "how-many-slides")
    lines = []
    for test in payload["tests"]:
        call = call_expression(payload, test)
        expected = test["expected"]
        if language == "cpp":
            expected_code = str(int(expected)) if numeric_result else array_literal(expected, language)
            output_code = "to_string(_actual)" if numeric_result else "repr(_actual)"
            lines.append(f'{{ auto _actual = {call}; bool _pass = _actual == {expected_code}; cout << (_pass ? "PASS" : "FAIL") << "\\t" << {output_code} << "\\n"; }}')
        else:
            expected_code = str(int(expected)) if numeric_result else array_literal(expected, language)
            output_code = "Integer.toString(_actual)" if numeric_result else "repr(_actual)"
            actual_type = "int" if numeric_result else "int[]"
            comparison = f"_actual == {expected_code}" if numeric_result else f"Arrays.equals(_actual, {expected_code})"
            lines.append(f'{{ {actual_type} _actual = {call}; boolean _pass = {comparison}; System.out.println((_pass ? "PASS" : "FAIL") + "\\t" + {output_code}); }}')

    if language == "cpp":
        harness = '''\n#include <bits/stdc++.h>\nusing namespace std;\nstring repr(const vector<int>& values) { string result; for (size_t i = 0; i < values.size(); i++) { if (i) result += ","; result += to_string(values[i]); } return result; }\nint main() {\n''' + "\n".join(lines) + "\nreturn 0; }\n"
        compiler = "gcc-13.2.0"
    else:
        harness = '''\nclass Runner {\n    static String repr(int[] values) { StringBuilder result = new StringBuilder(); for (int i = 0; i < values.length; i++) { if (i > 0) result.append(","); result.append(values[i]); } return result.toString(); }\n    public static void main(String[] args) {\n''' + "\n".join(lines) + "\n    }\n}\n"
        compiler = "openjdk-jdk-22+36"

    request = urllib.request.Request(
        "https://wandbox.org/api/compile.json",
        data=json.dumps({"compiler": compiler, "code": payload["code"] + harness}).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "SortVerse/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        return {"error": "Hosted compiler unavailable: " + str(error)}
    if result.get("compiler_error") or result.get("program_error"):
        return {"error": (result.get("compiler_error") or result.get("program_error") or "Compilation failed").strip()[-1200:]}
    return {"results": parse_wandbox_results(result.get("program_output", ""), payload["tests"])}


def parse_wandbox_results(output, tests):
    results = []
    for line, test in zip(output.splitlines(), tests):
        parts = line.split("\t", 1)
        actual = parts[1] if len(parts) > 1 else ""
        if isinstance(test["expected"], list):
            actual = [] if not actual else [int(value) for value in actual.split(",")]
        else:
            try:
                actual = int(actual)
            except ValueError:
                pass
        results.append({"passed": parts[0] == "PASS", "actual": actual})
    while len(results) < len(tests):
        results.append({"passed": False, "actual": "No result returned."})
    return results
