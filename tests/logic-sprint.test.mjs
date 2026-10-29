import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const css = read("../style.css");
const practiceSource = read("../practice-lab.js");

const expectedTopics = [
  "Loops",
  "Arrays",
  "Variables",
  "Functions",
  "Conditions",
  "Object-Oriented Programming",
  "Data Structures",
  "Algorithms",
  "Other",
];

test("Logic Sprint is connected to the existing page", () => {
  assert.match(html, /<script src="script\.js"><\/script>\s*<script src="practice-lab\.js"><\/script>/);
  for (const id of [
    "practice-start",
    "practice-next",
    "practice-options",
    "practice-feedback",
    "practice-progress",
    "practice-question",
    "practice-streak-count",
    "practice-streak-status",
    "practice-best-streak",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing page element: ${id}`);
  }
});

test("the dynamic generator creates valid cases for all topics, languages, and streak tiers", () => {
  const start = practiceSource.indexOf("  function hashString(value) {");
  const end = practiceSource.indexOf("  function resetFeedback() {", start);
  assert.ok(start >= 0 && end > start, "question-generator section was found");
  const generatorSource = practiceSource.slice(start, end);
  const generator = vm.runInNewContext("(() => { " + generatorSource +
    "\nreturn { hashString, makeRandom, buildQuestion }; })()");

  const languages = ["Python", "Java", "JavaScript", "C", "C++"];
  for (const topic of expectedTopics) {
    for (const language of languages) {
      for (let tier = 0; tier <= 3; tier += 1) {
        for (let variant = 0; variant < 3; variant += 1) {
          const seed = generator.hashString([topic, language, tier, variant].join("|"));
          const item = generator.buildQuestion(topic, tier, variant, language, generator.makeRandom(seed));
          assert.equal(typeof item.question, "string", topic + " question text");
          assert.ok(item.question.trim().length > 0);
          assert.equal(typeof item.code, "string", topic + " code snippet");
          assert.ok(item.code.trim().length > 0);
          assert.equal(item.options.length, 4, topic + " should offer four choices");
          assert.equal(new Set(item.options).size, 4, topic + " should offer distinct choices");
          assert.ok(item.options.every((option) => typeof option === "string" && option.trim()));
          assert.ok(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < 4,
            topic + " should have a valid answer index");
          assert.equal(typeof item.explanation, "string");
          assert.ok(item.explanation.trim().length > 0);
        }
      }
    }
  }
});

test("practice module provides feedback, scoring, and safe text rendering", () => {
  assert.match(practiceSource, /function chooseAnswer\(/);
  assert.match(practiceSource, /function showResults\(/);
  assert.match(practiceSource, /feedback\.textContent/);
  assert.match(practiceSource, /heading\.textContent = item\.question/);
  assert.match(practiceSource, /button\.textContent = String\.fromCharCode\(65 \+ index\) \+ "\. " \+ option/);
  assert.doesNotMatch(practiceSource, /\bfetch\s*\(|XMLHttpRequest|WebSocket/);
});

test("practice panel includes feedback states and a mobile layout", () => {
  assert.ok(css.includes(".practice-option.is-correct"));
  assert.ok(css.includes(".practice-option.is-wrong"));
  assert.ok(css.includes("@media (max-width: 600px)"));
});


test("a complete sprint handles correct answers, wrong answers, feedback, and scores", () => {
  class FakeElement {
    constructor(tagName, id = "") {
      this.tagName = tagName.toLowerCase();
      this.id = id;
      this.children = [];
      this.listeners = {};
      this.disabled = false;
      this.value = "";
      this.textContent = "";
      this.className = "";
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name),
        toggle: (name, force) => {
          const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
          if (shouldAdd) classes.add(name);
          else classes.delete(name);
          return shouldAdd;
        },
      };
    }

    addEventListener(type, callback) {
      (this.listeners[type] ||= []).push(callback);
    }

    dispatch(type) {
      for (const callback of this.listeners[type] || []) callback({ type, target: this });
    }

    click() {
      if (!this.disabled) this.dispatch("click");
    }

    replaceChildren(...children) {
      this.children = [...children];
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    querySelectorAll(selector) {
      const tag = selector.toLowerCase();
      return this.children.filter((child) => child.tagName === tag);
    }
  }

  const ids = [
    "topic", "level", "practice-topic-label", "practice-progress",
    "practice-question", "practice-options", "practice-feedback",
    "practice-start", "practice-next", "practice-streak-count", "practice-streak-status", "practice-best-streak",
  ];
  const elements = new Map(ids.map((id) => [id, new FakeElement("div", id)]));
  elements.get("topic").value = "Loops";
  elements.get("level").value = "Beginner";
  const savedValues = new Map();
  const windowStub = { localStorage: { getItem: (key) => savedValues.get(key) || null, setItem: (key, value) => savedValues.set(key, value) } };
  let domReady;
  const documentStub = {
    addEventListener(type, callback) {
      if (type === "DOMContentLoaded") domReady = callback;
    },
    getElementById(id) {
      return elements.get(id) || null;
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
  };

  const instrumentedSource = practiceSource.replace(
    '  startButton.addEventListener("click", startSprint);',
    '  window.__logicSprintTestState = state;\n  startButton.addEventListener("click", startSprint);'
  );
  assert.notEqual(instrumentedSource, practiceSource, "test state hook was inserted");
  vm.runInNewContext(instrumentedSource, { document: documentStub, window: windowStub });
  assert.equal(typeof domReady, "function", "app registers its DOM-ready callback");
  domReady();

  const testState = windowStub.__logicSprintTestState;
  const questionBox = elements.get("practice-question");
  const optionsBox = elements.get("practice-options");
  const feedback = elements.get("practice-feedback");
  const start = elements.get("practice-start");
  const next = elements.get("practice-next");

  function answerSprint(correct) {
    start.click();

    for (let round = 0; round < 3; round += 1) {
      const prompt = questionBox.children.find((child) => child.tagName === "h3")?.textContent;
      const item = testState.questions[round];
      assert.ok(item, "current generated question exists");
      assert.equal(prompt, item.question, "rendered prompt matches the generated question");
      assert.ok(questionBox.children.some((child) => child.tagName === "pre"), "code snippet is rendered");

      const buttons = optionsBox.querySelectorAll("button");
      assert.equal(buttons.length, 4, "each question shows four options");
      const chosenIndex = correct ? item.answer : (item.answer + 1) % item.options.length;
      buttons[chosenIndex].click();

      if (correct) {
        assert.match(feedback.textContent, /^Correct\./, "correct answer shows positive feedback");
        assert.equal(feedback.classList.contains("is-correct"), true);
      } else {
        assert.match(feedback.textContent, /^Not quite\./, "wrong answer explains the correction");
        assert.equal(feedback.classList.contains("is-wrong"), true);
      }
      assert.equal(next.disabled, false, "answered questions can advance");
      assert.ok(buttons.every((button) => button.disabled), "answer choices lock after selection");
      next.click();
    }

    assert.match(questionBox.children[0].textContent, /^Sprint complete:/);
    assert.equal(next.disabled, true, "results disable the next-question control");
  }

  answerSprint(true);
  assert.match(questionBox.children[0].textContent, /3\/3/);
  assert.equal(elements.get("practice-streak-count").textContent, "1", "first completed sprint starts a one-day streak");
  assert.equal(elements.get("practice-progress").textContent, "Accuracy: 100%");

  answerSprint(false);
  assert.match(questionBox.children[0].textContent, /0\/3/);
  assert.equal(elements.get("practice-progress").textContent, "Accuracy: 0%");
  assert.equal(elements.get("practice-streak-count").textContent, "1", "multiple sprints on one day count as one streak day");
  assert.equal(JSON.parse(savedValues.values().next().value).best, 1, "best streak is saved locally");

  elements.get("level").value = "Intermediate";
  start.click();
  assert.equal(testState.level, "Intermediate");
  assert.ok(testState.tier >= 1, "intermediate selection uses at least the Trace tier");
  assert.equal(testState.questions.length, 3, "intermediate selection still has three cases");
  assert.ok(testState.questions.every((question) => question.code && question.options.length === 4),
    "intermediate cases render complete code questions");
});


test("streak UI and local-only storage are wired into the practice module", () => {
  assert.ok(html.includes('id="practice-streak-count"'));
  assert.ok(html.includes('id="practice-streak-status"'));
  assert.ok(html.includes('id="practice-best-streak"'));
  assert.match(practiceSource, /window\.localStorage\.getItem/);
  assert.match(practiceSource, /window\.localStorage\.setItem/);
  assert.match(practiceSource, /function recordPracticeDay\(/);
  assert.match(css, /\.practice-streak-card/);
});
