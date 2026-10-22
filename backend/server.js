import rateLimit from "express-rate-limit";

app.set("trust proxy", 1);
app.disable("x-powered-by");

// CORS: reject quietly (no thrown error)
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
}));
app.use(express.json({ limit: "20kb" }));

const askLimiter = rateLimit({
  windowMs: 60_000, limit: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute." },
});
const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60_000, limit: 40, standardHeaders: true, legacyHeaders: false,
  message: { error: "Daily limit reached. Please try again tomorrow." },
});

const LANGS = ["Python", "Java", "JavaScript", "C", "C++"];

app.post("/api/ask", askLimiter, dailyLimiter, async (req, res) => {
  // ...same validation as before, but:
  const safeLanguage = LANGS.includes(language) ? language : "Python";

  const response = await ai.models.generateContent({
    model,
    contents: question.trim(),                       // only the student's text
    config: {
      systemInstruction: buildTutorRules(safeLanguage, safeLevel), // your TEACHING RULES + STRUCTURE
      maxOutputTokens: 1500,
      temperature: 0.4,
    },
  });
  // ...
  // in the catch block:
  if (error?.status === 429)
    return res.status(429).json({ error: "The tutor is busy right now. Please try again shortly." });
});

// after all routes, including the 404 handler:
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request too large." });
  if (err instanceof SyntaxError)      return res.status(400).json({ error: "Invalid request." });
  console.error(err?.message);
  res.status(500).json({ error: "Server error." });
});
