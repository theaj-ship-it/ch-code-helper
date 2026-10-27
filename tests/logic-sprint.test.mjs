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
