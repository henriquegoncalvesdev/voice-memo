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
    console.log("[Pipeline] Reading and encoding audio...");
    const audioData = fs.readFileSync(audioPath);
    const base64Audio = audioData.toString("base64");

    // Determine mime type (default to webm as per frontend hook)
    const mimeType = "audio/webm";

    console.log("[Pipeline] Sending multimodal request to Gemini 2.0 Flash via OpenRouter...");

    const systemPrompt = `You are an AI assistant that processes audio of voice memos.
Listen carefully to the audio and:
1. Provide a verbatim transcription.
2. Identify explicit Action Items (tasks).
3. Extract Deadlines (convert relative dates like 'next Friday' to YYYY-MM-DD based on today's date ${new Date().toISOString().split('T')[0]}).
4. Identify People assigned to tasks.
5. Summarize Key Insights in 2 sentences.

Output strictly in this JSON format:
{
  "transcript": string,
  "tasks": [{ "title": string, "priority": "high"|"medium"|"low", "due_date": string, "assignee": string }],
  "insights": [string]
}`;

    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe and analyze this audio memo."
            },
            {
              type: "image_url", // OpenRouter uses image_url schema for files/audio sometimes, but standard multimodal is better
              url: `data:${mimeType};base64,${base64Audio}`
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const structuredData = JSON.parse(content);
    console.log("[Pipeline] Processing complete.");
    console.log(`[Pipeline] Transcript: ${structuredData.transcript?.substring(0, 100)}...`);

    // Cleanup
    fs.unlink(audioPath, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    // Return combined data
    res.json({
      transcript: structuredData.transcript || "",
      actions: structuredData.tasks || [],
      insights: structuredData.insights || [],
    });
  } catch (error) {
    console.error("[Error] Processing failed:", error);

    // Attempt cleanup on error
    if (fs.existsSync(audioPath)) {
      fs.unlink(audioPath, () => { });
    }

    // Pass along more detail if available
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
