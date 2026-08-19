<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

<h1 align="center">
  🌀 SortVerse
</h1>

<p align="center">
  <b>Comparisons in, order out — watch algorithms think.</b>
</p>

<p align="center">
  <a href="https://sortverse.vercel.app">🔗 Live Demo</a> &nbsp;·&nbsp;
  <a href="#-features">✨ Features</a> &nbsp;·&nbsp;
  <a href="#-algorithms">🧮 Algorithms</a> &nbsp;·&nbsp;
  <a href="#-getting-started">🚀 Getting Started</a>
</p>

---

## 💡 What is SortVerse?

Ever stared at sorting algorithm pseudocode and thought *"cool, but what does it actually DO?"*

**SortVerse** turns that confusion into clarity. It's an interactive sorting algorithm visualizer that lets you **watch** algorithms think — bar by bar, comparison by comparison, swap by swap. No hand-wavy explanations. Just colorful bars doing their thing while you sit back and go *"ohhhh, so THAT'S how merge sort works."*

Whether you're a CS student cramming for exams, a self-taught developer filling in the fundamentals, or just someone who finds watching bars rearrange themselves oddly satisfying — SortVerse has you covered.

---

## 📸 Screenshots

<details>
<summary><b>📚 Learn Mode</b> — Video tutorials + one-click visualize</summary>
<br>
<img src="screenshots/learn-mode.png" alt="Learn Sorting Mode" width="100%" />
</details>

<details open>
<summary><b>🧍 Visualizer Mode</b> — Single algorithm deep-dive</summary>
<br>
<img src="screenshots/visualizer.png" alt="Algorithm Visualizer" width="100%" />
</details>

<details>
<summary><b>🏁 Battle Arena</b> — All six algorithms race head-to-head</summary>
<br>
<img src="screenshots/battle-arena.png" alt="Battle Arena" width="100%" />
</details>

<details>
<summary><b>🌙 Dark Mode</b> — Easy on the eyes, hard on the algorithms</summary>
<br>
<img src="screenshots/dark-mode.png" alt="Dark Mode" width="100%" />
</details>

<details>
<summary><b>🎯 Practice Mode</b> — Write, run, and submit sorting solutions</summary>
<br>
Practice Mode provides coding exercises with a built-in editor, visible test cases, and progress tracking.
</details>

---

## ✨ Features

| Feature | Description |
|---|---|
| 📚 **Learn Mode** | Curated YouTube tutorials for each algorithm with a "Visualize this →" button that drops you straight into the action |
| 🧍 **Single Visualizer** | Pick an algorithm, tweak the array size & speed, and watch it sort in real-time with color-coded bars |
| 🏁 **Battle Arena** | All 6 algorithms race the **same shuffled array** simultaneously — with a live leaderboard tracking time, swaps & comparisons |
| 🎯 **Practice Mode** | Solve 10 shuffled coding problems covering Bubble, Selection, Insertion, Merge, and Quick Sort |
| 📊 **Progress Chart** | SVG line chart showing how comparisons and swaps accumulate over time |
| 🧠 **Complexity Analysis** | After each sort, see best/avg/worst case complexities with a verdict on how your run measured up |
| 🎲 **Random & Custom Arrays** | Generate random arrays or type your own comma-separated values |
| ⏸️ **Pause / Resume / Stop** | Full playback control — pause mid-sort, resume, or kill it entirely |
| 🌙 **Dark Mode** | One-click theme toggle that doesn't reset your sort state |
| 📱 **Responsive** | Works on desktop, tablet, and mobile screens |

### 🎯 Practice Mode

Practice Mode turns sorting concepts into hands-on coding challenges. Each problem includes a short statement, starter template, 3–5 visible test cases, and a Run button that reports **Pass ✓** or **Fail ✗** with actual output on failures.

There are **10 total problems**, shuffled when the page loads:

