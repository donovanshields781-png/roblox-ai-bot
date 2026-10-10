"use strict";

const express = require("express");
const OpenAI = require("openai");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

// OpenAI API key must be configured as a private environment variable.
const apiKey = process.env.OPENAI_API_KEY;

const openai = apiKey
    ? new OpenAI({ apiKey })
    : null;

// Serve your website files.
app.use(express.static(__dirname));

// Health check.
app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        aiConnected: Boolean(openai),
        name: "Roblox AI"
    });
});

// Chat endpoint.
app.post("/api/chat", async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({
                error: "AI is not configured. Add your OpenAI API key to the server environment."
            });
        }

        const { message, personality } = req.body || {};

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Please enter a message."
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                error: "Your message is too long. Keep it under 2,000 characters."
            });
        }

        const personalities = {
            Friendly: "You are friendly, supportive, and helpful.",
            Funny: "You are funny and playful, using harmless jokes.",
            Troll: "You make harmless jokes without bullying or harassing people.",
            Competitive: "You are energetic, competitive, and enjoy gaming.",
            Quiet: "You are calm, concise, and thoughtful."
        };

        const selectedPersonality =
            personalities[personality] || personalities.Friendly;

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            instructions:
                "You are Roblox AI, a gaming companion. " +
                selectedPersonality +
                " Help users discuss Roblox games, ideas, and strategies. " +
                "Never claim you are controlling a Roblox account or playing a game unless that capability is genuinely connected.",
            input: message.trim(),
            max_output_tokens: 400
        });

        res.json({
            reply: response.output_text || "I couldn't generate a response. Try again."
        });
    } catch (error) {
        console.error("AI request failed:", error.message);

        res.status(500).json({
            error: "The AI request failed. Check the server configuration and try again."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Roblox AI server running on port ${PORT}`);
});
