const EASY_GUIDANCE = [
  "Use one main concept and a straightforward, clearly defined goal.",
  "Keep the solution approachable for a first-time learner; avoid advanced data structures, nested reasoning, and unnecessary edge cases.",
  "Use small inputs and an example that can be worked out by hand.",
  "The student should be able to explain the approach in a few simple steps.",
].join("\n- ");

const MEDIUM_GUIDANCE = [
  "Require multiple reasoning steps or a meaningful implementation choice, while staying appropriate for an intermediate learner.",
  "Include realistic constraints and at least one useful edge case.",
  "Use the selected topic in a meaningful way; avoid trick questions and advanced algorithms that exceed intermediate level.",
  "The student should compare approaches or explain why the chosen approach works.",
  "Mention time and space complexity in the solution when relevant.",
].join("\n- ");

export function normalizeStudentLevel(level) {
  return typeof level === "string" && level.trim().toLowerCase() === "intermediate"
    ? "Intermediate"
    : "Beginner";
}

export function getChallengeDifficulty(level) {
  return normalizeStudentLevel(level) === "Intermediate" ? "Medium" : "Easy";
}

export function getChallengeDifficultyGuidance(level) {
  return normalizeStudentLevel(level) === "Intermediate"
    ? MEDIUM_GUIDANCE
    : EASY_GUIDANCE;
}
