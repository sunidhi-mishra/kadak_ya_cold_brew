# Kadak ya Cold Brew ? 🤔💭

**Kadak ya Cold Brew** is a real-time, interactive matchmaking web application pitting Chai lovers against Coffee enthusiasts in a live hourly tug-of-war match. Playable globally with zero authentication required.

---

## 🚀 Key Features

*   **Anonymous Matchmaking**: Jump right in, select your side, and get assigned a funny team-aligned username (e.g. `Adrak-42`, `Flat-White-30`).
*   **Hold to Sip**: Press and hold to sip your beverage, emptying your cup with satisfying zero-latency slurp sounds (`/slurp.mp3` with randomized pitch shifts).
*   **Manual Refilling**: Confirm dialogue to refill your cup, triggering realistic pouring audio (`/pour.mp3`).
*   **Global Real-time Chat**: Connect and chat with other online players. Chat feeds are pre-filtered to show only live messages sent since you joined, alongside local welcome greetings.
*   **Tug-of-War Match Status**: Track cumulative percentages live. Match sips reset back to zero every hour, complete with a live countdown timer and cricket-style match commentary.
*   **Global Presence Counter**: Tracks total active users online at any given time using Firebase Realtime Database.

---

## 🛠️ Tech Stack

*   **Frontend**: React (TypeScript), TailwindCSS, Lucide Icons
*   **Build Tool**: Vite
*   **Backend & Presence**: Firebase Realtime Database & Firebase Hosting
*   **Audio Engine**: Web Audio API (preloaded buffers for zero-latency slurps and pours) & HTML5 Audio (background music stream)

---

## 📦 Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd Kadak_ya_Cold_Brew
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Firebase**:
    Create a project on [Firebase Console](https://console.firebase.google.com/), enable the **Realtime Database** (configured in Asia Southeast or your preferred region), and populate your credentials in `src/firebaseConfig.ts`.

4.  **Realtime Database Rules**:
    Set your database security rules in the Firebase console to allow public reads and writes for anonymous access:
    ```json
    {
      "rules": {
        ".read": true,
        ".write": true
      }
    }
    ```

5.  **Run Locally**:
    ```bash
    npm run dev
    ```

6.  **Build for Production**:
    ```bash
    npm run build
    ```

7.  **Deploy to Firebase**:
    ```bash
    firebase deploy
    ```

---

## 📂 Project Structure

*   `src/components/`: Onboarding screen, cup interaction loop, tug-of-war matching metrics, and the banter chat room.
*   `src/services/`: Custom Web Audio synthesizers (`audioSynth.ts`) and Firebase RTDB subscribers/transactions (`mockDb.ts`).
*   `src/firebaseConfig.ts`: Central Firebase SDK web credentials.
*   `Docs/`: Detailed system architecture, implementation logs, and specifications.
