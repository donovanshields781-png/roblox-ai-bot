"use strict";

// ============================================
// ROBLOX AI - MAIN CONTROLLER
// ============================================

const CONFIG = {
    decisionInterval: 15000,
    autoTalkInterval: 30000,
    apiBase: "/api"
};

const State = {
    enabled: false,
    autonomous: false,
    autoTalk: false,
    gameDiscovery: false,
    gameHopping: false,
    personality: "Friendly",
    accountConnected: false,
    aiConnected: false,
    busy: false,
    lastAction: "Waiting for activation",
    timerIds: [],
    conversationCount: 0
};

const UI = {
    toggleButton: document.getElementById("toggleButton"),
    statusText: document.getElementById("statusText"),
    statusDot: document.getElementById("statusDot"),
    statusDescription: document.getElementById("statusDescription"),

    autonomousToggle: document.getElementById("autonomousToggle"),
    autoTalkToggle: document.getElementById("autoTalkToggle"),
    gameDiscoveryToggle: document.getElementById("gameDiscoveryToggle"),
    personalitySelect: document.getElementById("personalitySelect"),

    accountButton: document.getElementById("accountButton"),
    accountStatus: document.getElementById("accountStatus"),

    aiButton: document.getElementById("aiButton"),
    aiStatus: document.getElementById("aiStatus"),

    gameButton: document.getElementById("gameButton"),
    gameStatus: document.getElementById("gameStatus"),
    gameHoppingButton: document.getElementById("hopButton"),
    gameHoppingStatus: document.getElementById("hopStatus"),

    gameSearchInput: document.getElementById("gameSearchInput"),
    searchButton: document.getElementById("searchButton"),
    gameResults: document.getElementById("gameResults"),

    chatBox: document.getElementById("chatBox"),
    chatInput: document.getElementById("chatInput"),
    sendButton: document.getElementById("sendButton"),

    activityLog: document.getElementById("activityLog"),
    clearLog: document.getElementById("clearLog")
};

// ============================================
// ACTIVITY LOG
// ============================================

function log(message) {
    if (!UI.activityLog) return;

    const entry = document.createElement("div");

    entry.textContent =
        "[" + new Date().toLocaleTimeString() + "] " + message;

    UI.activityLog.appendChild(entry);

    while (UI.activityLog.children.length > 50) {
        UI.activityLog.removeChild(
            UI.activityLog.firstElementChild
        );
    }

    UI.activityLog.scrollTop = UI.activityLog.scrollHeight;
}

// ============================================
// SAFE CHAT DISPLAY
// ============================================

function addMessage(sender, message, isUser = false) {
    if (!UI.chatBox) return;

    const wrapper = document.createElement("div");
    wrapper.className = "message" +
        (isUser ? " user-message" : "");

    const name = document.createElement("strong");
    name.textContent = sender + ": ";

    const text = document.createElement("span");
    text.textContent = message;

    wrapper.appendChild(name);
    wrapper.appendChild(text);

    UI.chatBox.appendChild(wrapper);
    UI.chatBox.scrollTop = UI.chatBox.scrollHeight;
}

// ============================================
// DASHBOARD STATUS
// ============================================

function updateDashboard() {
    if (State.enabled) {
        UI.statusText.textContent = "ASSISTANT ACTIVE";
        UI.statusDot.style.background = "#4cff88";
        UI.toggleButton.textContent = "■ TURN AI OFF";
        UI.toggleButton.classList.add("danger-button");

        UI.statusDescription.textContent =
            "Assistant enabled. Available features depend on backend connections.";
    } else {
        UI.statusText.textContent = "OFFLINE";
        UI.statusDot.style.background = "#ff6464";
        UI.toggleButton.textContent = "▶ TURN AI ON";
        UI.toggleButton.classList.remove("danger-button");

        UI.statusDescription.textContent =
            "Your AI assistant is currently stopped.";
    }
}

// ============================================
// BACKEND REQUEST HELPER
// ============================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(CONFIG.apiBase + endpoint, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.error || "Request failed: " + response.status
        );
    }

    return data;
}

// ============================================
// AI CHAT
// ============================================

