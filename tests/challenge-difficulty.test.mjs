import assert from "node:assert/strict";
import test from "node:test";
import {
  getChallengeDifficulty,
  getChallengeDifficultyGuidance,
  normalizeStudentLevel,
} from "../backend/challenge-difficulty.js";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const backend = read("../backend/server.js");
const frontend = read("../script.js");

test("Beginner maps to Easy and Intermediate maps to Medium", () => {
  assert.equal(normalizeStudentLevel("Beginner"), "Beginner");
  assert.equal(normalizeStudentLevel("beginner"), "Beginner");
  assert.equal(normalizeStudentLevel("Intermediate"), "Intermediate");
  assert.equal(normalizeStudentLevel("INTERMEDIATE"), "Intermediate");
  assert.equal(normalizeStudentLevel("unexpected"), "Beginner");
  assert.equal(getChallengeDifficulty("Beginner"), "Easy");
  assert.equal(getChallengeDifficulty("Intermediate"), "Medium");
});

test("difficulty guidance matches each learner level", () => {
  const easyGuidance = getChallengeDifficultyGuidance("Beginner").toLowerCase();
  const mediumGuidance = getChallengeDifficultyGuidance("Intermediate").toLowerCase();

  assert.match(easyGuidance, /one main concept/);
  assert.match(easyGuidance, /avoid advanced data structures/);
  assert.match(mediumGuidance, /multiple reasoning steps/);
  assert.match(mediumGuidance, /edge case/);
});

test("backend enforces difficulty in its prompt and API response", () => {
  assert.match(backend, /Target challenge difficulty: \${safeDifficulty}/);
  assert.match(backend, /"difficulty": "\${safeDifficulty}"/);
  assert.match(backend, /difficulty: safeDifficulty/);
  assert.match(frontend, /challenge-difficulty-badge/);
  assert.match(frontend, /challenge\.difficulty === "Medium"/);
});
