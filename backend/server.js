const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
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
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit (Whisper limit)
});

// Initialize OpenAI
// Note: If using OpenRouter, set baseURL and apiKey accordingly in .env
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

// The Double Pipeline Endpoint
app.post("/api/process-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const audioPath = req.file.path;

  try {
    console.log(`[Processing] Started processing for file: ${req.file.originalname}`);

    // STEP 1: Whisper (Speech-to-Text)
    console.log("[Pipeline] Step 1: Transcribing...");
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });

    const rawText = transcriptionResponse.text;
    console.log(`[Pipeline] Transcription complete. Length: ${rawText.length} chars`);

    // STEP 2: GPT-4o-mini (Extraction)
    console.log("[Pipeline] Step 2: Extracting Actions...");
    const systemPrompt = `Analyze the following transcription.
Identify explicit Action Items (tasks).
Extract Deadlines (convert relative dates like 'next Friday' to YYYY-MM-DD based on today's date).
Identify People assigned to tasks.
Summarize Key Insights in 2 sentences.
Output strictly in this JSON format:
{ "tasks": [{ "title": string, "priority": "high"|"medium"|"low", "due_date": string, "assignee": string }], "insights": [string] }`;

    const extractionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: rawText },
      ],
      response_format: { type: "json_object" },
    });

    const content = extractionResponse.choices[0].message.content;
    const structuredData = JSON.parse(content);
    console.log("[Pipeline] Extraction complete.");

    // Cleanup
    fs.unlink(audioPath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    // Return combined data
    res.json({
      transcript: rawText,
      actions: structuredData.tasks || [],
      insights: structuredData.insights || [],
    });
  } catch (error) {
    console.error("[Error] Processing failed:", error);
    
    // Attempt cleanup on error
    if (fs.existsSync(audioPath)) {
      fs.unlink(audioPath, () => {});
    }

    res.status(500).json({ error: error.message });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "EchoAction Backend" });
});

app.listen(port, () => {
  console.log(`EchoAction Backend running on port ${port}`);
});