async function askAI(message) {
    if (!message || !message.trim()) return;

    if (State.busy) {
        log("AI is already processing a message.");
        return;
    }

    State.busy = true;

    if (UI.sendButton) {
        UI.sendButton.disabled = true;
        UI.sendButton.textContent = "...";
    }

    try {
        const result = await apiRequest("/chat", {
            method: "POST",
            body: JSON.stringify({
                message: message.trim(),
                personality: State.personality
            })
        });

        State.aiConnected = true;

        if (UI.aiStatus) {
            UI.aiStatus.textContent = "CONNECTED";
            UI.aiStatus.style.color = "#4cff88";
        }

        addMessage("Roblox AI", result.reply || "I have no response.");
        State.conversationCount++;

        log("AI generated a response.");
    } catch (error) {
        addMessage(
            "Roblox AI",
            "I couldn't connect to my AI brain. " + error.message
        );

        log("AI request failed: " + error.message);
    } finally {
        State.busy = false;

        if (UI.sendButton) {
            UI.sendButton.disabled = false;
            UI.sendButton.textContent = "SEND";
        }
    }
}

function sendChatMessage() {
    const message = UI.chatInput.value.trim();

    if (!message) return;

    UI.chatInput.value = "";
    addMessage("You", message, true);

    askAI(message);
}

// ============================================
// AUTOMATIC TALKING
// ============================================

const conversationStarters = [
    "Start a conversation about a fun Roblox game.",
    "Tell me an interesting gaming tip.",
    "Make a harmless joke about gaming.",
    "Ask me what kind of Roblox game I enjoy.",
    "Suggest a fun challenge for my next Roblox session.",
    "Talk about an interesting game mechanic.",
    "Ask me whether I prefer competitive games or casual games."
];

async function automaticTalk() {
    if (!State.enabled || !State.autoTalk || State.busy) {
        return;
    }

    const starter = conversationStarters[
        Math.floor(Math.random() * conversationStarters.length)
    ];

    log("AI is generating an automatic conversation.");

    await askAI(
        "You are starting a new conversation without being prompted. " +
        starter +
        " Keep it short and natural. Do not claim you performed actions " +
        "outside this website."
    );
}

// ============================================
// AUTONOMOUS DECISION LOOP
// ============================================

async function makeDecision() {
    if (!State.enabled || !State.autonomous || State.busy) {
        return;
    }

    log("AI is evaluating its next step.");

    const availableActions = [];

    if (State.autoTalk) {
        availableActions.push("start a conversation on this website");
    }

    if (State.gameDiscovery) {
        availableActions.push("suggest a Roblox experience to search for");
    }

    if (availableActions.length === 0) {
        log("No autonomous actions are enabled.");
        return;
    }

    try {
        const result = await apiRequest("/decide", {
            method: "POST",
            body: JSON.stringify({
                personality: State.personality,
                availableActions: availableActions,
                lastAction: State.lastAction
            })
        });

        State.lastAction = result.action || "Decision completed";

        log("AI decision: " + State.lastAction);

        if (result.action === "talk" && State.autoTalk) {
            await automaticTalk();
        } else if (result.action === "find_game" && State.gameDiscovery) {
            log("AI selected game discovery.");
            if (UI.gameSearchInput.value.trim()) {
                await searchGames();
            } else {
                log("Enter a game name to search for.");
            }
        }
    } catch (error) {
        log("Decision request failed: " + error.message);
    }
}

// ============================================
// START AND STOP
// ============================================

function startAssistant() {
    if (State.enabled) return;

    State.enabled = true;

    updateDashboard();
    log("Assistant activated.");

    State.timerIds.push(
        setInterval(makeDecision, CONFIG.decisionInterval)
    );

    State.timerIds.push(
        setInterval(automaticTalk, CONFIG.autoTalkInterval)
    );

    makeDecision();
}

function stopAssistant() {
    State.enabled = false;

    for (const timer of State.timerIds) {
        clearInterval(timer);
    }

    State.timerIds = [];

    updateDashboard();
    log("Assistant stopped.");
}

function toggleAssistant() {
    if (State.enabled) {
        stopAssistant();
    } else {
        startAssistant();
    }
}

// ============================================
// GAME DISCOVERY
// ============================================

async function searchGames() {
    const query = UI.gameSearchInput.value.trim();

    if (!query) {
        log("Enter a game name first.");
        return;
    }

    UI.gameResults.replaceChildren();

    const loading = document.createElement("p");
    loading.className = "muted";
    loading.textContent = "Searching Roblox experiences...";
    UI.gameResults.appendChild(loading);

    try {
        const result = await apiRequest(
            "/games?q=" + encodeURIComponent(query)
        );

        UI.gameResults.replaceChildren();

        if (!result.games || result.games.length === 0) {
            const empty = document.createElement("p");
            empty.className = "muted";
            empty.textContent = "No games found.";
            UI.gameResults.appendChild(empty);
            return;
        }

        for (const game of result.games) {
            const card = document.createElement("div");
            card.style.padding = "12px";
            card.style.marginTop = "10px";
            card.style.background = "#080b10";
            card.style.borderRadius = "8px";

            const title = document.createElement("strong");
            title.textContent = game.name || "Unknown game";

            const description = document.createElement("p");
            description.className = "muted";
            description.textContent =
                game.description || "Roblox experience";

            card.appendChild(title);
            card.appendChild(description);

            if (game.url) {
                const link = document.createElement("a");
                link.href = game.url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Open game page";
                link.style.color = "#4cff88";
                link.style.fontSize = "12px";

                card.appendChild(link);
            }

            UI.gameResults.appendChild(card);
        }

        log("Game search completed.");
    } catch (error) {
        UI.gameResults.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.className = "muted";
        errorMessage.textContent = error.message;

        UI.gameResults.appendChild(errorMessage);
        log("Game search failed: " + error.message);
    }
}

