"use strict";

// ========================================
// ROBLOX AI - DASHBOARD CONTROLLER
// ========================================

const BotState = {
    enabled: false,
    personality: "Friendly",
    accountConnected: false,
    aiConnected: false
};

const UI = {
    toggleButton: document.getElementById("toggleButton"),
    statusText: document.getElementById("statusText"),
    statusDot: document.getElementById("statusDot"),
    statusDescription: document.getElementById("statusDescription"),
    activityLog: document.getElementById("activityLog"),
    clearLog: document.getElementById("clearLog")
};

// ========================================
// ACTIVITY LOG
// ========================================

function addLog(message) {
    if (!UI.activityLog) return;

    const entry = document.createElement("div");

    entry.textContent =
        "[" + new Date().toLocaleTimeString() + "] " + message;

    UI.activityLog.appendChild(entry);

    while (UI.activityLog.children.length > 30) {
        UI.activityLog.removeChild(
            UI.activityLog.firstElementChild
        );
    }

    UI.activityLog.scrollTop = UI.activityLog.scrollHeight;
}

// ========================================
// DASHBOARD STATUS
// ========================================

function updateDashboard() {
    if (
        !UI.toggleButton ||
        !UI.statusText ||
        !UI.statusDot ||
        !UI.statusDescription
    ) {
        console.error("Roblox AI: Dashboard elements are missing.");
        return;
    }

    if (BotState.enabled) {
        UI.statusText.textContent = "DASHBOARD ACTIVE";
        UI.statusDot.style.background = "#4cff88";

        UI.toggleButton.textContent = "■ TURN ASSISTANT OFF";
        UI.toggleButton.style.background = "#ff6464";
        UI.toggleButton.style.color = "#200707";

        UI.statusDescription.textContent =
            "Dashboard enabled. AI services are not connected.";
    } else {
        UI.statusText.textContent = "OFFLINE";
        UI.statusDot.style.background = "#ff6464";

        UI.toggleButton.textContent = "▶ TURN ASSISTANT ON";
        UI.toggleButton.style.background = "#4cff88";
        UI.toggleButton.style.color = "#07130b";

        UI.statusDescription.textContent =
            "Your assistant is currently stopped.";
    }
}

// ========================================
// TURN ASSISTANT ON/OFF
// ========================================

function toggleAssistant() {
    BotState.enabled = !BotState.enabled;

    updateDashboard();

    if (BotState.enabled) {
        addLog("Dashboard activated.");
        addLog("Waiting for AI backend connection.");
    } else {
        addLog("Dashboard stopped.");
    }
}

// ========================================
// CLEAR ACTIVITY LOG
// ========================================

function clearActivityLog() {
    if (!UI.activityLog) return;

    UI.activityLog.replaceChildren();

    addLog("Activity log cleared.");
}

// ========================================
// PERSONALITY SETTINGS
// ========================================

function setPersonality(personality) {
    const availablePersonalities = [
        "Friendly",
        "Funny",
        "Troll",
        "Competitive",
        "Quiet"
    ];

    if (!availablePersonalities.includes(personality)) {
        addLog("Invalid personality selected.");
        return;
    }

    BotState.personality = personality;

    addLog("Personality changed to: " + personality);
}

// ========================================
// FEATURE STATUS
// ========================================

function setFeatureStatus(featureName, status) {
    const headings = document.querySelectorAll(".feature h3");

    for (const heading of headings) {
        if (heading.textContent.trim().includes(featureName)) {
            const card = heading.closest(".feature");

            if (!card) continue;

            const badge = card.querySelector(".feature-status");

            if (badge) {
                badge.textContent = status;
            }

            return;
        }
    }

    console.warn("Feature not found:", featureName);
}

// ========================================
// ACCOUNT SETTINGS
// ========================================

function handleAccountConnection() {
    addLog("Account settings opened.");

    alert(
        "Account connections are not configured yet.\n\n" +
        "We'll add a supported authentication flow later.\n\n" +
        "Never enter your Roblox password or session cookie here."
    );
}

// ========================================
// INITIALIZE DASHBOARD
// ========================================

function initializeDashboard() {
    if (UI.toggleButton) {
        UI.toggleButton.addEventListener(
            "click",
            toggleAssistant
        );
    }

    if (UI.clearLog) {
        UI.clearLog.addEventListener(
            "click",
            clearActivityLog
        );
    }

    updateDashboard();

    addLog("Roblox AI dashboard loaded.");
    addLog("Ready for configuration.");

    console.log("Roblox AI dashboard initialized.");
}

// ========================================
// PUBLIC FUNCTIONS FOR index.html
// ========================================

window.RobloxAIBot = {
    getState: function () {
        return {
            enabled: BotState.enabled,
            personality: BotState.personality,
            accountConnected: BotState.accountConnected,
            aiConnected: BotState.aiConnected
        };
    },

    setPersonality: setPersonality,

    setFeatureStatus: setFeatureStatus,

    connectAccount: handleAccountConnection,

    log: addLog
};

// Start dashboard
initializeDashboard();
