import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "https://theaj-ship-it.github.io"
)
  .split(",")
  .map((origin) => origin.trim());

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

app.use(express.json({ limit: "20kb" }));

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    configured: Boolean(ai),
  });
});

app.post("/api/ask", async (req, res) => {
  try {
    const { question, language = "Python", level = "Beginner" } =
      req.body || {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a programming question.",
      });
    }

    if (question.length > 4000) {
      return res.status(400).json({
        error: "Your question is too long. Please keep it under 4000 characters.",
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: "The AI tutor is not configured yet.",
      });
    }

    const safeLevel =
      level === "Intermediate" ? "Intermediate" : "Beginner";

    const prompt = `
You are cH Code Helper, a friendly programming tutor for engineering students.

Teaching rules:
- Explain the logic before showing code.
- Use simple, beginner-friendly language.
- Give clear steps and one small example.
- Include a hint or practice task so the student can learn independently.
- Adapt the explanation to the requested difficulty.
- If the question is ambiguous, ask a short clarifying question.
- Do not claim code was executed or tested unless it actually was.

Programming language: ${String(language).slice(0, 50)}
Student level: ${safeLevel}
Student question:
${question.trim()}

Structure your response using:
1. Concept
2. Logic and steps
3. Example
4. Practice task or hint
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const answer = response.text;

    if (!answer) {
      return res.status(502).json({
        error: "The AI tutor returned an empty answer. Please try again.",
      });
    }

    return res.json({ answer });
  } catch (error) {
    console.error("Gemini request failed:", error.message);

    return res.status(500).json({
      error: "The AI tutor could not answer right now. Please try again later.",
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`cH Code Helper API listening on port ${PORT}`);
});
