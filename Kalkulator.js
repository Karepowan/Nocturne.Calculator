const layar = document.getElementById("layar");
const expressionDisplay = document.getElementById("expression");

const modeToggle = document.getElementById("modeToggle");
const angleToggle = document.getElementById("angleToggle");
const scientificKeys = document.getElementById("scientificKeys");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");

let expression = "";
let lastResult = null;
let scientificMode = false;
let angleMode = "DEG";
let memory = 0;
let justCalculated = false;
let history = [];

function formatExpression(value) {
  return value.replace(/\*/g, "×").replace(/\//g, "÷").replace(/-/g, "−");
}

function updateDisplay() {
  layar.value = formatExpression(expression || "0");
  expressionDisplay.textContent = formatExpression(expression || "0");
}

function appendValue(value) {
  if (justCalculated) {
    if (
      "0123456789.pi".includes(value) ||
      value === "pi" ||
      value === "e" ||
      value.endsWith("(")
    ) {
      expression = "";
    }
    justCalculated = false;
  }

  if (expression.length > 100) return;

  if (value === ".") {
    const currentNumber = expression.split(/[+\-*/^()%()]/).pop();
    if (currentNumber.includes(".")) return;
  }

  expression += value;
  lastResult = null;
  updateDisplay();
}

function clearAll() {
  expression = "";
  lastResult = null;
  justCalculated = false;
  updateDisplay();
}

function deleteLast() {
  if (justCalculated) {
    clearAll();
    return;
  }

  expression = expression.slice(0, -1);
  lastResult = null;
  updateDisplay();
}

// =====================================
// MATH PARSER
// =====================================

function tokenize(input) {
  const tokens = [];
  const pattern =
    /\s*([0-9]*\.?[0-9]+|pi|e|sqrt|sin|cos|tan|log|ln|abs|[a-zA-Z]+|[+\-*/^()%!])/gy;

  let position = 0;

  while (position < input.length) {
    pattern.lastIndex = position;
    const match = pattern.exec(input);

    if (!match) {
      throw new Error("Ekspresi tidak valid");
    }

    tokens.push(match[1]);
    position = pattern.lastIndex;
  }

  return tokens;
}

function factorial(number) {
  if (!Number.isInteger(number) || number < 0 || number > 170) {
    throw new Error("Faktorial hanya untuk bilangan bulat 0–170");
  }

  let result = 1;

  for (let i = 2; i <= number; i++) {
    result *= i;
  }

  return result;
}

function calculateExpression(input) {
  const tokens = tokenize(input);
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function consume() {
    return tokens[position++];
  }

  function parseExpression() {
    let value = parseTerm();

    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      const right = parseTerm();

      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseUnary();

    while (["*", "/", "%"].includes(peek())) {
      const operator = consume();
      const right = parseUnary();

      if ((operator === "/" || operator === "%") && right === 0) {
        throw new Error("Tidak bisa dibagi nol");
      }

      if (operator === "*") value *= right;
      if (operator === "/") value /= right;
      if (operator === "%") value %= right;
    }

    return value;
  }

  function parseUnary() {
    if (peek() === "+") {
      consume();
      return parseUnary();
    }

    if (peek() === "-") {
      consume();
      return -parseUnary();
    }

    return parsePower();
  }

  function parsePower() {
    let value = parsePostfix();

    if (peek() === "^") {
      consume();
      value = Math.pow(value, parseUnary());
    }

    return value;
  }

  function parsePostfix() {
    let value = parsePrimary();

    while (peek() === "!") {
      consume();
      value = factorial(value);
    }

    return value;
  }

  function parsePrimary() {
    const token = consume();

    if (token === undefined) {
      throw new Error("belum lengkap lohh");
    }

    if (!isNaN(Number(token))) {
      return Number(token);
    }

    if (token === "pi") return Math.PI;
    if (token === "e") return Math.E;

    if (token === "(") {
      const value = parseExpression();

      if (consume() !== ")") {
        throw new Error("Kurung belum ditutup");
      }

      return value;
    }

    const functions = ["sin", "cos", "tan", "log", "ln", "sqrt", "abs"];

    if (functions.includes(token)) {
      if (consume() !== "(") {
        throw new Error(`Gunakan ${token}(angka)`);
      }

      const value = parseExpression();

      if (consume() !== ")") {
        throw new Error("nda ada tutup kurung");
      }

      switch (token) {
        case "sin":
          return Math.sin(
            angleMode === "DEG" ? (value * Math.PI) / 180 : value,
          );

        case "cos":
          return Math.cos(
            angleMode === "DEG" ? (value * Math.PI) / 180 : value,
          );

        case "tan": {
          const angle = angleMode === "DEG" ? (value * Math.PI) / 180 : value;

          if (Math.abs(Math.cos(angle)) < 1e-12) {
            throw new Error("Tan tidak terdefinisi");
          }

          return Math.tan(angle);
        }

        case "log":
          if (value <= 0) throw new Error("Log harus positif");
          return Math.log10(value);

        case "ln":
          if (value <= 0) throw new Error("Ln harus positif");
          return Math.log(value);

        case "sqrt":
          if (value < 0) throw new Error("Akar negatif tidak valid");
          return Math.sqrt(value);

        case "abs":
          return Math.abs(value);
      }
    }

    throw new Error("Input tidak dikenali");
  }

  const result = parseExpression();

  if (position < tokens.length) {
    throw new Error("Ekspresi tidak valid");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Hasil tidak valid");
  }

  return Number(result.toPrecision(12));
}

// =====================================
// CALCULATION
// =====================================

function calculate() {
  if (!expression) return;

  try {
    const originalExpression = expression;
    const result = calculateExpression(expression);

    lastResult = result;
    expression = String(result);
    justCalculated = true;

    addHistory(originalExpression, result);
    updateDisplay();
  } catch (error) {
    layar.value = error.message;
    expressionDisplay.textContent = "";
    expression = "";
    lastResult = null;
    justCalculated = true;
  }
}

// =====================================
// HISTORY
// =====================================

function addHistory(input, result) {
  history.unshift({
    expression: input,
    result: result,
  });

  if (history.length > 10) {
    history.pop();
  }

  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-history">No calculations yet.</p>';
    return;
  }

  historyList.innerHTML = "";

  history.forEach((item) => {
    const element = document.createElement("div");
    element.className = "history-item";

    const question = document.createElement("p");
    question.textContent = item.expression;

    const answer = document.createElement("strong");
    answer.textContent = `= ${item.result}`;

    element.append(question, answer);

    element.addEventListener("click", () => {
      expression = String(item.result);
      lastResult = null;
      justCalculated = true;
      updateDisplay();
    });

    historyList.appendChild(element);
  });
}

