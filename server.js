"use strict";

const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "20kb" }));

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    })
    : null;

// ========================================
// AI PERSONALITIES
// ========================================

const personalities = {
    Friendly: "You are a friendly, helpful gaming companion.",
    Funny: "You are a funny gaming companion who makes harmless jokes.",
    Troll: "You make playful, harmless jokes without bullying anyone.",
    Competitive: "You are energetic and competitive about gaming.",
    Quiet: "You are calm, thoughtful, and concise."
};

function getPersonality(name) {
    return personalities[name] || personalities.Friendly;
}

// ========================================
// STATUS
// ========================================

app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        aiConnected: Boolean(openai),
        name: "Roblox AI",
        features: {
            chat: Boolean(openai),
            autonomousDecisions: Boolean(openai),
            gameDiscovery: true
        }
    });
});

// ========================================
// AI CHAT
// ========================================

app.post("/api/chat", async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({
                error: "AI is not configured. Add OPENAI_API_KEY to your hosting environment."
            });
        }

        const { message, personality } = req.body || {};

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Enter a message first."
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                error: "Messages must be under 2,000 characters."
            });
        }

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            instructions:
                "You are Roblox AI, an AI gaming companion. " +
                getPersonality(personality) +
                " Help with Roblox games, game ideas, and gaming discussions. " +
                "You may suggest actions, but never claim to have performed " +
                "gameplay, joined a game, or sent an in-game message unless " +
                "a real integration confirms that action.",
            input: message.trim(),
            max_output_tokens: 400
        });

        res.json({
            reply: response.output_text || "I couldn't generate a response."
        });
    } catch (error) {
        console.error("Chat error:", error.message);

        res.status(500).json({
            error: "The AI couldn't respond. Check the server logs."
        });
    }
});

// ========================================
// AUTONOMOUS DECISION MAKING
// ========================================

app.post("/api/decide", async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({
                error: "The AI backend is not configured."
            });
        }

        const { personality, availableActions, lastAction } =
            req.body || {};

        const allowedActions = [
            "talk",
            "find_game",
            "idle"
        ];

        const actions = Array.isArray(availableActions)
            ? availableActions.filter(action =>
                action === "start a conversation on this website" ||
                action === "suggest a Roblox experience to search for"
            )
            : [];

        if (actions.length === 0) {
            return res.json({
                action: "idle",
                message: "No actions are currently available."
            });
        }

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            instructions:
                "You are the decision-making system for a Roblox AI companion. " +
                getPersonality(personality) +
                " Choose exactly one action from this list: " +
                allowedActions.join(", ") +
                ". Choose talk when conversation is available. " +
                "Choose find_game when game discovery is available. " +
                "Otherwise choose idle. Return only valid JSON in this format: " +
                '{"action":"talk","reason":"short reason"}.',
            input: JSON.stringify({
                availableActions: actions,
                lastAction: String(lastAction || "None").slice(0, 200)
            }),
            text: {
                format: {
                    type: "json_object"
                }
            },
            max_output_tokens: 100
        });

        let decision;

        try {
            decision = JSON.parse(response.output_text);
        } catch {
            decision = { action: "idle" };
        }

        if (!allowedActions.includes(decision.action)) {
            decision.action = "idle";
        }

        if (
            decision.action === "talk" &&
            !actions.includes("start a conversation on this website")
        ) {
            decision.action = "idle";
        }

        if (
            decision.action === "find_game" &&
            !actions.includes("suggest a Roblox experience to search for")
        ) {
            decision.action = "idle";
        }

        res.json({
            action: decision.action,
            reason: String(decision.reason || "Decision completed").slice(0, 200)
        });
    } catch (error) {
        console.error("Decision error:", error.message);

        res.status(500).json({
            error: "Couldn't generate an AI decision."
        });
    }
});

// ========================================
// ROBLOX GAME DISCOVERY
// ========================================

app.get("/api/games", async (req, res) => {
    try {
        const query = String(req.query.q || "").trim();

        if (!query) {
            return res.status(400).json({
                error: "Enter a game name to search."
            });
        }

        if (query.length > 100) {
            return res.status(400).json({
                error: "Search must be under 100 characters."
            });
        }

        // Roblox's public game search endpoint.
        const url = new URL(
            "https://games.roblox.com/v1/games/list"
        );

        url.searchParams.set("model.keyword", query);
        url.searchParams.set("model.maxRows", "10");
        url.searchParams.set("model.sortOrder", "2");

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(502).json({
                error: "Roblox game search is temporarily unavailable."
            });
        }

        const data = await response.json();

        const games = (data.games || []).map(game => ({
            name: game.name || "Unknown game",
            description: game.description || "",
            placeId: game.placeId || null,
            url: game.placeId
                ? "https://www.roblox.com/games/" + game.placeId
                : null
        }));

        res.json({ games });
    } catch (error) {
        console.error("Game search error:", error.message);

        res.status(500).json({
            error: "Couldn't search for Roblox games."
        });
    }
});

// ========================================
// BASIC ERROR HANDLING
// ========================================

app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(500).json({
        error: "An unexpected server error occurred."
    });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
    console.log("================================");
    console.log(" ROBLOX AI BACKEND");
    console.log(" Port: " + PORT);
    console.log(" AI configured: " + Boolean(openai));
    console.log("================================");
});
