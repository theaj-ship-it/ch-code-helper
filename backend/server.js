
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  getChallengeDifficulty,
  getChallengeDifficultyGuidance,
  normalizeStudentLevel,
} from "./challenge-difficulty.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "https://theaj-ship-it.github.io"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", configured: Boolean(ai) });
});

// Existing lesson-generation endpoint.
app.post("/api/ask", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "AI service is not configured.",
      });
    }

    const {
      question,
      language = "Python",
      level = "Beginner",
    } = req.body || {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a programming question.",
      });
    }

    if (question.length > 4000) {
      return res.status(400).json({
        error: "Please keep your question under 4000 characters.",
      });
    }

    const safeLanguage =
      typeof language === "string" && language.trim()
        ? language.trim().slice(0, 50)
        : "Python";

    const safeLevel =
      typeof level === "string" &&
      level.toLowerCase() === "intermediate"
        ? "Intermediate"
        : "Beginner";

    const prompt = `
You are cH Code Helper, an adaptive programming tutor.

Language: ${safeLanguage}
Student level: ${safeLevel}

Student question:
${question.trim()}

For Beginner students:
- Use simple English and small numbered steps.
- Explain important lines of code.
- Include a relevant example and expected output.
- Explain a common mistake.
- Finish with a practice task and hint.

For Intermediate students:
- Explain the problem-solving approach and why it works.
- Discuss edge cases and alternatives when relevant.
- Explain time and space complexity when appropriate.
- Include code when useful or explicitly requested.
- Finish with a meaningful challenge.

Use these sections:
1. Concept
2. Logic and Steps
3. Example
4. Common Mistake
5. Your Turn
6. Next Step

Keep the explanation focused. Respect the requested language.
Never claim that code was executed unless it actually was.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const answer = response.text;

    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({
        error: "The AI returned an empty lesson.",
      });
    }

    return res.json({ answer: answer.trim() });
  } catch (error) {
    console.error("Lesson request failed:", error?.message || error);
    return res.status(500).json({
      error: "Could not generate the lesson. Please try again.",
    });
  }
});

// New endpoint: create a challenge with two progressive hints and a solution.
app.post("/api/challenge", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "AI service is not configured.",
      });
    }

    const { language = "Python", level = "Beginner", topic = "Other" } =
      req.body || {};

    const safeLanguage =
      typeof language === "string" && language.trim()
        ? language.trim().slice(0, 50)
        : "Python";

    const safeLevel = normalizeStudentLevel(level);
    const safeDifficulty = getChallengeDifficulty(safeLevel);
    const difficultyGuidance = getChallengeDifficultyGuidance(safeLevel);

    const safeTopic =
      typeof topic === "string" && topic.trim()
        ? topic.trim().slice(0, 100)
        : "General programming";

    const prompt = `
You are cH Code Helper, an adaptive programming challenge designer.

Create ONE original programming practice challenge.

Programming language: ${safeLanguage}
Student level: ${safeLevel}
Topic: ${safeTopic}

Target challenge difficulty: ${safeDifficulty}
Difficulty requirements:
- ${difficultyGuidance}

Keep the difficulty matched to the selected level. Beginner must always receive Easy;
Intermediate must always receive Medium. Do not make an Easy task depend on advanced
concepts, and do not make a Medium task require advanced algorithms beyond this level.

Return ONLY valid JSON. Do not use Markdown fences or text outside JSON.
Use exactly this structure:
{
  "title": "Short challenge title",
  "difficulty": "${safeDifficulty}",
  "problem": "Clear problem statement in simple language",
  "requirements": ["Requirement one", "Requirement two"],
  "exampleInput": "Example input, or a brief description if not applicable",
  "exampleOutput": "Correct expected output",
  "hints": [
    "First hint: a gentle direction, not the full answer",
    "Second hint: a more specific clue, still not the full code"
  ],
  "solution": "Complete valid code in the requested language",
  "explanation": "Explain the solution step by step for the selected level",
  "complexity": "Time and space complexity when relevant; otherwise say Not applicable"
}

Ensure the example output matches the solution logically.
Use valid ${safeLanguage} syntax. Do not claim that code was executed.
The hints must not contain the complete solution.
The solution should solve the exact problem and address relevant edge cases.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const raw = response.text;

    if (typeof raw !== "string" || !raw.trim()) {
      return res.status(502).json({
        error: "The AI returned an empty challenge.",
      });
    }

    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    let challenge;

    try {
      challenge = JSON.parse(cleaned);
    } catch {
      console.error("Challenge response was not valid JSON.");
      return res.status(502).json({
        error: "The AI returned an invalid challenge. Please try again.",
      });
    }

    const valid =
      typeof challenge.title === "string" &&
      typeof challenge.problem === "string" &&
      Array.isArray(challenge.requirements) &&
      Array.isArray(challenge.hints) &&
      challenge.hints.length >= 2 &&
      typeof challenge.solution === "string" &&
      typeof challenge.explanation === "string";

    if (!valid) {
      return res.status(502).json({
        error: "The AI challenge was incomplete. Please try again.",
      });
    }

    // Keep hints and solution in the backend response.
    // The frontend reveals them only through the challenge controls.
    return res.json({
      challenge: {
        title: challenge.title,
        difficulty: safeDifficulty,
        problem: challenge.problem,
        requirements: challenge.requirements.slice(0, 8),
        exampleInput: String(challenge.exampleInput || ""),
        exampleOutput: String(challenge.exampleOutput || ""),
        hints: challenge.hints.slice(0, 2).map(String),
        solution: challenge.solution,
        explanation: challenge.explanation,
        complexity: String(challenge.complexity || "Not applicable"),
      },
    });
  } catch (error) {
    console.error("Challenge request failed:", error?.message || error);
    return res.status(500).json({
      error: "Could not generate a challenge. Please try again.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`cH Code Helper backend listening on port ${PORT}`);
});
