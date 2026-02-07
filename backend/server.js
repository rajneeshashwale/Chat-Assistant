import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 5000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

/* ✅ EXACT MODEL FROM ListModels */
const GEMINI_MODEL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.send("✅ Gemini backend running (2.5 Flash)");
});

/* ---------- TEXT CHAT ---------- */
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.json({ reply: "❌ Empty message" });
    }

    const response = await fetch(`${GEMINI_MODEL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: userMessage }]
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ reply: `❌ Gemini Error: ${data.error.message}` });
    }

    res.json({
      reply:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "❌ Server error" });
  }
});

/* ---------- IMAGE CHAT ---------- */
app.post("/image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ reply: "❌ No image received" });
    }

    const base64Image = req.file.buffer.toString("base64");

    const response = await fetch(`${GEMINI_MODEL}?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Describe this image in detail." },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64Image
                }
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.json({ reply: `❌ Gemini Error: ${data.error.message}` });
    }

    res.json({
      reply:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No image response"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "❌ Image processing error" });
  }
});

/* ---------- START SERVER ---------- */
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
