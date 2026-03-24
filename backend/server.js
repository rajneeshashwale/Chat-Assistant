import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';
import multer from 'multer';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 5000; // Updated to match Frontend script.js

// Middleware
app.use(cors()); // Allow frontend to communicate with backend
app.use(express.json());

// Configure Multer for RAM storage (handles image uploads in memory)
const upload = multer({ storage: multer.memoryStorage() });

const API_KEY = process.env.API_KEY;

// Helper function to call Gemini API
async function callGemini(parts) {
    if (!API_KEY) throw new Error("API Key is missing in .env file");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message || "API Error");
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

// Route 1: Chat (Text only)
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        // Call AI
        const reply = await callGemini([{ text: message }]);
        res.json({ reply });

    } catch (error) {
        console.error("Chat Error:", error.message);
        res.status(500).json({ error: 'Failed to process chat request' });
    }
});

// Route 2: Image Upload + Prompt
app.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Image file is required' });
        
        const prompt = req.body.prompt || "Describe this image";
        const imageBase64 = req.file.buffer.toString('base64');
        
        // Prepare payload for Gemini Vision
        const parts = [
            { text: prompt },
            { inline_data: { mime_type: req.file.mimetype, data: imageBase64 } }
        ];

        const reply = await callGemini(parts);
        res.json({ reply });

    } catch (error) {
        console.error("Image Error:", error.message);
        res.status(500).json({ error: 'Failed to process image request' });
    }
});

app.listen(PORT, () => {
    console.log(`Secure Server running on http://localhost:${PORT}`);
});