| Algorithm | Practice Problems |
|---|---|
| **Bubble Sort** | Implement Bubble Sort; optimize it with early termination |
| **Selection Sort** | Implement Selection Sort; find the k-th smallest value |
| **Insertion Sort** | Implement Insertion Sort; insert into a sorted list |
| **Merge Sort** | Implement the merge step; count inversions |
| **Quick Sort** | Implement Lomuto-partition Quick Sort; find the k-th largest value |

Solutions can be written in **JavaScript, Python, C++, or Java**. JavaScript runs in an isolated browser worker; Python, C++, and Java run through the local `server.py` execution endpoint. Submit becomes available only after every test passes, and solved problems persist in `localStorage`.

---

## 🧮 Algorithms

SortVerse visualizes **6 classic sorting algorithms** — from the humble bubble to the mighty quicksort:

| # | Algorithm | Best | Average | Worst | Space | Vibe |
|:-:|-----------|:----:|:-------:|:-----:|:-----:|------|
| 01 | **Bubble Sort** | O(n) | O(n²) | O(n²) | O(1) | The friendly neighbor who checks every pair twice |
| 02 | **Selection Sort** | O(n²) | O(n²) | O(n²) | O(1) | The perfectionist who always picks the smallest first |
| 03 | **Insertion Sort** | O(n) | O(n²) | O(n²) | O(1) | The card player who keeps their hand sorted |
| 04 | **Heap Sort** | O(n log n) | O(n log n) | O(n log n) | O(1) | The tree-hugger with guaranteed performance |
| 05 | **Merge Sort** | O(n log n) | O(n log n) | O(n log n) | O(n) | The divide-and-conquer diplomat |
| 06 | **Quick Sort** | O(n log n) | O(n log n) | O(n²) | O(log n) | The speedster who occasionally trips |

---

## 🎨 Color Legend

While watching the visualizer, the bars change color to show what's happening under the hood:

| Color | Meaning |
|:-----:|---------|
| 🟣 **Purple** | Unsorted — just vibing, waiting their turn |
| 🟠 **Orange** | Comparing — "are you bigger than me?" |
| 🔴 **Red** | Swapping — the ol' switcheroo |
| 🟢 **Green** | Sorted — locked in, done deal ✅ |

---

## 🚀 Getting Started

SortVerse is a **zero-dependency** site. No npm install, no build step, no frameworks. The optional local Python server adds Practice execution for Python, C++, and Java.

### Run it locally

```bash
# Clone the repo
git clone https://github.com/ayush7AM/SortVerse.git

# Start it with the Practice runner
cd SortVerse
python3 server.py       # macOS, Python/C++/Java Practice runs
# or
open http://localhost:8080
```

Or just use a live server:

```bash
# Static-only server (JavaScript Practice only)
python3 -m http.server 8080

# With Node
npx serve .
```

### Deploy your own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ayush7AM/SortVerse)

---

## 🏗️ Project Structure

```
SortVerse/
├── index.html          # The entire UI — four views, one page
├── style.css           # Design system with light/dark themes
├── script.js           # Sorting, arena, and Practice UI logic
├── server.py           # Local Python/C++/Java Practice runner
├── screenshots/        # README screenshots
└── README.md           # You are here 👋
```

---

## 🤝 Contributing

Found a bug? Want to add a 7th algorithm? Have an idea that would make this even cooler?

1. **Fork** the repo
2. **Create** your feature branch → `git checkout -b feat/radix-sort`
3. **Commit** your changes → `git commit -m "Add radix sort visualization"`
4. **Push** to the branch → `git push origin feat/radix-sort`
5. **Open a Pull Request** 🎉

All contributions are welcome — from typo fixes to entirely new features.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <b>Built with 💜 and way too many comparisons.</b>
  <br><br>
  <a href="https://sortverse.vercel.app">
    <img src="https://img.shields.io/badge/Try_SortVerse-7C5CFC?style=for-the-badge&logoColor=white" alt="Try SortVerse" />
  </a>
</p>