// ============================================
// GAME HOPPING SETTINGS
// ============================================

function toggleGameHopping() {
    State.gameHopping = !State.gameHopping;

    UI.gameHoppingStatus.textContent =
        State.gameHopping ? "ENABLED" : "DISABLED";

    UI.gameHoppingStatus.style.color =
        State.gameHopping ? "#4cff88" : "#ffcf70";

    log(
        "Game hopping setting " +
        (State.gameHopping ? "enabled." : "disabled.")
    );

    if (State.gameHopping) {
        log(
            "This setting does not join or leave Roblox games. " +
            "That capability requires a supported integration."
        );
    }
}

// ============================================
// ACCOUNT SETTINGS
// ============================================

function openAccountSettings() {
    log("Account settings opened.");

    alert(
        "Roblox account integration is not configured yet.\n\n" +
        "We will investigate supported connection methods.\n\n" +
        "Never enter your Roblox password or session cookie here."
    );
}

// ============================================
// CHECK BACKEND STATUS
// ============================================

async function checkAIStatus() {
    try {
        const result = await apiRequest("/status");

        State.aiConnected = Boolean(result.aiConnected);

        UI.aiStatus.textContent = State.aiConnected
            ? "CONNECTED"
            : "API KEY NEEDED";

        UI.aiStatus.style.color = State.aiConnected
            ? "#4cff88"
            : "#ffcf70";

        log(
            State.aiConnected
                ? "AI backend is configured."
                : "Backend is running, but its AI key is not configured."
        );
    } catch (error) {
        UI.aiStatus.textContent = "BACKEND OFFLINE";
        UI.aiStatus.style.color = "#ff6464";

        log("Backend is unavailable.");
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

UI.toggleButton.addEventListener("click", toggleAssistant);

UI.sendButton.addEventListener("click", sendChatMessage);

UI.chatInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        sendChatMessage();
    }
});

UI.clearLog.addEventListener("click", function () {
    UI.activityLog.replaceChildren();
    log("Activity log cleared.");
});

UI.accountButton.addEventListener("click", openAccountSettings);

UI.aiButton.addEventListener("click", checkAIStatus);

UI.gameButton.addEventListener("click", searchGames);

UI.searchButton.addEventListener("click", searchGames);

UI.gameSearchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchGames();
    }
});

UI.gameHoppingButton.addEventListener("click", toggleGameHopping);

UI.autonomousToggle.addEventListener("change", function () {
    State.autonomous = this.checked;

    log(
        "Autonomous mode " +
        (State.autonomous ? "enabled." : "disabled.")
    );

    if (State.enabled && State.autonomous) {
        makeDecision();
    }
});

UI.autoTalkToggle.addEventListener("change", function () {
    State.autoTalk = this.checked;

    log(
        "Automatic talking " +
        (State.autoTalk ? "enabled." : "disabled.")
    );

    if (State.enabled && State.autoTalk) {
        automaticTalk();
    }
});

UI.gameDiscoveryToggle.addEventListener("change", function () {
    State.gameDiscovery = this.checked;

    UI.gameStatus.textContent =
        State.gameDiscovery ? "ENABLED" : "READY TO SEARCH";

    log(
        "Game discovery " +
        (State.gameDiscovery ? "enabled." : "disabled.")
    );
});

UI.personalitySelect.addEventListener("change", function () {
    State.personality = this.value;

    log("Personality changed to " + State.personality + ".");
});

// ============================================
// INITIALIZE
// ============================================

updateDashboard();
log("Roblox AI dashboard initialized.");
checkAIStatus();

// Functions exposed for optional debugging.
window.RobloxAIBot = {
    getState: () => ({ ...State, timerIds: undefined }),
    askAI,
    searchGames,
    startAssistant,
    stopAssistant,
    log
};
