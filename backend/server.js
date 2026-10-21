import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-6-astra";
const allowedOrigins = (process.env.CORS_ORIGINS || "https://theaj-ship-it.github.io")
  .split(",").map(value => value.trim()).filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1); // Needed behind common hosted reverse proxies; use one proxy hop.
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin (e.g. health checks) are allowed; browsers still enforce CORS.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by cH API CORS policy."));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  maxAge: 600
}));
app.use(express.json({ limit: "10kb" }));
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many tutor requests from this connection. Please wait a little and try again." }
}));

const client = API_KEY ? new OpenAI({ apiKey: API_KEY, timeout: 55000, maxRetries: 2 }) : null;

app.get("/", (_req, res) => res.json({ service: "cH Code Helper API", status: "online", version: "1.0.0" }));
app.get("/health", (_req, res) => res.status(200).json({ status: "ok", configured: Boolean(client) }));

const lessonSchema = {
  type: "object",
  properties: {
    intro: { type: "string" },
    steps: { type: "array", items: { type: "object", properties: { title: { type: "string" }, details: { type: "string" } }, required: ["title", "details"], additionalProperties: false } },
    code: { type: "string" },
    expected_output: { type: "string" },
    practice_challenge: { type: "string" },
    hint: { type: "string" }
  },
  required: ["intro", "steps", "code", "expected_output", "practice_challenge", "hint"],
  additionalProperties: false
};

app.post("/api/lesson", async (req, res) => {
  if (!client) return res.status(503).json({ error: "The AI service is not configured yet. Set OPENAI_API_KEY in the backend host's environment variables." });
  const { question, language, level, topic } = req.body || {};
  const allowedLanguages = ["Python", "Java", "C", "C++", "JavaScript"];
  const allowedLevels = ["Beginner", "Intermediate"];
  const allowedTopics = ["Loops", "Arrays", "Functions", "Problem solving", "Variables"];
  if (typeof question !== "string" || !question.trim()) return res.status(400).json({ error: "Enter a programming question first." });
  if (question.length > 1500) return res.status(400).json({ error: "Please keep your question under 1,500 characters." });
  if (!allowedLanguages.includes(language)) return res.status(400).json({ error: "Choose a supported programming language." });
  if (!allowedLevels.includes(level)) return res.status(400).json({ error: "Choose Beginner or Intermediate level." });
  if (!allowedTopics.includes(topic)) return res.status(400).json({ error: "Choose a supported topic." });

  const instructions = `You are cH Code Helper, a patient programming tutor for engineering students. Your teaching philosophy is LOGIC FIRST, CODE SECOND. Teach rather than simply solve. The learner selected ${level} level and ${language}. Keep the explanation clear, practical, and age-appropriate. Respond only in the requested JSON schema. Give 3 to 5 numbered steps, in plain language. Explain the core idea first, then how to approach it, then trace/test it. The code must be valid ${language} when the request calls for code; include required context/imports when reasonable. If a request is ambiguous, state a reasonable assumption in intro. If the question is not about programming or learning, gently steer it back to a safe programming-learning topic. Never claim code was executed; expected_output must be a reasoned prediction, or say what needs to be supplied to determine output. Do not provide extremely long answers. Include one practice challenge and one small hint. Topic chosen: ${topic}.`;
  try {
    const response = await client.responses.create({
      model: MODEL,
      instructions,
      input: question.trim(),
      max_output_tokens: 1400,
      text: { format: { type: "json_schema", name: "ch_lesson", strict: true, schema: lessonSchema } }
    });
    const raw = response.output_text;
    if (!raw) throw new Error("The AI provider returned an empty response.");
    let lesson;
    try { lesson = JSON.parse(raw); } catch { throw new Error("The AI provider returned a response that could not be parsed."); }
    if (!lesson.intro || !Array.isArray(lesson.steps) || !lesson.code || !lesson.practice_challenge) {
      throw new Error("The AI provider response was missing required lesson fields.");
    }
    return res.status(200).json({ lesson, model: MODEL });
  } catch (error) {
    // Do not return provider error details, request headers, or secrets to the public client.
    console.error("cH lesson generation failed:", error?.status || "unknown", error?.message || "unknown error");
    if (error?.status === 429) return res.status(429).json({ error: "The AI service is temporarily rate-limited or its usage quota is unavailable. Check your provider billing and try again later." });
    if (error?.name === "APIConnectionTimeoutError" || error?.name === "APIConnectionError") return res.status(504).json({ error: "The AI service did not respond in time. Please try again." });
    return res.status(502).json({ error: "The AI tutor could not generate a lesson right now. Please try again in a moment." });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") return res.status(413).json({ error: "The request is too large." });
  if (err?.message?.includes("CORS policy")) return res.status(403).json({ error: "This website origin is not allowed to use the cH API." });
  console.error("cH API request error:", err?.message || "unknown error");
  return res.status(400).json({ error: "The request could not be processed." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`cH Code Helper API listening on port ${PORT}`);
  if (!API_KEY) console.warn("OPENAI_API_KEY is not configured. /health will report configured=false.");
});
