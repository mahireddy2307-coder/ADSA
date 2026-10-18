
"use strict";

// ---------- Common utilities ----------

const $ = (id) => document.getElementById(id);

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let sortRun = 0;
let searchRun = 0;
let graphRun = 0;

function parseNumbers(text) {
  const parts = text.split(",").map((s) => s.trim());

  if (
    parts.length === 0 ||
    parts.some((s) => s === "" || !Number.isFinite(Number(s)))
  ) {
    throw new Error("Enter valid numbers separated by commas.");
  }

  const values = parts.map(Number);

  if (values.length > 20) {
    throw new Error("Please use 20 numbers or fewer.");
  }

  return values;
}

function setMessage(id, message) {
  $(id).textContent = message;
}

// ---------- Navigation tabs ----------

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.classList.toggle("active", tab === button);
    });

    document.querySelectorAll(".panel").forEach((panel) => {
      panel.classList.toggle(
        "active",
        panel.id === button.dataset.panel
      );
    });
  });
});

// ---------- Sorting visualizer ----------

function renderBars(values, active = [], sorted = []) {
  const container = $("sortBars");
  container.replaceChildren();

  const max = Math.max(...values, 1);

  values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${Math.max(5, (value / max) * 85)}%`;

    if (active.includes(index)) bar.classList.add("comparing");
    if (sorted.includes(index)) bar.classList.add("sorted");

    const label = document.createElement("span");
    label.textContent = value;
    bar.appendChild(label);
    container.appendChild(bar);
  });
}

function loadSortNumbers() {
  sortRun++;
  try {
    const values = parseNumbers($("sortInput").value);
    renderBars(values);
    setMessage("sortStatus", "Numbers loaded");
    setMessage("sortStep", "0");
    setMessage("sortComparisons", "0");
    setMessage("sortExplanation", "Ready to sort " + values.length + " numbers.");
  } catch (error) {
    setMessage("sortStatus", error.message);
  }
}

$("loadSort").addEventListener("click", loadSortNumbers);

$("sortAlgorithm").addEventListener("change", () => {
  const isBubble = $("sortAlgorithm").value === "bubble";
  setMessage("sortComplexity", isBubble ? "O(n²) time" : "O(n²) time");
});

$("sortBtn").addEventListener("click", async () => {
  const run = ++sortRun;
  let values;

  try {
    values = parseNumbers($("sortInput").value);
  } catch (error) {
    setMessage("sortStatus", error.message);
    return;
  }

  const button = $("sortBtn");
  button.disabled = true;
  button.textContent = "Sorting...";

  let comparisons = 0;
  let step = 0;
  const n = values.length;
  const sorted = [];

  renderBars(values);

  function draw(active = []) {
    renderBars(values, active, sorted);
    setMessage("sortStep", String(step));
    setMessage("sortComparisons", String(comparisons));
  }

  try {
    setMessage("sortStatus", "Sorting in progress");
    const algorithm = $("sortAlgorithm").value;

    if (algorithm === "bubble") {
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          if (run !== sortRun) return;

          comparisons++;
          step++;
          draw([j, j + 1]);

          setMessage(
            "sortExplanation",
            `Compare ${values[j]} and ${values[j + 1]}.`
          );

          await sleep(450);
          if (run !== sortRun) return;

          if (values[j] > values[j + 1]) {
            [values[j], values[j + 1]] =
              [values[j + 1], values[j]];

            draw([j, j + 1]);
            setMessage("sortExplanation", "Swap the two values.");
            await sleep(250);
            if (run !== sortRun) return;
          }
        }

        sorted.push(n - i - 1);
      }
    } else {
      for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        for (let j = i + 1; j < n; j++) {
          if (run !== sortRun) return;

          comparisons++;
          step++;
          draw([minIndex, j]);

          setMessage(
            "sortExplanation",
            `Find the minimum between positions ${i + 1} and ${j + 1}.`
          );

          await sleep(450);
          if (run !== sortRun) return;

          if (values[j] < values[minIndex]) {
            minIndex = j;
          }
        }

        if (minIndex !== i) {
          [values[i], values[minIndex]] =
            [values[minIndex], values[i]];
        }

        sorted.push(i);
        draw([i]);
        await sleep(250);
        if (run !== sortRun) return;
      }
    }

    if (run !== sortRun) return;

    renderBars(values, [], values.map((_, i) => i));
    setMessage("sortStatus", "Sorting complete!");
    setMessage("sortExplanation", "All values are in ascending order.");
  } finally {
    if (run === sortRun) {
      button.disabled = false;
      button.textContent = "▶ Visualize";
    }
  }
});

// ---------- Searching visualizer ----------

function renderCells(values, current = -1, found = -1, eliminated = []) {
  const container = $("searchCells");
  container.replaceChildren();

  values.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = value;

    if (index === current) cell.classList.add("current");
    if (index === found) cell.classList.add("found");
    if (eliminated.includes(index)) cell.classList.add("eliminated");

    container.appendChild(cell);
  });
}

$("searchAlgorithm").addEventListener("change", () => {
  const isBinary = $("searchAlgorithm").value === "binary";
  setMessage(
    "searchComplexity",
    isBinary ? "O(log n) time" : "O(n) time"
  );
  setMessage(
    "searchExplanation",
    isBinary
      ? "Binary Search requires a sorted array."
      : "Linear Search checks values one by one."
  );
});

$("searchBtn").addEventListener("click", async () => {
  const run = ++searchRun;
  const button = $("searchBtn");

  let values;
  try {
    values = parseNumbers($("searchInput").value);
  } catch (error) {
    setMessage("searchStatus", error.message);
    return;
  }

  const targetText = $("targetInput").value.trim();
  const target = Number(targetText);

  if (targetText === "" || !Number.isFinite(target)) {
    setMessage("searchStatus", "Enter a valid target.");
    return;
  }

  const algorithm = $("searchAlgorithm").value;

  if (algorithm === "binary") {
    values.sort((a, b) => a - b);
    $("searchInput").value = values.join(", ");
  }

  button.disabled = true;
  button.textContent = "Searching...";

  let steps = 0;
  let found = -1;
  let eliminated = [];

  renderCells(values);
  setMessage("searchSteps", "0");
  setMessage("searchResult", "—");
  setMessage("searchResultText", "Searching...");
  setMessage("searchStatus", "Search in progress");

  try {
    if (algorithm === "linear") {
      for (let i = 0; i < values.length; i++) {
        if (run !== searchRun) return;

        steps++;
        renderCells(values, i, -1, eliminated);
        setMessage("searchSteps", String(steps));
        setMessage(
          "searchExplanation",
          `Check index ${i}: is ${values[i]} equal to ${target}?`
        );

        await sleep(550);
        if (run !== searchRun) return;

        if (values[i] === target) {
          found = i;
          break;
        }

        eliminated.push(i);
      }
    } else {
      let left = 0;
      let right = values.length - 1;

      while (left <= right) {
        if (run !== searchRun) return;

        const mid = Math.floor((left + right) / 2);
        steps++;

        renderCells(values, mid, -1, eliminated);
        setMessage("searchSteps", String(steps));
        setMessage(
          "searchExplanation",
          `Check middle value ${values[mid]}. Target: ${target}.`
        );

        await sleep(650);
        if (run !== searchRun) return;

        if (values[mid] === target) {
          found = mid;
          break;
        }

        if (values[mid] < target) {
          for (let i = left; i <= mid; i++) eliminated.push(i);
          left = mid + 1;
        } else {
          for (let i = mid; i <= right; i++) eliminated.push(i);
          right = mid - 1;
        }
      }
    }

    if (run !== searchRun) return;

    if (found !== -1) {
      renderCells(values, -1, found, eliminated);
      setMessage("searchStatus", "Target found!");
      setMessage("searchResult", String(target));
      setMessage("searchResultText", `Found at index ${found} (zero-based).`);
      setMessage("searchExplanation", `Target ${target} was found at index ${found}.`);
    } else {
      renderCells(values, -1, -1, eliminated);
      setMessage("searchStatus", "Target not found");
      setMessage("searchResult", "Not found");
      setMessage("searchResultText", `${target} is not in the array.`);
      setMessage("searchExplanation", `Checked the search range. ${target} was not found.`);
    }
  } finally {
    if (run === searchRun) {
      button.disabled = false;
      button.textContent = "⌕ Search";
    }
  }
});

// ---------- Graph traversal visualizer ----------

const positions = {
  A: [65, 125],
  B: [145, 55],
  C: [145, 195],
  D: [255, 55],
  E: [255, 195],
  F: [355, 125]
};

const adjacency = {
  A: ["B", "C"],
  B: ["A", "D", "E"],
  C: ["A", "E"],
  D: ["B", "F"],
  E: ["B", "C", "F"],
  F: ["D", "E"]
};

function drawGraph(visited = [], current = "") {
  const edges = $("graphEdges");
  const nodes = $("graphNodes");

  edges.replaceChildren();
  nodes.replaceChildren();

  const drawnEdges = new Set();

  Object.entries(adjacency).forEach(([from, neighbors]) => {
    neighbors.forEach((to) => {
      const key = [from, to].sort().join("-");

      if (drawnEdges.has(key)) return;
      drawnEdges.add(key);

      const [x1, y1] = positions[from];
      const [x2, y2] = positions[to];

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg", "line"
      );

      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("class", "edge");
      edges.appendChild(line);
    });
  });

  Object.entries(positions).forEach(([name, [x, y]]) => {
    const group = document.createElementNS(
      "http://www.w3.org/2000/svg", "g"
    );

    group.setAttribute("class", [
      "node",
      visited.includes(name) ? "visited" : "",
      current === name ? "current" : ""
    ].filter(Boolean).join(" "));

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg", "circle"
    );

    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 21);

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg", "text"
    );

    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.textContent = name;

    group.append(circle, label);
    nodes.appendChild(group);
  });
}

$("graphBtn").addEventListener("click", async () => {
  const run = ++graphRun;
  const button = $("graphBtn");
  const algorithm = $("graphAlgorithm").value;
  const start = $("startNode").value;

  button.disabled = true;
  button.textContent = "Traversing...";

  const visited = [];
  const order = [];
  const queue = [start];
  const seen = new Set([start]);

  drawGraph();
  $("visitOrder").replaceChildren();
  setMessage("graphStatus", "Traversal in progress");

  try {
    while (queue.length > 0) {
      if (run !== graphRun) return;

      // BFS removes the oldest item; DFS removes the newest.
      const current = algorithm === "bfs"
        ? queue.shift()
        : queue.pop();

      visited.push(current);
      order.push(current);

      drawGraph(visited, current);

      const chip = document.createElement("span");
      chip.textContent = current;
      $("visitOrder").appendChild(chip);

      setMessage(
        "graphExplanation",
        `${algorithm.toUpperCase()} visits node ${current}. ` +
        `Visited ${visited.length} of 6 nodes.`
      );

      await sleep(650);
      if (run !== graphRun) return;

      let neighbors = [...adjacency[current]];

      if (algorithm === "dfs") {
        // Reverse insertion order so DFS visits alphabetically first
        // when pushing neighbors onto the stack.
        neighbors.reverse();
      }

      neighbors.forEach((neighbor) => {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    if (run !== graphRun) return;

    drawGraph(order);
    setMessage("graphStatus", "Traversal complete");
    setMessage(
      "graphExplanation",
      `${algorithm.toUpperCase()} visit order: ${order.join(" → ")}`
    );
  } finally {
    if (run === graphRun) {
      button.disabled = false;
      button.textContent = "▶ Traverse Graph";
    }
  }
});

// Initialize all visualizations.
loadSortNumbers();
renderCells([4, 9, 12, 18, 25, 31, 42]);
drawGraph();
