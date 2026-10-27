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
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing page element: ${id}`);
  }
});

test("every topic has three complete questions with valid answer indexes", () => {
  const match = practiceSource.match(/const questionBank = (\{[\s\S]*?^  \});/m);
  assert.ok(match, "question bank object was not found");

  // Evaluate only the literal question-bank object, never the application code.
  const bank = vm.runInNewContext(`(${match[1]})`);
  assert.deepEqual([...Object.keys(bank)].sort(), [...expectedTopics].sort());

  for (const topic of expectedTopics) {
    const questions = bank[topic];
    assert.equal(questions.length, 3, `${topic} should contain exactly three questions`);

    for (const [index, question] of questions.entries()) {
      assert.equal(typeof question.question, "string", `${topic} question ${index + 1}: text`);
      assert.ok(question.question.trim().length > 0);
      assert.equal(Array.isArray(question.options), true);
      assert.equal(question.options.length, 4, `${topic} question ${index + 1}: four options`);
      assert.ok(question.options.every((option) => typeof option === "string" && option.trim()));
      assert.ok(Number.isInteger(question.answer), `${topic} question ${index + 1}: answer index is an integer`);
      assert.ok(question.answer >= 0 && question.answer < question.options.length,
        `${topic} question ${index + 1}: answer index is in range`);
      assert.equal(typeof question.explanation, "string");
      assert.ok(question.explanation.trim().length > 0);
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
    "practice-start", "practice-next",
  ];
  const elements = new Map(ids.map((id) => [id, new FakeElement("div", id)]));
  elements.get("topic").value = "Loops";
  elements.get("level").value = "Beginner";
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

  vm.runInNewContext(practiceSource, { document: documentStub });
  assert.equal(typeof domReady, "function", "app registers its DOM-ready callback");
  domReady();

  const bankMatch = practiceSource.match(/const questionBank = (\{[\s\S]*?^  \});/m);
  assert.ok(bankMatch, "question bank is available for the interaction test");
  const bank = vm.runInNewContext("(" + bankMatch[1] + ")");
  const questionBox = elements.get("practice-question");
  const optionsBox = elements.get("practice-options");
  const feedback = elements.get("practice-feedback");
  const start = elements.get("practice-start");
  const next = elements.get("practice-next");

  function answerSprint(correct) {
    start.click();

    for (let round = 0; round < 3; round += 1) {
      const prompt = questionBox.children[0].textContent;
      const item = bank.Loops.find((question) => question.question === prompt);
      assert.ok(item, "current question belongs to Loops question bank");

      const buttons = optionsBox.querySelectorAll("button");
      assert.equal(buttons.length, 4, "each question shows four options");
      const chosenIndex = correct ? item.answer : (item.answer + 1) % item.options.length;
      buttons[chosenIndex].click();

      if (correct) {
        assert.match(feedback.textContent, /^Correct!/, "correct answer shows positive feedback");
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
  assert.equal(elements.get("practice-progress").textContent, "Final score: 100%");

  answerSprint(false);
  assert.match(questionBox.children[0].textContent, /0\/3/);
  assert.equal(elements.get("practice-progress").textContent, "Final score: 0%");
});
