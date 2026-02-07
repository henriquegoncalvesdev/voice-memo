const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const Groq = require("groq-sdk");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for audio uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Initialize Groq for Whisper transcription
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Initialize OpenAI (OpenRouter) for LLM analysis
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// Two-Stage Pipeline Endpoint
app.post("/api/process-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const audioPath = req.file.path;
  // Rename file with extension for Groq
  const audioPathWithExt = audioPath + ".webm";
  fs.renameSync(audioPath, audioPathWithExt);

  try {
    // ============================================
    // STAGE 1: Transcribe with Groq Whisper
    // ============================================
    console.log("[Stage 1] Transcribing audio with Groq Whisper...");

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPathWithExt),
      model: "whisper-large-v3-turbo",
      response_format: "text",
    });

    console.log("[Stage 1] Transcription complete:", transcription);

    if (!transcription || transcription.trim() === "") {
      throw new Error("Transcription returned empty. Please speak clearly and try again.");
    }

    // ============================================
    // STAGE 2: Extract tasks with LLM
    // ============================================
    console.log("[Stage 2] Extracting tasks with LLM...");

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are a professional assistant that extracts actionable information from voice memo transcripts.

CRITICAL INSTRUCTIONS:
1. The user's transcript is provided below. Do NOT modify or summarize it.
2. TASKS: Identify explicit tasks mentioned. 
   - Assign a "priority" (high, medium, or low).
   - Extract "due_date" (convert relative dates like 'next Friday' or 'tomorrow' to YYYY-MM-DD based on today: ${today}). If no date is mentioned, return null.
   - Extract "assignee" (the person responsible). If not mentioned, return null.
3. INSIGHTS: Provide 2-3 concise summary sentences of the key points.

OUTPUT FORMAT:
Return strictly a JSON object:
{
  "tasks": [
    { "title": "Task description", "priority": "high", "due_date": "YYYY-MM-DD", "assignee": "Name" }
  ],
  "insights": ["Point 1", "Point 2"]
}

If no tasks are found, return an empty array for "tasks".`;

    const response = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "google/gemini-2.0-flash-001",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here is the transcript:\n\n${transcription}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    console.log("[Stage 2] LLM Response:", content);

    let structuredData;
    try {
      structuredData = JSON.parse(content);
    } catch (parseError) {
      console.error("[Stage 2] JSON Parse Error:", parseError, "Raw:", content);
      throw new Error("Failed to parse LLM response as JSON");
    }

    console.log("[Pipeline] Processing complete.");

    // Cleanup
    fs.unlink(audioPathWithExt, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    // Return combined data
    res.json({
      transcript: transcription,
      actions: Array.isArray(structuredData.tasks) ? structuredData.tasks : [],
      insights: Array.isArray(structuredData.insights) ? structuredData.insights : [],
    });
  } catch (error) {
    console.error("[Error] Processing failed:", error);

    // Attempt cleanup on error
    if (fs.existsSync(audioPathWithExt)) {
      fs.unlink(audioPathWithExt, () => { });
    }

    const statusCode = error.status || 500;
    const message = error.message || "Internal Server Error";
    res.status(statusCode).json({ error: message, detail: error.response?.data || null });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "EchoAction Backend" });
});

app.listen(port, () => {
  console.log(`EchoAction Backend running on port ${port}`);
});
