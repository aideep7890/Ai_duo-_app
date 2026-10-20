require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  // This starter does not load external scripts, fonts, or images.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));
app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute and try again." }
}));
app.use(express.static(path.join(__dirname, "public")));

function extractOpenAIText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const pieces = [];
  for (const item of (data.output || [])) {
    if (item.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part.type === "output_text" && part.text) pieces.push(part.text);
      }
    }
  }
  return pieces.join("\n").trim();
}

async function askOpenAI(message) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured on the server.");
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: message,
      max_output_tokens: 800
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("OpenAI API error:", response.status, data.error?.message || "Unknown error");
    throw new Error(data.error?.message || `OpenAI request failed (${response.status}).`);
  }
  const answer = extractOpenAIText(data);
  if (!answer) throw new Error("OpenAI returned an empty response.");
  return answer;
}

async function askGemini(message) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured on the server.");
  }
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 800 }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Gemini API error:", response.status, data.error?.message || "Unknown error");
    throw new Error(data.error?.message || `Gemini request failed (${response.status}).`);
  }
  const answer = (data.candidates || [])
    .flatMap(candidate => candidate.content?.parts || [])
    .map(part => part.text || "")
    .join("\n")
    .trim();
  if (!answer) throw new Error("Gemini returned an empty response.");
  return answer;
}

app.post("/api/chat", async (req, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  const mode = req.body?.mode;

  if (!message) return res.status(400).json({ error: "Please enter a question." });
  if (message.length > 6000) {
    return res.status(400).json({ error: "Please keep your question under 6,000 characters." });
  }
  if (!["openai", "gemini", "both"].includes(mode)) {
    return res.status(400).json({ error: "Choose ChatGPT, Gemini, or Compare mode." });
  }

  try {
    if (mode === "openai") {
      return res.json({ mode, answer: await askOpenAI(message) });
    }
    if (mode === "gemini") {
      return res.json({ mode, answer: await askGemini(message) });
    }

    const results = await Promise.allSettled([askOpenAI(message), askGemini(message)]);
    const openai = results[0].status === "fulfilled"
      ? { answer: results[0].value }
      : { error: results[0].reason.message };
    const gemini = results[1].status === "fulfilled"
      ? { answer: results[1].value }
      : { error: results[1].reason.message };

    if (!openai.answer && !gemini.answer) {
      return res.status(502).json({
        error: "Both AI requests failed. Check the server API keys and model settings.",
        details: { openai: openai.error, gemini: gemini.error }
      });
    }
    return res.json({ mode, openai, gemini });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    return res.status(502).json({ error: error.message || "AI request failed." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Duo app listening on port ${PORT}`);
});
