# Phase-Wise Implementation Plan — Kadak ya Cold Brew

This document outlines the phase-by-phase development lifecycle of the **Kadak ya Cold Brew** web application. It starts from local mock database sandboxing up to Firebase production setup and final public deployment.

---

## Phase 1: Local Sandbox & Boilerplate (Completed)
*Goal: Initialize application workspace, establish core styling, and create basic mockup systems.*

- [x] **Project Initialization**: Scaffold React + TypeScript project with Vite and TailwindCSS configuration.
- [x] **Theme & Typography Styling**: Define custom color palette tokens matching the warm near-black background (`#1a1210`), Chai terracotta (`#c8722c`), and Coffee espresso/cream elements (`#3d2b1f` / `#f0e4d0`). Preconnect display fonts from Google Fonts.
- [x] **Mock Database Layer**: Build custom `BroadcastChannel` communication mechanism (`mockDb.ts` and `presenceService`) to simulate real-time chat sync, reactions, and online counter statistics across multiple browser tabs locally.
- [x] **Procedural Audio Engine**: Design and compile `audioSynth.ts` utilising native Web Audio API oscillators and noise nodes to generate tea kettle ambient hums and randomized slurpy gulping sounds.

---

## Phase 2: Refined UI Components & Micro-interactions (Completed)
*Goal: Bring the mock design elements to life with responsive CSS animations, state management, and haptics.*

- [x] **Meditation-Style Onboarding**: Construct the two-button entry page (`Onboarding.tsx`) to select Chai/Coffee and generate unique themed usernames.
- [x] **Interactive Drinking Experience**: Create SVG assets representing a terracotta kulhad and black coffee mug. Wire up mouse/touch press handlers to trigger gradual liquid depletion, cup tilting, ripples, and haptic vibrations (`navigator.vibrate()`).
- [x] **Banter & Statistics Display**: Build the `TugOfWar.tsx` component with a progress bar and margin-based commentary generators. Include a force-refresh trigger for testing.
- [x] **Rolling Chat Interface**: Set up the single-room chat window displaying the last 20 messages, timestamps, and multi-tap emoji reactions (`ChatRoom.tsx`).

---

## Phase 3: Transition to Firebase Backend (Next Steps)
*Goal: Connect the mock database architecture to a live Firebase Spark real-time backend.*

- [ ] **Create Firebase Console Project**:
  - Establish a new Project in the Firebase Console.
  - Enable **Realtime Database** under Spark (free) tier.
- [ ] **Realtime Database Rules Configuration**:
  - Set security rules allowing open read/write access (since this is an anonymous sandbox) with proper data shapes validation:
    ```json
    {
      "rules": {
        ".read": true,
        ".write": true,
        "presence": {
          "$session_id": {
            ".validate": "newData.hasChildren(['username', 'side', 'lastSeen'])"
          }
        },
        "chat": {
          "messages": {
            "$message_id": {
              ".validate": "newData.hasChildren(['side', 'username', 'text', 'timestamp'])"
            }
          }
        }
      }
    }
    ```
- [ ] **Install Firebase SDK Client**:
  - Install dependencies: `npm install firebase`.
  - Create `src/services/firebaseConfig.ts` and store credentials.
- [ ] **Migrate Mock Services**:
  - Re-route `presenceService` to use Firebase `/presence` presence detection using standard client-side `onDisconnect()` handlers.
  - Update `mockDb.ts` to push messages to `/chat/messages` and read utilizing `limitToLast(20)`.
  - Implement dynamic hourly percentage updates via first-client-trigger writes on Firebase `/stats/displayedPercentages`.

---

## Phase 4: Sourcing Sound Assets & Asset Optimization
*Goal: Polish the sound design and assets for production release.*

- [ ] **Sound Asset Selection**:
  - Download high-quality, lightweight CC-licensed audio clips from Freesound.org / Mixkit if replacing synthetic sounds.
  - Store them as compressed `.mp3` or `.ogg` files in `/public/assets/audio/`.
- [ ] **Web Audio API Buffer Preloading**:
  - Update `audioSynth.ts` to preload and decode raw audio buffers instead of synth generators, maintaining randomized `playbackRate` controls.
- [ ] **SEO Optimization**:
  - Verify viewport scalability, add web-app manifest files, and update social preview Open Graph (`og:image`, `og:description`) meta headers.

---

## Phase 5: Production Build & Deployment
*Goal: Host the static frontend on a reliable free hosting provider.*

- [ ] **Hosting Setup**:
  - Set up deployment pipelines on **Vercel** or **Firebase Hosting**.
  - Configure automated GitHub Actions for CI/CD deployments.
- [ ] **Build Validation**:
  - Run linting and production compiler checks (`npm run build`).
  - Deploy and perform multi-device browser testing (Chrome, Safari iOS, Firefox).
