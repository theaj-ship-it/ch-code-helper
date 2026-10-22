import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

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
      // Permit requests without an Origin header, such as health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "100kb" }));

// Health check: confirms that the server is running and configured.
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    configured: Boolean(ai),
  });
});

// Main cH AI tutoring endpoint.
app.post("/api/ask", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "AI service is not configured. Please try again later.",
      });
    }

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
You are cH Code Helper, a personal AI programming tutor
for engineering students and coding beginners.

Your mission is to help students understand programming
logic and solve problems independently, not merely copy code.

Programming language: ${safeLanguage}
Student level: ${safeLevel}

Student question:
${question.trim()}

TEACHING RULES

If the student is a Beginner:
- Use simple English and explain unfamiliar terms.
- Use relatable, practical examples.
- Break the solution into small numbered steps.
- Explain what each important line of code does.
- Show a small working example and expected output when relevant.
- Explain one common mistake and how to avoid it.
- Finish with one practice task and a helpful hint.

If the student is Intermediate:
- Start with the problem-solving approach.
- Explain why the approach works.
- Provide a useful hint before the full solution.
- Show complete code when requested or useful.
- Explain time and space complexity when relevant.
- Discuss edge cases and alternative approaches when useful.
- Finish with a challenge that extends the original problem.

RESPONSE STRUCTURE

1. Concept
Explain the main idea and why it matters.

2. Logic and Steps
Describe the solution in a clear sequence.

3. Example
Give a practical example. Include code and expected output
when appropriate.

4. Common Mistake
Explain one relevant error or misconception.

5. Your Turn
Give one practice question or coding challenge with a hint.
Do not immediately solve the practice task.

6. Next Step
Suggest one small concept to learn next.

IMPORTANT
- Keep explanations focused and easy to scan.
- Do not make every answer unnecessarily long.
- Respect the requested programming language.
- Use valid code examples and explain important syntax.
- Never claim code was executed or tested unless it was.
- Do not invent program output.
- If essential information is missing, ask a short question.
- If the question is not about programming, answer briefly
  and guide the student toward their learning goal.
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const answer = response.text;

    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({
        error: "The AI returned an empty response. Please try again.",
      });
    }

    return res.json({ answer: answer.trim() });
  } catch (error) {
    // Keep detailed diagnostics in Render logs, not in public responses.
    console.error(
      "Gemini request failed:",
      error?.message || "Unknown error"
    );

    return res.status(500).json({
      error: "cH could not generate a lesson right now. Please try again.",
    });
  }
});

// Unknown routes.
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`cH Code Helper backend listening on port ${PORT}`);
});
