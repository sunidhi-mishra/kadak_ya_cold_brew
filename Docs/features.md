# Project Features — Kadak ya Cold Brew

This document highlights all features, interactive mechanics, and live assets integrated into **Kadak ya Cold Brew**.

---

## 1. Onboarding & Anonymous Match Entry
*   **Zero Login barrier**: Users enter anonymously without password signups.
*   **Faction Selection**: Prompted to select either **Chai** or **Coffee** on entrance.
*   **Themed Name Generator**: Automatically generates funny, randomized, team-aligned usernames (e.g., `Adrak-42`, `Kesar-88` for Chai; `Espresso-12`, `Flat-White-30` for Coffee).
*   **Single-line Title**: Custom stylized header title **Kadak ya Cold Brew ? 🤔💭** in a unified layout.

---

## 2. Immersive Visual & Audio Theme
*   **Dynamic Backgrounds**: 
    *   **Chai theme**: Warm, terracotta-toned dark brown radial grid.
    *   **Coffee theme**: Jet-black dark carbon roast gradient.
*   **Cozy Header Bar**: Integrated status indicators showing online player metrics, along with inline buttons for sound control (**MUTED / LIVE**), clipboard **SHARE**, and session **EXIT**.
*   **Cozy Steam Effects**: Subtle steam rising micro-animations over the drinking cup container.
*   **Full Background Music**: Loopable background music track (`bgsound.mp3`) managed via the global audio controls.

---

## 3. Interactive Sip Mechanic
*   **Hold to Sip**: Users press and hold the button to empty their tea or coffee cup.
*   **Satisfying Slurp Audio**: Preloaded `/slurp.mp3` executes with random pitch variation (`0.9x` to `1.15x`) on every sip tick for natural zero-latency feedback.
*   **Manual Refill Prompt**: Once empty, clicking the cup triggers a dialogue confirmation. Clicking **YES** triggers `/pour.mp3` audio while filling the cup back up to 100%.

---

## 4. Real-time Chat Banter
*   **Pre-filtered Feed**: Users start with a clean chat session showing only the welcome messages at the top. Messages sent prior to the user's login timestamp are filtered out to keep discussion relevant.
*   **Invisible Scrollbar**: Native overflow scrolling remains fully functional, but the scrollbar UI elements are completely hidden for a clean aesthetic.
*   **Emoji Reactions**: Interactive emoji tray (`☕`, `🍵`, `🔥`, `😂`) beneath each bubble, synced globally.

---

## 5. Live Match Tug-of-War
*   **Sip Counter Tug-of-War**: Real-time progress bar reflecting the global matchup percentage.
*   **Hourly Reset**: Sip counts reset to zero at the end of each hour to start a new match.
*   **Live Countdown**: Visual clock displaying time left until the next hourly tick.
*   **Cricket-Style Commentary**: Contextual live text comments analyzing the match status based on margins (e.g. tight single run, comfortable lead, or blowout innings).
*   **Refresh Option**: Manual **REFRESH** button to query stats instantly.

---

## 6. Global Backend (Firebase Realtime Database)
*   **Global Presence Sync**: Synchronizes active sessions globally across separate devices, network paths, and browser profiles.
*   **Native Auto-Pruning**: Uses Firebase `onDisconnect()` listeners to remove sessions instantly if tabs are closed or connections drop.
