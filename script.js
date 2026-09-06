(function(){
  const chart = document.getElementById('chart');
  const sizeSlider = document.getElementById('sizeSlider');
  const speedSlider = document.getElementById('speedSlider');
  const sizeVal = document.getElementById('sizeVal');
  const speedVal = document.getElementById('speedVal');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const sortBtn = document.getElementById('sortBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const stopBtn = document.getElementById('stopBtn');
  const timeStat = document.getElementById('timeStat');
  const compStat = document.getElementById('compStat');
  const swapStat = document.getElementById('swapStat');
  const algoTitle = document.getElementById('algoTitle');
  const algoConsole = document.getElementById('algoConsole');
  const customInput = document.getElementById('customInput');
  const applyCustomBtn = document.getElementById('applyCustomBtn');
  const customError = document.getElementById('customError');
  const customToggle = document.getElementById('customToggle');
  const customPanel = document.getElementById('customPanel');
  const themeBtn = document.getElementById('themeBtn');
  const trackCard = document.getElementById('trackCard');
  const trackSvg = document.getElementById('trackSvg');
  const trackSub = document.getElementById('trackSub');
  const compCard = document.getElementById('compCard');
  const compAlgoName = document.getElementById('compAlgoName');
  const compBestBox = document.getElementById('compBestBox');
  const compAvgBox = document.getElementById('compAvgBox');
  const compWorstBox = document.getElementById('compWorstBox');
  const compBestVal = document.getElementById('compBestVal');
  const compAvgVal = document.getElementById('compAvgVal');
  const compWorstVal = document.getElementById('compWorstVal');
  const compSpaceVal = document.getElementById('compSpaceVal');
  const compNote = document.getElementById('compNote');
  const modeSingleBtn = document.getElementById('modeSingleBtn');
  const modeArenaBtn = document.getElementById('modeArenaBtn');
  const modeLearnBtn = document.getElementById('modeLearnBtn');
  const modePracticeBtn = document.getElementById('modePracticeBtn');
  const singleView = document.getElementById('singleView');
  const arenaView = document.getElementById('arenaView');
  const learnView = document.getElementById('learnView');
  const practiceView = document.getElementById('practiceView');
  const controlsBar = document.getElementById('controlsBar');
  const arenaGrid = document.getElementById('arenaGrid');
  const leaderboardBody = document.getElementById('leaderboardBody');
  const practiceList = document.getElementById('practiceList');
  const practiceWorkspace = document.getElementById('practiceWorkspace');
  const practiceProgress = document.getElementById('practiceProgress');

  const MAX_SIZE = 120;
  const ALGO_LIST = [
    {key:'bubble', name:'Bubble Sort'},
    {key:'selection', name:'Selection Sort'},
    {key:'insertion', name:'Insertion Sort'},
    {key:'merge', name:'Merge Sort'},
    {key:'quick', name:'Quick Sort'},
    {key:'heap', name:'Heap Sort'},
  ];

  let currentAlgo = 'bubble';
  let array = [], maxVal = 100, bars = [], labels = [];
  let sorting = false, paused = false, pauseResolvers = [];
  let comparisons = 0, swaps = 0, runId = 0;
  let trackLog = [];
  let lastInitialSnapshot = null;

  const COMPLEXITY = {
    bubble:    { best:'O(n)', avg:'O(n²)', worst:'O(n²)', space:'O(1)', class:'n2' },
    selection: { best:'O(n²)', avg:'O(n²)', worst:'O(n²)', space:'O(1)', class:'n2' },
    insertion: { best:'O(n)', avg:'O(n²)', worst:'O(n²)', space:'O(1)', class:'n2' },
    merge:     { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(n)', class:'nlogn' },
    quick:     { best:'O(n log n)', avg:'O(n log n)', worst:'O(n²)', space:'O(log n)', class:'nlogn' },
    heap:      { best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(1)', class:'nlogn' },
  };
  const ALGO_DISPLAY_NAME = {
    bubble:'Bubble Sort', selection:'Selection Sort', insertion:'Insertion Sort',
    merge:'Merge Sort', quick:'Quick Sort', heap:'Heap Sort'
  };

  function isSortedAsc(arr){ for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i-1]) return false; return true; }
  function isSortedDesc(arr){ for (let i = 1; i < arr.length; i++) if (arr[i] > arr[i-1]) return false; return true; }

  function detectCase(algoKey, initialArr){
    const asc = isSortedAsc(initialArr), desc = isSortedDesc(initialArr);
    if (algoKey === 'quick') return (asc || desc) ? 'worst' : 'avg';
    if (algoKey === 'bubble' || algoKey === 'insertion'){
      if (asc) return 'best';
      if (desc) return 'worst';
      return 'avg';
    }
    return 'avg'; // selection / merge / heap don't change asymptotic class with input order
  }

  function hideComplexityCard(){ compCard.classList.remove('visible'); }

  function renderComplexityCard(algoKey, initialArr, comps, n){
    if (!initialArr || !initialArr.length) return;
    const data = COMPLEXITY[algoKey];
    if (!data) return;
    const hit = detectCase(algoKey, initialArr);

    compAlgoName.textContent = ALGO_DISPLAY_NAME[algoKey] || algoKey;
    compBestVal.textContent = data.best;
    compAvgVal.textContent = data.avg;
    compWorstVal.textContent = data.worst;
    compSpaceVal.textContent = data.space;

    compBestBox.classList.toggle('hit', hit === 'best');
    compAvgBox.classList.toggle('hit', hit === 'avg');
    compWorstBox.classList.toggle('hit', hit === 'worst');

    const bound = data.class === 'n2'
      ? Math.round(n * (n - 1) / 2)
      : Math.round(n * Math.log2(Math.max(n, 2)));
    const boundLabel = data.class === 'n2' ? 'O(n²)' : 'O(n log n)';

    let rel;
    if (comps <= bound * 0.55) rel = 'well below';
    else if (comps <= bound * 1.1) rel = 'close to';
    else rel = 'above';

    compNote.textContent = comps + ' comparisons for n=' + n + ' — ' + rel + ' the ' + boundLabel + ' bound of ' + bound + '.';
    compCard.classList.add('visible');
  }

  let arenaMode = false, arenaRunning = false, arenaRunId = 0;
  let arenaBaseArray = [], arenaInstances = [], arenaTimer = null;

  // ---------- theme ----------
  let theme = 'light';
  function applyTheme(){
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'light' ? '🌙' : '☀️';
  }
  themeBtn.addEventListener('click', () => { theme = theme === 'light' ? 'dark' : 'light'; applyTheme(); renderTrackChart(); });
  applyTheme();

  customToggle.addEventListener('click', () => {
    customPanel.classList.toggle('open');
    customToggle.textContent = customPanel.classList.contains('open') ? 'Hide custom numbers ↑' : 'Use your own numbers instead →';
  });

  // ---------- mode switching ----------
  let currentMode = 'learn';
  function setMode(m){
    currentMode = m;
    arenaMode = (m === 'arena');
    const learnMode = (m === 'learn');
    const practiceMode = (m === 'practice');
    modeLearnBtn.classList.toggle('active', learnMode);
    modeSingleBtn.classList.toggle('active', m === 'single');
    modeArenaBtn.classList.toggle('active', arenaMode);
    modePracticeBtn.classList.toggle('active', practiceMode);
    learnView.style.display = learnMode ? 'block' : 'none';
    singleView.style.display = (m === 'single') ? 'block' : 'none';
    arenaView.style.display = arenaMode ? 'block' : 'none';
    practiceView.style.display = practiceMode ? 'block' : 'none';
    controlsBar.style.display = (learnMode || practiceMode) ? 'none' : 'flex';
    if (arenaMode) buildArena(true);
  }
  modeLearnBtn.addEventListener('click', () => { if (!sorting && !arenaRunning) setMode('learn'); });
  modeSingleBtn.addEventListener('click', () => { if (!sorting && !arenaRunning) setMode('single'); });
  modeArenaBtn.addEventListener('click', () => { if (!sorting && !arenaRunning) setMode('arena'); });
  modePracticeBtn.addEventListener('click', () => { if (!sorting && !arenaRunning) setMode('practice'); });

  document.querySelectorAll('.learn-try').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.algo;
      const pill = algoConsole.querySelector('.pill[data-algo="' + key + '"]');
      if (pill){
        [...algoConsole.children].forEach(b => b.classList.remove('active'));
        pill.classList.add('active');
        currentAlgo = key;
        algoTitle.innerHTML = pill.dataset.name + ' <span class="algo-o">' + pill.dataset.o + '</span>';
      }
      setMode('single');
      newRandomArray();
    });
  });

  // ================= PRACTICE MODE =================

  const PRACTICE_KEY = 'sortverse-practice-solved';
  const PRACTICE_PROBLEMS = [
    {
      id:'neighbor-swap', algo:'Bubble Sort', title:'The Neighbor Swap',
      statement:'You can only compare and swap <strong>adjacent</strong> elements. Walk through the array repeatedly, swapping neighbors that are out of order, until everything is in ascending order. Return the sorted array.',
      fn:'neighborSwap',
      starter:`function neighborSwap(arr) {
  // Only swap adjacent elements. Return arr sorted ascending.
  return arr;
}`,
      tests:[{input:[[5,1,4,2,8]], expected:[1,2,4,5,8]}, {input:[[]], expected:[]}, {input:[[3,3,1,2]], expected:[1,2,3,3]}, {input:[[9,7,5,3,1]], expected:[1,3,5,7,9]}]
    },
    {
      id:'reverse-neighbors', algo:'Bubble Sort', title:'Flip the Line',
      statement:'Same rule — you can only compare and swap adjacent elements. But this time arrange the array in <strong>descending</strong> order (largest first). Return the result.',
      fn:'flipLine',
      starter:`function flipLine(arr) {
  // Only swap adjacent elements. Return arr sorted descending.
  return arr;
}`,
      tests:[{input:[[5,1,4,2,8]], expected:[8,5,4,2,1]}, {input:[[]], expected:[]}, {input:[[3,3,1,2]], expected:[3,3,2,1]}, {input:[[1,9,3,7,5]], expected:[9,7,5,3,1]}]
    },
    {
      id:'lazy-pass', algo:'Bubble Sort', title:'The Lazy Worker',
      statement:'Sort using adjacent swaps, but be lazy about it — if a full pass through the array makes <strong>zero swaps</strong>, stop immediately. Return the sorted array in ascending order.',
      fn:'lazyWorker',
      starter:`function lazyWorker(arr) {
  // Adjacent swaps, but stop early if a pass has no swaps.
  return arr;
}`,
      tests:[{input:[[1,2,3,4]], expected:[1,2,3,4]}, {input:[[4,1,3,2]], expected:[1,2,3,4]}, {input:[[2,1]], expected:[1,2]}, {input:[[7]], expected:[7]}]
    },
    {
      id:'pick-the-smallest', algo:'Selection Sort', title:'Trophy Shelf',
      statement:'Imagine arranging trophies from smallest to tallest. Scan all the remaining items, <strong>pick the smallest</strong>, and place it in the next open spot. Repeat until the shelf is sorted. Return the sorted array.',
      fn:'trophyShelf',
      starter:`function trophyShelf(arr) {
  // Repeatedly pick the smallest remaining item. Return arr sorted ascending.
  return arr;
}`,
      tests:[{input:[[64,25,12,22,11]], expected:[11,12,22,25,64]}, {input:[[3,1,2]], expected:[1,2,3]}, {input:[[]], expected:[]}, {input:[[5,5,2,5]], expected:[2,5,5,5]}]
    },
    {
      id:'pick-the-largest', algo:'Selection Sort', title:'Last One Standing',
      statement:'This time, scan the unsorted portion and <strong>pick the largest</strong> value. Place it at the end of the unsorted region. Repeat until the array is in ascending order. Return the sorted array.',
      fn:'lastOneStanding',
      starter:`function lastOneStanding(arr) {
  // Repeatedly pick the largest remaining item and place it at the end.
  return arr;
}`,
      tests:[{input:[[64,25,12,22,11]], expected:[11,12,22,25,64]}, {input:[[3,1,2]], expected:[1,2,3]}, {input:[[]], expected:[]}, {input:[[4,4,2,1]], expected:[1,2,4,4]}]
    },
    {
      id:'how-many-picks', algo:'Selection Sort', title:'Count the Moves',
      statement:'Sort the array by repeatedly finding the minimum and placing it at the front — but instead of returning the sorted array, return the <strong>number of swaps</strong> you performed. A swap where the element is already in the correct position still counts.',
      fn:'countMoves',
      starter:`function countMoves(arr) {
  // Sort by picking the minimum. Return the number of swaps performed.
  return 0;
}`,
      tests:[{input:[[1,2,3]], expected:3}, {input:[[3,1,2]], expected:3}, {input:[[5,4,3,2,1]], expected:5}, {input:[[2,1]], expected:2}]
    },
    {
      id:'slide-into-place', algo:'Insertion Sort', title:'The Card Hand',
      statement:'You are dealt cards one at a time. For each new card, <strong>slide</strong> it into the correct position among the cards you have already sorted. Return the final hand in ascending order.',
      fn:'cardHand',
      starter:`function cardHand(arr) {
  // Slide each element into its sorted position. Return arr sorted ascending.
  return arr;
}`,
      tests:[{input:[[12,11,13,5,6]], expected:[5,6,11,12,13]}, {input:[[4,3,2,1]], expected:[1,2,3,4]}, {input:[[1,2,3]], expected:[1,2,3]}, {input:[[2,1,2,0]], expected:[0,1,2,2]}]
    },
    {
      id:'reverse-slide', algo:'Insertion Sort', title:'Tallest First',
      statement:'Same card-hand technique — slide each element into position — but this time arrange the hand in <strong>descending</strong> order (largest first). Return the result.',
      fn:'tallestFirst',
      starter:`function tallestFirst(arr) {
  // Slide each element into position. Return arr sorted descending.
  return arr;
}`,
      tests:[{input:[[12,11,13,5,6]], expected:[13,12,11,6,5]}, {input:[[1,2,3,4]], expected:[4,3,2,1]}, {input:[[5]], expected:[5]}, {input:[[3,3,1,2]], expected:[3,3,2,1]}]
    },
    {
      id:'how-many-slides', algo:'Insertion Sort', title:'Shift Counter',
      statement:'Sort the array by sliding elements into position, but instead of returning the sorted array, return the <strong>total number of shifts</strong> (individual element moves) you performed.',
      fn:'shiftCounter',
      starter:`function shiftCounter(arr) {
  // Sort by sliding elements. Return the total number of shifts.
  return 0;
}`,
      tests:[{input:[[1,2,3,4]], expected:0}, {input:[[4,3,2,1]], expected:6}, {input:[[2,1,3,1,2]], expected:4}, {input:[[5,1,4,2,8]], expected:4}]
    },
    {
      id:'partial-hand', algo:'Insertion Sort', title:'Sort the Front',
      statement:'Given an array and a number <code>k</code>, sort only the <strong>first k elements</strong> using the sliding technique. Leave the rest of the array untouched. Return the full array.',
      fn:'sortFront',
      starter:`function sortFront(arr, k) {
  // Sort only the first k elements by sliding. Return the full array.
  return arr;
}`,
      tests:[{input:[[5,3,1,4,2],3], expected:[1,3,5,4,2]}, {input:[[9,7,8,6],2], expected:[7,9,8,6]}, {input:[[4,3,2,1],4], expected:[1,2,3,4]}, {input:[[1,2,3],1], expected:[1,2,3]}]
    }
  ];

  let practiceProblems = PRACTICE_PROBLEMS.slice();
  let practiceActiveIndex = 0;
  let practiceLanguage = 'javascript';
  let practiceSolved = new Set();
  try { practiceSolved = new Set(JSON.parse(localStorage.getItem(PRACTICE_KEY) || '[]')); } catch (e) { practiceSolved = new Set(); }

  function shuffleProblems(list){
    for (let i = list.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  function practiceDisplay(value){
    if (value === undefined) return 'undefined';
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }
  function practiceEqual(actual, expected){
    return practiceDisplay(actual) === practiceDisplay(expected);
  }
  function updatePracticeProgress(){
    practiceProgress.textContent = 'Solved ' + practiceSolved.size + '/10';
  }
  function practiceStarter(problem, language){
    const names = {
      'neighbor-swap':['neighborSwap','arr'], 'reverse-neighbors':['flipLine','arr'],
      'lazy-pass':['lazyWorker','arr'], 'pick-the-smallest':['trophyShelf','arr'],
      'pick-the-largest':['lastOneStanding','arr'], 'how-many-picks':['countMoves','arr'],
      'slide-into-place':['cardHand','arr'], 'reverse-slide':['tallestFirst','arr'],
      'how-many-slides':['shiftCounter','arr'], 'partial-hand':['sortFront','arr, k']
    }[problem.id];
    if (language === 'javascript') return problem.starter;
    if (language === 'python') return 'def ' + names[0] + '(' + names[1] + '):\n    # Return the requested result.\n    pass';
    const returnsNumber = problem.id === 'how-many-picks' || problem.id === 'how-many-slides';
    const cppArgs = problem.id === 'partial-hand' ? 'vector<int> arr, int k' : 'vector<int> arr';
    const javaArgs = problem.id === 'partial-hand' ? 'int[] arr, int k' : 'int[] arr';
    if (language === 'cpp') return '#include <vector>\nusing namespace std;\n\n' + (returnsNumber ? 'int ' : 'vector<int> ') + names[0] + '(' + cppArgs + ') {\n    // Return the requested result.\n    ' + (returnsNumber ? 'return 0;' : 'return arr;') + '\n}';
    return 'import java.util.*;\n\nclass Solution {\n    public static ' + (returnsNumber ? 'int ' : 'int[] ') + names[0] + '(' + javaArgs + ') {\n        // Return the requested result.\n        ' + (returnsNumber ? 'return 0;' : 'return arr;') + '\n    }\n}';
  }
  function renderPracticeList(){
    practiceList.innerHTML = practiceProblems.map((problem, index) => {
      const solved = practiceSolved.has(problem.id);
      return '<button class="practice-item ' + (index === practiceActiveIndex ? 'active ' : '') + (solved ? 'solved' : '') + '" data-practice-index="' + index + '">' +
        '<span class="practice-number">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="practice-item-title">' + problem.title + '</span>' +
        '<span class="practice-status">' + (solved ? '✓' : '·') + '</span></button>';
    }).join('');
    updatePracticeProgress();
  }
  function renderTestCases(problem, results){
    return '<div class="tests-label">Test cases</div><div class="test-list">' + problem.tests.map((test, index) => {
      const result = results && results[index];
      const passed = result && result.passed;
      const io = result && !passed ? '<div class="test-io">Actual: <code>' + practiceDisplay(result.actual) + '</code><br>Expected: <code>' + practiceDisplay(test.expected) + '</code></div>' : '';
      return '<div class="test-case"><div class="test-case-head"><span>Case ' + (index + 1) + ' · Input <span class="test-io"><code>' + practiceDisplay(test.input) + '</code></span></span><span class="test-result ' + (result ? (passed ? 'pass' : 'fail') : '') + '">' + (result ? (passed ? 'Pass ✓' : 'Fail ✗') : 'Not run') + '</span></div>' + io + '</div>';
    }).join('') + '</div>';
  }
  function renderPracticeProblem(){
    const problem = practiceProblems[practiceActiveIndex];
    const solved = practiceSolved.has(problem.id);
    const starter = practiceStarter(problem, practiceLanguage).replace(/</g, '&lt;');
    const canRun = true;
    practiceWorkspace.innerHTML = '<div class="practice-heading"><h2>' + problem.title + '</h2><span class="algo-tag">' + problem.algo + '</span></div>' +
      '<p class="practice-statement">' + problem.statement + '</p>' +
      '<div class="practice-editor-head"><div class="editor-label">Your solution</div><select class="language-select" id="practiceLanguage" aria-label="Practice language"><option value="javascript" ' + (practiceLanguage === 'javascript' ? 'selected' : '') + '>JavaScript</option><option value="python" ' + (practiceLanguage === 'python' ? 'selected' : '') + '>Python</option><option value="cpp" ' + (practiceLanguage === 'cpp' ? 'selected' : '') + '>C++</option><option value="java" ' + (practiceLanguage === 'java' ? 'selected' : '') + '>Java</option></select></div>' +
      '<textarea class="code-editor" id="practiceEditor" spellcheck="false" aria-label="Practice solution">' + starter + '</textarea>' +
      '<div class="practice-actions"><button class="btn primary" id="practiceRunBtn">▶ Run</button><button class="btn ghost" id="practiceSubmitBtn" disabled>✓ Submit</button><span class="run-status" id="practiceRunStatus">Run all tests before submitting.</span></div>' +
      '<div id="practiceTests">' + renderTestCases(problem, null) + '</div>' +
      (solved ? '<div class="solved-note">Solved ✓ This problem is complete.</div>' : '');
    document.getElementById('practiceLanguage').addEventListener('change', event => {
      practiceLanguage = event.target.value;
      renderPracticeProblem();
    });
    document.getElementById('practiceRunBtn').addEventListener('click', runPracticeTests);
    document.getElementById('practiceSubmitBtn').addEventListener('click', submitPracticeProblem);
  }
  function selectPractice(index){
    practiceActiveIndex = index;
    renderPracticeList();
    renderPracticeProblem();
  }
  function runPracticeTests(){
    const problem = practiceProblems[practiceActiveIndex];
    const editor = document.getElementById('practiceEditor');
    const runBtn = document.getElementById('practiceRunBtn');
    const status = document.getElementById('practiceRunStatus');
    runBtn.disabled = true;
    status.textContent = 'Running tests...';
    const showResults = results => {
      const passedAll = results.every(result => result.passed);
      document.getElementById('practiceTests').innerHTML = renderTestCases(problem, results);
      document.getElementById('practiceSubmitBtn').disabled = !passedAll;
      status.textContent = passedAll ? 'All tests pass. Submit when ready.' : 'Some tests failed. Keep going.';
      runBtn.disabled = false;
    };
    if (practiceLanguage !== 'javascript'){
      fetch('/api/run', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({language:practiceLanguage, problemId:problem.id, fn:problem.fn, code:editor.value, tests:problem.tests})})
        .then(response => response.text().then(text => {
          let data;
          try { data = JSON.parse(text); }
          catch (e) { throw new Error('The Practice runner is unavailable on this deployment. Use the local server.'); }
          return {ok:response.ok, data:data};
        }))
        .then(result => { if (!result.ok || result.data.error) throw new Error(result.data.error || 'The local runner failed.'); showResults(result.data.results); })
        .catch(error => { status.textContent = error.message; runBtn.disabled = false; });
      return;
    }
    const workerSource = `self.onmessage = function(event) {
  const data = event.data;
  try {
    const getSolution = new Function('"use strict";\\n' + data.code + '\\nreturn ' + data.fn);
    const solution = getSolution();
    if (typeof solution !== 'function') throw new Error('Define ' + data.fn + ' as a function.');
    const results = data.tests.map(function(test) {
      const actual = solution.apply(null, JSON.parse(JSON.stringify(test.input)));
      return { actual: actual, passed: JSON.stringify(actual) === JSON.stringify(test.expected) };
    });
    self.postMessage({results: results});
  } catch (error) { self.postMessage({error: error.message || String(error)}); }
};`;
    const workerUrl = URL.createObjectURL(new Blob([workerSource], {type:'text/javascript'}));
    const worker = new Worker(workerUrl);
    let finished = false;
    const finish = (callback) => { if (finished) return; finished = true; clearTimeout(timeout); worker.terminate(); URL.revokeObjectURL(workerUrl); callback(); };
    const timeout = setTimeout(() => finish(() => {
      status.textContent = 'Timed out. Check for an infinite loop.';
      runBtn.disabled = false;
    }), 2000);
    worker.onmessage = event => finish(() => {
      if (event.data.error){
        status.textContent = event.data.error;
        document.getElementById('practiceTests').innerHTML = renderTestCases(problem, null);
        runBtn.disabled = false;
        return;
      }
      showResults(event.data.results);
    });
    worker.postMessage({code: editor.value, fn: problem.fn, tests: problem.tests});
  }
  function submitPracticeProblem(){
    const problem = practiceProblems[practiceActiveIndex];
    practiceSolved.add(problem.id);
    localStorage.setItem(PRACTICE_KEY, JSON.stringify([...practiceSolved]));
    renderPracticeList();
    renderPracticeProblem();
  }
  practiceList.addEventListener('click', event => {
    const item = event.target.closest('[data-practice-index]');
    if (item) selectPractice(Number(item.dataset.practiceIndex));
  });
  shuffleProblems(practiceProblems);
  renderPracticeList();
  renderPracticeProblem();

  // ---------- shared timing helpers ----------
  function speedDelay(){
    const v = Number(speedSlider.value);
    const x = (v - 1) / 99; // 0 (slowest) -> 1 (fastest)
    return Math.max(2, Math.round(2 + 600 * Math.pow(1 - x, 2)));
  }
  function updateSpeedLabel(){
    const v = Number(speedSlider.value);
    speedVal.textContent = v > 85 ? 'Very Fast' : v > 60 ? 'Fast' : v > 35 ? 'Moderate' : v > 15 ? 'Slow' : 'Very Slow';
  }
  function rawSleep(ms){ return new Promise(r => setTimeout(r, ms)); }
  function waitIfPaused(){ if (!paused) return Promise.resolve(); return new Promise(resolve => pauseResolvers.push(resolve)); }
  function resumeAll(){ pauseResolvers.forEach(r => r()); pauseResolvers = []; }
  async function step(ms){ await waitIfPaused(); await rawSleep(ms); }

  // ================= SINGLE MODE =================

  function incComp(){ comparisons++; compStat.textContent = comparisons; trackLog.push({c: comparisons, s: swaps}); }
  function incSwap(){ swaps++; swapStat.textContent = swaps; trackLog.push({c: comparisons, s: swaps}); }

  function renderArray(){
    chart.innerHTML = '';
    chart.classList.toggle('dense', array.length > 70);
    bars = []; labels = [];
    array.forEach(() => {
      const col = document.createElement('div'); col.className = 'bar-col';
      const bar = document.createElement('div'); bar.className = 'bar';
      const label = document.createElement('span'); label.className = 'bar-label';
      col.appendChild(bar); col.appendChild(label);
      chart.appendChild(col);
      bars.push(bar); labels.push(label);
    });
    array.forEach((val, i) => updateBar(i, val));
  }
  function updateBar(i, val){
    const pct = Math.max(2, (val / maxVal) * 100);
    if (bars[i]) bars[i].style.height = pct + '%';
    if (labels[i]){ labels[i].textContent = val; labels[i].style.bottom = 'calc(' + pct + '% + 4px)'; }
  }
  function markClass(i, cls){ if (bars[i]) bars[i].className = 'bar ' + cls; }
  function clearClass(i){ if (bars[i]) bars[i].className = 'bar'; }
  function markSorted(i){ if (bars[i]) bars[i].className = 'bar sorted'; }

  function newRandomArray(){
    const size = Number(sizeSlider.value);
    array = Array.from({length: size}, () => Math.floor(Math.random() * 96) + 4);
    maxVal = Math.max(...array);
    customInput.value = ''; customError.textContent = '';
    renderArray(); resetStats();
    hideTrackChart(); hideComplexityCard();
  }
  function applyCustomArray(){
    const raw = customInput.value.trim();
    if (!raw){ customError.textContent = 'Enter at least one number.'; return; }
    const parts = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (parts.length > MAX_SIZE){ customError.textContent = 'Max array size is ' + MAX_SIZE + ' values.'; return; }
    const nums = parts.map(Number);
    if (nums.some(n => Number.isNaN(n) || n < 0 || n > 9999)){ customError.textContent = 'Only numbers between 0 and 9999, comma-separated.'; return; }
    if (nums.length < 2){ customError.textContent = 'Enter at least 2 values.'; return; }
    customError.textContent = '';
    array = nums; maxVal = Math.max(...array);
    sizeSlider.value = array.length; sizeVal.textContent = array.length + ' bars';
    renderArray(); resetStats();
    hideTrackChart(); hideComplexityCard();
  }
  function resetStats(){ comparisons = 0; swaps = 0; compStat.textContent = '0'; swapStat.textContent = '0'; timeStat.textContent = '0 ms'; trackLog = []; }
  function hideTrackChart(){ trackCard.classList.remove('visible'); trackSvg.innerHTML = ''; }

  function renderTrackChart(){
    if (arenaMode || !trackLog.length) return;
    const W = 640, H = 180, PAD_L = 34, PAD_B = 20, PAD_T = 10, PAD_R = 10;
    const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
    let pts = trackLog;
    const MAX_PTS = 400;
    if (pts.length > MAX_PTS){
      const stride = pts.length / MAX_PTS;
      const sampled = [];
      for (let i = 0; i < MAX_PTS; i++) sampled.push(pts[Math.floor(i * stride)]);
      sampled.push(pts[pts.length - 1]);
      pts = sampled;
    }
    const finalC = pts[pts.length - 1].c;
    const finalS = pts[pts.length - 1].s;
    const maxY = Math.max(finalC, finalS, 1);
    const xAt = (i) => PAD_L + (i / (pts.length - 1 || 1)) * innerW;
    const yAt = (v) => PAD_T + innerH - (v / maxY) * innerH;
    const compPoints = pts.map((p, i) => xAt(i).toFixed(1) + ',' + yAt(p.c).toFixed(1)).join(' ');
    const swapPoints = pts.map((p, i) => xAt(i).toFixed(1) + ',' + yAt(p.s).toFixed(1)).join(' ');
    const css = getComputedStyle(document.documentElement);
    const accentColor = css.getPropertyValue('--accent').trim();
    const swapColor = css.getPropertyValue('--swapping').trim();
    const dimColor = css.getPropertyValue('--ink-dim').trim();
    const gridColor = css.getPropertyValue('--border').trim();
    let svg = '';
    [0, 0.5, 1].forEach(f => {
      const y = PAD_T + innerH - f * innerH;
      svg += `<line x1="${PAD_L}" y1="${y}" x2="${W-PAD_R}" y2="${y}" stroke="${gridColor}" stroke-width="1" />`;
      svg += `<text x="${PAD_L - 6}" y="${y + 3}" text-anchor="end" class="track-axis-label" fill="${dimColor}">${Math.round(maxY * f)}</text>`;
    });
    svg += `<line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${H-PAD_B}" stroke="${gridColor}" stroke-width="1" />`;
    svg += `<line x1="${PAD_L}" y1="${H-PAD_B}" x2="${W-PAD_R}" y2="${H-PAD_B}" stroke="${gridColor}" stroke-width="1" />`;
    svg += `<text x="${PAD_L}" y="${H-4}" class="track-axis-label" fill="${dimColor}">start</text>`;
    svg += `<text x="${W-PAD_R}" y="${H-4}" text-anchor="end" class="track-axis-label" fill="${dimColor}">finish</text>`;
    svg += `<polyline points="${compPoints}" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />`;
    svg += `<polyline points="${swapPoints}" fill="none" stroke="${swapColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />`;
    trackSvg.innerHTML = svg;
    trackSub.textContent = finalC + ' comparisons and ' + finalS + ' swaps across ' + array.length + ' elements';
    trackCard.classList.add('visible');
  }

  async function bubbleSort(id){
    const n = array.length;
    for (let i = 0; i < n - 1; i++){
      for (let j = 0; j < n - i - 1; j++){
        if (id !== runId) return;
        markClass(j, 'comparing'); markClass(j+1, 'comparing');
        incComp();
        await step(speedDelay()); if (id !== runId) return;
        if (array[j] > array[j+1]){
          [array[j], array[j+1]] = [array[j+1], array[j]];
          updateBar(j, array[j]); updateBar(j+1, array[j+1]);
          markClass(j, 'swapping'); markClass(j+1, 'swapping');
          incSwap();
          await step(speedDelay()); if (id !== runId) return;
        }
        clearClass(j); clearClass(j+1);
      }
      markSorted(n - i - 1);
    }
    markSorted(0);
  }
  async function selectionSort(id){
    const n = array.length;
    for (let i = 0; i < n - 1; i++){
      let minIdx = i;
      markClass(i, 'comparing');
      for (let j = i + 1; j < n; j++){
        if (id !== runId) return;
        markClass(j, 'comparing');
        incComp();
        await step(speedDelay()); if (id !== runId) return;
        if (array[j] < array[minIdx]){
          if (minIdx !== i) clearClass(minIdx);
          minIdx = j; markClass(minIdx, 'comparing');
        } else if (j !== minIdx){ clearClass(j); }
      }
      if (minIdx !== i){
        [array[i], array[minIdx]] = [array[minIdx], array[i]];
        updateBar(i, array[i]); updateBar(minIdx, array[minIdx]);
        markClass(i, 'swapping'); markClass(minIdx, 'swapping');
        incSwap();
        await step(speedDelay()); if (id !== runId) return;
      }
      clearClass(i); clearClass(minIdx);
      markSorted(i);
    }
    markSorted(n - 1);
  }
  async function insertionSort(id){
    const n = array.length; markSorted(0);
    for (let i = 1; i < n; i++){
      let key = array[i]; let j = i - 1;
      markClass(i, 'comparing');
      await step(speedDelay()); if (id !== runId) return;
      while (j >= 0 && array[j] > key){
        if (id !== runId) return;
        incComp();
        markClass(j, 'swapping');
        array[j+1] = array[j]; updateBar(j+1, array[j+1]);
        incSwap();
        await step(speedDelay()); if (id !== runId) return;
        markSorted(j+1); j--;
      }
      incComp();
      array[j+1] = key; updateBar(j+1, key);
      incSwap();
      for (let k = 0; k <= i; k++) markSorted(k);
    }
  }
  async function heapSort(id){
    const n = array.length;
    async function heapify(size, root){
      let largest = root, l = 2*root+1, r = 2*root+2;
      if (id !== runId) return;
      markClass(root, 'comparing');
      if (l < size){ markClass(l, 'comparing'); incComp(); if (array[l] > array[largest]) largest = l; }
      if (r < size){ markClass(r, 'comparing'); incComp(); if (array[r] > array[largest]) largest = r; }
      await step(speedDelay()); if (id !== runId) return;
      clearClass(root); if (l < size) clearClass(l); if (r < size) clearClass(r);
      if (largest !== root){
        [array[root], array[largest]] = [array[largest], array[root]];
        updateBar(root, array[root]); updateBar(largest, array[largest]);
        markClass(root, 'swapping'); markClass(largest, 'swapping');
        incSwap();
        await step(speedDelay()); if (id !== runId) return;
        clearClass(root); clearClass(largest);
        await heapify(size, largest);
      }
    }
    for (let i = Math.floor(n/2) - 1; i >= 0; i--){ if (id !== runId) return; await heapify(n, i); }
    for (let i = n - 1; i > 0; i--){
      if (id !== runId) return;
      [array[0], array[i]] = [array[i], array[0]];
      updateBar(0, array[0]); updateBar(i, array[i]);
      markClass(0, 'swapping'); markClass(i, 'swapping');
      incSwap();
      await step(speedDelay()); if (id !== runId) return;
      markSorted(i); clearClass(0);
      await heapify(i, 0);
    }
    markSorted(0);
  }
  async function quickSort(id, lo=0, hi=array.length-1){
    if (lo >= hi){ if (lo === hi) markSorted(lo); return; }
    if (id !== runId) return;
    const pivotVal = array[hi];
    markClass(hi, 'pivot');
    let i = lo - 1;
    for (let j = lo; j < hi; j++){
      if (id !== runId) return;
      markClass(j, 'comparing');
      incComp();
      await step(speedDelay()); if (id !== runId) return;
      if (array[j] < pivotVal){
        i++;
        [array[i], array[j]] = [array[j], array[i]];
        updateBar(i, array[i]); updateBar(j, array[j]);
        markClass(i, 'swapping'); markClass(j, 'swapping');
        incSwap();
        await step(speedDelay()); if (id !== runId) return;
      }
      clearClass(j); if (i !== hi) clearClass(i);
    }
    [array[i+1], array[hi]] = [array[hi], array[i+1]];
    updateBar(i+1, array[i+1]); updateBar(hi, array[hi]);
    clearClass(hi); markSorted(i+1);
    await step(speedDelay()); if (id !== runId) return;
    await quickSort(id, lo, i);
    await quickSort(id, i+2, hi);
  }
  async function mergeSort(id, lo=0, hi=array.length-1){
    if (lo >= hi) return;
    const mid = Math.floor((lo+hi)/2);
    await mergeSort(id, lo, mid); if (id !== runId) return;
    await mergeSort(id, mid+1, hi); if (id !== runId) return;
    let left = array.slice(lo, mid+1); let right = array.slice(mid+1, hi+1);
    let i=0, j=0, k=lo;
    while (i < left.length && j < right.length){
      if (id !== runId) return;
      markClass(k, 'comparing');
      incComp();
      await step(speedDelay()); if (id !== runId) return;
      if (left[i] <= right[j]){ array[k] = left[i]; i++; } else { array[k] = right[j]; j++; }
      updateBar(k, array[k]);
      markClass(k, 'swapping');
      incSwap();
      await step(speedDelay()); if (id !== runId) return;
      clearClass(k); k++;
    }
    while (i < left.length){
      if (id !== runId) return;
      array[k] = left[i]; updateBar(k, array[k]);
      markClass(k, 'swapping'); incSwap();
      await step(speedDelay()); if (id !== runId) return; clearClass(k);
      i++; k++;
    }
    while (j < right.length){
      if (id !== runId) return;
      array[k] = right[j]; updateBar(k, array[k]);
      markClass(k, 'swapping'); incSwap();
      await step(speedDelay()); if (id !== runId) return; clearClass(k);
      j++; k++;
    }
    if (lo === 0 && hi === array.length - 1){ for (let x = 0; x < array.length; x++) markSorted(x); }
  }

  const RUNNERS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, heap: heapSort, quick: quickSort, merge: mergeSort };

  async function runSort(){
    if (sorting) return;
    sorting = true; paused = false;
    setSortingControls(); resetStats(); hideTrackChart(); hideComplexityCard();
    lastInitialSnapshot = array.slice();
    runId++; const id = runId;
    const start = performance.now();
    await RUNNERS[currentAlgo](id);
    const end = performance.now();
    if (id === runId){
      timeStat.textContent = (end - start).toFixed(2) + ' ms';
      for (let x = 0; x < bars.length; x++) markSorted(x);
      renderTrackChart();
      renderComplexityCard(currentAlgo, lastInitialSnapshot, comparisons, array.length);
    }
    sorting = false; setIdleControls();
  }
  function stopSort(){
    if (!sorting) return;
    runId++; if (paused){ paused = false; resumeAll(); }
    sorting = false; setIdleControls();
    renderTrackChart();
    if (lastInitialSnapshot) renderComplexityCard(currentAlgo, lastInitialSnapshot, comparisons, array.length);
  }

  // ================= BATTLE ARENA MODE =================

  function updateBarA(inst, i, val){
    const pct = Math.max(2, (val / inst.maxVal) * 100);
    if (inst.bars[i]) inst.bars[i].style.height = pct + '%';
  }
  function markA(inst, i, cls){ if (inst.bars[i]) inst.bars[i].className = 'arena-bar ' + cls; }
  function clearA(inst, i){ if (inst.bars[i]) inst.bars[i].className = 'arena-bar'; }
  function sortedA(inst, i){ if (inst.bars[i]) inst.bars[i].className = 'arena-bar sorted'; }
  function incCompA(inst){ inst.comparisons++; inst.compEl.textContent = inst.comparisons; }
  function incSwapA(inst){ inst.swaps++; inst.swapEl.textContent = inst.swaps; }

  function buildArena(regenerate){
    if (regenerate){
      const size = Math.min(Number(sizeSlider.value), MAX_SIZE);
      arenaBaseArray = Array.from({length: size}, () => Math.floor(Math.random() * 96) + 4);
    }
    const maxV = Math.max(...arenaBaseArray);
    arenaGrid.innerHTML = '';
    leaderboardBody.innerHTML = '';
    arenaInstances = ALGO_LIST.map(a => {
      const inst = {
        key: a.key, name: a.name, array: arenaBaseArray.slice(), maxVal: maxV,
        bars: [], comparisons: 0, swaps: 0, finished: false, rank: 0, startTime: 0, endTime: 0
      };
      // panel
      const panel = document.createElement('div');
      panel.className = 'arena-panel';
      panel.innerHTML = '<div class="arena-panel-head"><span class="arena-panel-name">' + a.name + '</span><span class="arena-panel-status" id="status-' + a.key + '">⏳</span></div><div class="arena-chart" id="chart-' + a.key + '"></div>';
      arenaGrid.appendChild(panel);
      const chartEl = panel.querySelector('#chart-' + a.key);
      inst.array.forEach(val => {
        const bar = document.createElement('div');
        bar.className = 'arena-bar';
        bar.style.height = Math.max(2, (val / maxV) * 100) + '%';
        chartEl.appendChild(bar);
        inst.bars.push(bar);
      });
      inst.panelStatusEl = panel.querySelector('#status-' + a.key);

      // leaderboard row
      const row = document.createElement('tr');
      row.id = 'lb-' + a.key;
      row.innerHTML = '<td class="lb-name">' + a.name + '</td><td class="lb-time">--</td><td class="lb-swap">0</td><td class="lb-comp">0</td><td class="lb-status">⏳</td>';
      leaderboardBody.appendChild(row);
      inst.timeEl = row.querySelector('.lb-time');
      inst.swapEl = row.querySelector('.lb-swap');
      inst.compEl = row.querySelector('.lb-comp');
      inst.statusEl = row.querySelector('.lb-status');
      inst.rowEl = row;
      return inst;
    });
  }

  function resetArenaForRun(){
    arenaInstances.forEach(inst => {
      inst.array = arenaBaseArray.slice();
      inst.comparisons = 0; inst.swaps = 0; inst.finished = false; inst.rank = 0;
      inst.startTime = 0; inst.endTime = 0;
      inst.compEl.textContent = '0'; inst.swapEl.textContent = '0';
      inst.timeEl.textContent = '--'; inst.statusEl.textContent = '⏳';
      inst.panelStatusEl.textContent = '⏳';
      inst.array.forEach((val, i) => { updateBarA(inst, i, val); clearA(inst, i); });
    });
  }

  const RANK_MEDALS = ['🥇', '🥈', '🥉'];
  let finishedCount = 0;

  function markFinished(inst){
    inst.finished = true;
    inst.endTime = performance.now();
    finishedCount++;
    inst.rank = finishedCount;
    const label = inst.rank <= 3 ? RANK_MEDALS[inst.rank - 1] : ('#' + inst.rank + ' ✅');
    inst.statusEl.textContent = label;
    inst.panelStatusEl.textContent = inst.rank <= 3 ? RANK_MEDALS[inst.rank - 1] : '✅';
    inst.timeEl.textContent = Math.round(inst.endTime - inst.startTime) + ' ms';
    reorderLeaderboard();
  }

  function reorderLeaderboard(){
    const sorted = [...arenaInstances].sort((a, b) => {
      if (a.finished && b.finished) return a.rank - b.rank;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return 0;
    });
    sorted.forEach(inst => leaderboardBody.appendChild(inst.rowEl));
  }

  // Generic algorithms operating on an arena instance
  async function arenaBubble(inst, id){
    const arr = inst.array; const n = arr.length;
    for (let i = 0; i < n - 1; i++){
      for (let j = 0; j < n - i - 1; j++){
        if (id !== arenaRunId) return;
        markA(inst, j, 'comparing'); markA(inst, j+1, 'comparing');
        incCompA(inst);
        await step(speedDelay()); if (id !== arenaRunId) return;
        if (arr[j] > arr[j+1]){
          [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
          updateBarA(inst, j, arr[j]); updateBarA(inst, j+1, arr[j+1]);
          markA(inst, j, 'swapping'); markA(inst, j+1, 'swapping');
          incSwapA(inst);
          await step(speedDelay()); if (id !== arenaRunId) return;
        }
        clearA(inst, j); clearA(inst, j+1);
      }
      sortedA(inst, n - i - 1);
    }
    sortedA(inst, 0);
  }
  async function arenaSelection(inst, id){
    const arr = inst.array; const n = arr.length;
    for (let i = 0; i < n - 1; i++){
      let minIdx = i;
      markA(inst, i, 'comparing');
      for (let j = i + 1; j < n; j++){
        if (id !== arenaRunId) return;
        markA(inst, j, 'comparing');
        incCompA(inst);
        await step(speedDelay()); if (id !== arenaRunId) return;
        if (arr[j] < arr[minIdx]){
          if (minIdx !== i) clearA(inst, minIdx);
          minIdx = j; markA(inst, minIdx, 'comparing');
        } else if (j !== minIdx){ clearA(inst, j); }
      }
      if (minIdx !== i){
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        updateBarA(inst, i, arr[i]); updateBarA(inst, minIdx, arr[minIdx]);
        markA(inst, i, 'swapping'); markA(inst, minIdx, 'swapping');
        incSwapA(inst);
        await step(speedDelay()); if (id !== arenaRunId) return;
      }
      clearA(inst, i); clearA(inst, minIdx);
      sortedA(inst, i);
    }
    sortedA(inst, n - 1);
  }
  async function arenaInsertion(inst, id){
    const arr = inst.array; const n = arr.length; sortedA(inst, 0);
    for (let i = 1; i < n; i++){
      let key = arr[i]; let j = i - 1;
      markA(inst, i, 'comparing');
      await step(speedDelay()); if (id !== arenaRunId) return;
      while (j >= 0 && arr[j] > key){
        if (id !== arenaRunId) return;
        incCompA(inst);
        markA(inst, j, 'swapping');
        arr[j+1] = arr[j]; updateBarA(inst, j+1, arr[j+1]);
        incSwapA(inst);
        await step(speedDelay()); if (id !== arenaRunId) return;
        sortedA(inst, j+1); j--;
      }
      incCompA(inst);
      arr[j+1] = key; updateBarA(inst, j+1, key);
      incSwapA(inst);
      for (let k = 0; k <= i; k++) sortedA(inst, k);
    }
  }
  async function arenaHeap(inst, id){
    const arr = inst.array; const n = arr.length;
    async function heapify(size, root){
      let largest = root, l = 2*root+1, r = 2*root+2;
      if (id !== arenaRunId) return;
      markA(inst, root, 'comparing');
      if (l < size){ markA(inst, l, 'comparing'); incCompA(inst); if (arr[l] > arr[largest]) largest = l; }
      if (r < size){ markA(inst, r, 'comparing'); incCompA(inst); if (arr[r] > arr[largest]) largest = r; }
      await step(speedDelay()); if (id !== arenaRunId) return;
      clearA(inst, root); if (l < size) clearA(inst, l); if (r < size) clearA(inst, r);
      if (largest !== root){
        [arr[root], arr[largest]] = [arr[largest], arr[root]];
        updateBarA(inst, root, arr[root]); updateBarA(inst, largest, arr[largest]);
        markA(inst, root, 'swapping'); markA(inst, largest, 'swapping');
        incSwapA(inst);
        await step(speedDelay()); if (id !== arenaRunId) return;
        clearA(inst, root); clearA(inst, largest);
        await heapify(size, largest);
      }
    }
    for (let i = Math.floor(n/2) - 1; i >= 0; i--){ if (id !== arenaRunId) return; await heapify(n, i); }
    for (let i = n - 1; i > 0; i--){
      if (id !== arenaRunId) return;
      [arr[0], arr[i]] = [arr[i], arr[0]];
      updateBarA(inst, 0, arr[0]); updateBarA(inst, i, arr[i]);
      markA(inst, 0, 'swapping'); markA(inst, i, 'swapping');
      incSwapA(inst);
      await step(speedDelay()); if (id !== arenaRunId) return;
      sortedA(inst, i); clearA(inst, 0);
      await heapify(i, 0);
    }
    sortedA(inst, 0);
  }
  async function arenaQuick(inst, id, lo, hi){
    const arr = inst.array;
    if (lo === undefined){ lo = 0; hi = arr.length - 1; }
    if (lo >= hi){ if (lo === hi) sortedA(inst, lo); return; }
    if (id !== arenaRunId) return;
    const pivotVal = arr[hi];
    markA(inst, hi, 'comparing');
    let i = lo - 1;
    for (let j = lo; j < hi; j++){
      if (id !== arenaRunId) return;
      markA(inst, j, 'comparing');
      incCompA(inst);
      await step(speedDelay()); if (id !== arenaRunId) return;
      if (arr[j] < pivotVal){
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        updateBarA(inst, i, arr[i]); updateBarA(inst, j, arr[j]);
        markA(inst, i, 'swapping'); markA(inst, j, 'swapping');
        incSwapA(inst);
        await step(speedDelay()); if (id !== arenaRunId) return;
      }
      clearA(inst, j); if (i !== hi) clearA(inst, i);
    }
    [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
    updateBarA(inst, i+1, arr[i+1]); updateBarA(inst, hi, arr[hi]);
    clearA(inst, hi); sortedA(inst, i+1);
    await step(speedDelay()); if (id !== arenaRunId) return;
    await arenaQuick(inst, id, lo, i);
    await arenaQuick(inst, id, i+2, hi);
  }
  async function arenaMerge(inst, id, lo, hi){
    const arr = inst.array;
    if (lo === undefined){ lo = 0; hi = arr.length - 1; }
    if (lo >= hi) return;
    const mid = Math.floor((lo+hi)/2);
    await arenaMerge(inst, id, lo, mid); if (id !== arenaRunId) return;
    await arenaMerge(inst, id, mid+1, hi); if (id !== arenaRunId) return;
    let left = arr.slice(lo, mid+1); let right = arr.slice(mid+1, hi+1);
    let i=0, j=0, k=lo;
    while (i < left.length && j < right.length){
      if (id !== arenaRunId) return;
      markA(inst, k, 'comparing');
      incCompA(inst);
      await step(speedDelay()); if (id !== arenaRunId) return;
      if (left[i] <= right[j]){ arr[k] = left[i]; i++; } else { arr[k] = right[j]; j++; }
      updateBarA(inst, k, arr[k]);
      markA(inst, k, 'swapping');
      incSwapA(inst);
      await step(speedDelay()); if (id !== arenaRunId) return;
      clearA(inst, k); k++;
    }
    while (i < left.length){
      if (id !== arenaRunId) return;
      arr[k] = left[i]; updateBarA(inst, k, arr[k]);
      markA(inst, k, 'swapping'); incSwapA(inst);
      await step(speedDelay()); if (id !== arenaRunId) return; clearA(inst, k);
      i++; k++;
    }
    while (j < right.length){
      if (id !== arenaRunId) return;
      arr[k] = right[j]; updateBarA(inst, k, arr[k]);
      markA(inst, k, 'swapping'); incSwapA(inst);
      await step(speedDelay()); if (id !== arenaRunId) return; clearA(inst, k);
      j++; k++;
    }
    if (lo === 0 && hi === arr.length - 1){ for (let x = 0; x < arr.length; x++) sortedA(inst, x); }
  }

  const ARENA_RUNNERS = { bubble: arenaBubble, selection: arenaSelection, insertion: arenaInsertion, heap: arenaHeap, quick: arenaQuick, merge: arenaMerge };

  async function runArena(){
    if (arenaRunning) return;
    arenaRunning = true; paused = false;
    setSortingControls();
    resetArenaForRun();
    finishedCount = 0;
    arenaRunId++; const id = arenaRunId;

    arenaTimer = setInterval(() => {
      arenaInstances.forEach(inst => {
        if (!inst.finished && inst.startTime) inst.timeEl.textContent = Math.round(performance.now() - inst.startTime) + ' ms';
      });
    }, 100);

    const races = arenaInstances.map(inst => {
      inst.startTime = performance.now();
      return ARENA_RUNNERS[inst.key](inst, id).then(() => {
        if (id === arenaRunId && !inst.finished) markFinished(inst);
      });
    });
    await Promise.all(races);

    clearInterval(arenaTimer); arenaTimer = null;
    arenaRunning = false; setIdleControls();
  }

  function stopArena(){
    if (!arenaRunning) return;
    arenaRunId++;
    if (paused){ paused = false; resumeAll(); }
    if (arenaTimer){ clearInterval(arenaTimer); arenaTimer = null; }
    arenaRunning = false; setIdleControls();
  }

  // ================= SHARED CONTROLS =================

  function setIdleControls(){
    sortBtn.disabled = false; shuffleBtn.disabled = false; sizeSlider.disabled = false;
    customInput.disabled = false; applyCustomBtn.disabled = false;
    pauseBtn.disabled = true; stopBtn.disabled = true; pauseBtn.textContent = '⏸ Pause';
    [...algoConsole.children].forEach(b => b.disabled = false);
    modeSingleBtn.disabled = false; modeArenaBtn.disabled = false; modeLearnBtn.disabled = false;
  }
  function setSortingControls(){
    sortBtn.disabled = true; shuffleBtn.disabled = true; sizeSlider.disabled = true;
    customInput.disabled = true; applyCustomBtn.disabled = true;
    pauseBtn.disabled = false; stopBtn.disabled = false;
    [...algoConsole.children].forEach(b => b.disabled = true);
    modeSingleBtn.disabled = true; modeArenaBtn.disabled = true; modeLearnBtn.disabled = true;
  }

  function togglePause(){
    const running = arenaMode ? arenaRunning : sorting;
    if (!running) return;
    if (!paused){ paused = true; pauseBtn.textContent = '▶ Resume'; }
    else { paused = false; pauseBtn.textContent = '⏸ Pause'; resumeAll(); }
  }

  algoConsole.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || sorting) return;
    [...algoConsole.children].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentAlgo = btn.dataset.algo;
    algoTitle.innerHTML = btn.dataset.name + ' <span class="algo-o">' + btn.dataset.o + '</span>';
    newRandomArray();
  });

  sizeSlider.addEventListener('input', () => {
    sizeVal.textContent = sizeSlider.value + ' bars';
    if (sorting || arenaRunning) return;
    if (arenaMode) buildArena(true); else newRandomArray();
  });
  speedSlider.addEventListener('input', updateSpeedLabel);
  shuffleBtn.addEventListener('click', () => {
    if (sorting || arenaRunning) return;
    if (arenaMode) buildArena(true); else newRandomArray();
  });
  sortBtn.addEventListener('click', () => { arenaMode ? runArena() : runSort(); });
  pauseBtn.addEventListener('click', togglePause);
  stopBtn.addEventListener('click', () => { arenaMode ? stopArena() : stopSort(); });
  applyCustomBtn.addEventListener('click', () => {
    if (sorting || arenaRunning) return;
    applyCustomArray();
    if (arenaMode){ arenaBaseArray = array.slice(); buildArena(false); }
  });

  updateSpeedLabel(); setIdleControls(); newRandomArray(); setMode('learn');
})();