document.getElementById("historyToggle").addEventListener("click", () => {
  historyPanel.classList.toggle("hidden");
});

document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  renderHistory();
});

// =====================================
// BASIC / SCIENTIFIC MODE
// =====================================

modeToggle.addEventListener("click", () => {
  scientificMode = !scientificMode;

  scientificKeys.classList.toggle("hidden", !scientificMode);

  modeToggle.textContent = scientificMode ? "BASIC MODE" : "SCI MODE";

  document.getElementById("modeLabel").textContent = scientificMode
    ? "SCIENTIFIC MODE"
    : "BASIC MODE";
});

angleToggle.addEventListener("click", () => {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";

  angleToggle.textContent = angleMode;
  document.getElementById("angleMode").textContent = angleMode;
});

// =====================================
// MEMORY FUNCTIONS
// =====================================

document.querySelectorAll("[data-memory]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.memory;

    if (action === "MC") {
      memory = 0;
    }

    if (action === "MR") {
      appendValue(String(memory));
    }

    if (action === "M+" || action === "M-") {
      try {
        const value = calculateExpression(expression || "0");

        memory += action === "M+" ? value : -value;
      } catch {
        layar.value = "Input tidak valid";
      }
    }
  });
});

// =====================================
// BUTTON EVENTS
// =====================================

document.querySelectorAll("[data-value]").forEach((button) => {
  button.addEventListener("click", () => {
    appendValue(button.dataset.value);
  });
});

document
  .querySelector('[data-action="square"]')
  .addEventListener("click", () => {
    if (!expression) return;

    expression += "^";
    lastResult = null;
    justCalculated = false;
    updateDisplay();
  });

document
  .querySelector('[data-action="clear"]')
  .addEventListener("click", clearAll);

document
  .querySelector('[data-action="delete"]')
  .addEventListener("click", deleteLast);

document
  .querySelector('[data-action="calculate"]')
  .addEventListener("click", calculate);

// =====================================
// KEYBOARD SUPPORT
// =====================================

document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    appendValue(key);
  } else if (["+", "-", "*", "/", "(", ")", "%", "^", "!"].includes(key)) {
    appendValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearAll();
  }
});

// =====================================
// STAR BACKGROUND
// =====================================

const starContainer = document.querySelector(".stars");

for (let i = 0; i < 100; i++) {
  const star = document.createElement("span");
  star.className = "star";

  const size = Math.random() * 2 + 1;

  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.animationDelay = `${Math.random() * 3}s`;
  star.style.animationDuration = `${Math.random() * 3 + 2}s`;

  starContainer.appendChild(star);
}

updateDisplay();

// =====================================
// THEME SWITCHER
// =====================================

const themeButtons = document.querySelectorAll(".theme-btn");

function applyTheme(theme) {
  const validThemes = ["lavender", "midnight", "light", "matcha"];

  if (!validThemes.includes(theme)) {
    theme = "lavender";
  }

  document.body.dataset.theme = theme === "lavender" ? "" : theme;

  themeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme);
  });

  localStorage.setItem("nocturne-theme", theme);
}

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.theme);
  });
});

// Load saved theme
const savedTheme = localStorage.getItem("nocturne-theme") || "lavender";
applyTheme(savedTheme);

// =====================================
// SHOOTING STARS
// =====================================

function createShootingStar() {
  const starContainer = document.querySelector(".stars");
  const shootingStar = document.createElement("span");

  shootingStar.className = "shooting-star";

  // Posisi awal tersebar di seluruh layar
  shootingStar.style.left = `${Math.random() * 100}%`;
  shootingStar.style.top = `${Math.random() * 100}%`;

  // Variasi kecepatan dan jarak
  const duration = 1.2 + Math.random() * 1.2;
  const travelX = 350 + Math.random() * 250;
  const travelY = travelX * 0.55;

  shootingStar.style.setProperty("--duration", `${duration}s`);
  shootingStar.style.setProperty("--travel-x", `${travelX}px`);
  shootingStar.style.setProperty("--travel-y", `${travelY}px`);

  starContainer.appendChild(shootingStar);

  shootingStar.addEventListener("animationend", () => {
    shootingStar.remove();
  });
}

// A shooting star appears every few seconds
setInterval(() => {
  if (Math.random() > 0.3) {
    createShootingStar();
  }
}, 3500);
