# Kadak Ya Cold Brew — Problem Statement & Build Spec

## 1. Project Summary

A lightweight, anonymous, no-login web app inspired by the "Chai Time" sip-and-chat format. Users pick a side — **Chai ☕ or Coffee 🍵** — get a random anonymous username, land in a shared real-time chat, and can "hold to sip" their drink with sound and animation. A live "online now" counter and an **hourly-updating tug-of-war percentage bar** (with cricket-commentary-style banter) turn the chai-vs-coffee cultural divide into a playful, ongoing "match."

This is a **fun, low-stakes side project** — not a monetized product. Priorities: zero cost, minimal backend complexity, fast to build, feels alive.

---

## 2. Core User Flow

1. User lands on the site → sees full-screen prompt: **"Chai ☕ or Coffee 🍵?"**
2. Taps one → instantly assigned a random anonymous username themed to their side (e.g., Chai: `Adrak-42`, `Kadak-Ninja`; Coffee: `Cold-Brew-7`, `Espresso-X`)
3. Lands on the main screen:
   - A cup/mug visual styled to their side
   - "HOLD TO SIP" button/area
   - Live online counter
   - Tug-of-war bar (updates hourly) + commentary line
   - Shared chat feed at the bottom
   - Sound toggle (muted by default)
4. User can hold the cup to "sip" (animation + sound), type messages in the shared chat, and see everyone's messages tagged with their chai/coffee icon.
5. No login, no persistence beyond the current session's rolling chat buffer.

---

## 3. Full Feature List (Build Exactly This — Nothing More)

### 3.1 Onboarding — Pick a Side
- Full-screen entry screen, two large tap targets: "☕ Chai" and "🍵 Coffee"
- No explanation text needed — the icons + labels are self-explanatory
- On tap:
  - Store choice in local session state (no login, no persistent account)
  - Auto-generate a themed anonymous username from a predefined name pool for that side
  - Transition to main screen

**Build detail:**
- Two arrays of prefixes: `chaiNames = ["Adrak", "Kadak", "Elaichi", "Masala", "Cutting", "Tulsi", ...]`, `coffeeNames = ["Cold-Brew", "Espresso", "Latte", "Mocha", "Cappuccino", "Americano", ...]`
- Append a random 2-digit number or short suffix (e.g., `Adrak-42`) to reduce collisions
- Store `{side: "chai" | "coffee", username: string, sessionId: uuid}` in browser memory (React state) for the session — **do not use localStorage/sessionStorage** (not supported reliably in the Antigravity/artifact sandbox and unnecessary for a session-only experience); regenerate on refresh, which is fine for this use case

---

### 3.2 Main Screen — Cup / Sip Interaction
- Central cup/mug graphic:
  - Chai side: terracotta kulhad / brown ceramic cup styling
  - Coffee side: black mug / cream-toned cup styling
- **"HOLD TO SIP"** label under the cup
- Press-and-hold interaction (mouse `mousedown`/`mouseup` on desktop, `touchstart`/`touchend` on mobile):
  - While holding: liquid level inside the cup graphic gradually drops (SVG clip-path or mask animation)
  - On release (or after a short cooldown, e.g. 3–4 seconds of continuous hold): liquid refills smoothly
  - Each "tick" of holding (e.g., every 300–400ms) triggers a **slurp**:
    - A short, slightly pitch-randomized **slurpy sip sound** (a proper audible "slurrrp," not just a soft sip — this is the core tactile payoff of the whole interaction and should feel a little exaggerated/funny, not subtle)
    - A quick **cup-tilt animation**: the cup graphic tilts a few degrees toward the user on each slurp tick and springs back, giving the visual sense of an actual gulp
    - A small **ripple/wobble** on the liquid surface at the moment of each slurp tick (a brief squash-and-stretch or ripple keyframe on the liquid's top edge), synced to land exactly on the sound
    - A subtle haptic vibration on supported mobile devices (`navigator.vibrate(10)`), wrapped in a feature-check since not all devices support it
  - On the very first slurp tick of a hold, add a slightly longer/louder "opening slurp" sound variant for extra satisfaction, then shorter slurps on subsequent ticks while still holding
- **Ambient steam/wisp particles**: simple looping SVG or CSS animation of 3–4 thin wavy lines rising and fading above the cup, running continuously when idle (not tied to the hold interaction)

**Build detail:**
- Build the cup as an SVG with a `<clipPath>` or `<rect>` mask representing liquid level, animate the mask's height/y-position via CSS transition or `requestAnimationFrame` while `isHolding` state is true
- Slurp sound: 2–3 short slurp sound-effect variants (avoid a single repeating clip — cycle randomly between them), each played via Web Audio API with `playbackRate` randomized (e.g., 0.9–1.15) per tick so it never sounds identical twice
- Cup-tilt: a CSS `transform: rotate()` transition on the cup SVG group, triggered per tick (e.g., rotate 4–6deg and back within ~250ms, matched to the sound's duration)
- Liquid ripple: a keyframe animation on the liquid mask's top edge (slight vertical squash, ~150ms) fired in sync with each slurp tick, so the visual "gulp" and the sound land together
- Steam: 3 `<path>` elements with a CSS `@keyframes` animation offsetting `translateY` and `opacity` in a loop, staggered with `animation-delay`

---

### 3.3 Live Online Counter
- Small badge in the header: `● 14 Online`
- Updates in real time as users connect/disconnect
- This is the ONE piece of state that stays truly real-time (cheap to sync — just a connection count)

**Build detail:**
- Use Firebase Realtime Database's built-in **presence system** (`onDisconnect()` + a `/presence/{sessionId}` node). Each client writes `true` to their presence node on connect and Firebase automatically removes it on disconnect (handles tab closes, network drops, etc. without extra backend code)
- Client subscribes to `/presence` and displays `Object.keys(snapshot.val()).length`

---

### 3.4 Chai-vs-Coffee Tug-of-War Bar (Hourly, Not Live)
- A horizontal bar showing the current split, e.g. `64% Chai · 36% Coffee`
- **Recomputed once per hour**, not on every join — this is intentional (avoids noisy real-time percentage flicker and reduces backend load)
- A visible countdown: `Next update in 42 min` so the hourly cadence reads as intentional, not broken
- A rotating **cricket-commentary-style line** based on the current margin between sides, randomly selected from a template bank each time the hour flips:
  - Margin < 10% → "nail-biter" templates, e.g. *"Nail-biter! Chai edges ahead by a whisker ☕"*
  - Margin 10–30% → "comfortable lead" templates, e.g. *"Chai's cruising at a healthy run rate today"*
  - Margin > 30% → "blowout" templates, e.g. *"Coffee's been bowled out early, Chai declares the innings ☕😏"*
- Maintain ~15–20 template lines total (split across the three margin bands) to avoid repetition fatigue; pick randomly from the matching band each update

**Build detail:**
- Store two running counters in Firebase: `/stats/chaiCount` and `/stats/coffeeCount`, incremented once per unique session when a side is picked (not per message, just per user who joined)
- Store `/stats/lastUpdated` (timestamp) and `/stats/displayedPercentages` (the "frozen" hourly snapshot the UI actually shows)
- On each client load, check if `now - lastUpdated > 1 hour`. If yes, recompute percentages from the live counts, pick a new random commentary line matching the new margin band, and write the updated snapshot + timestamp back to Firebase (first client to load after the hour mark triggers the update — no server cron needed, keeps this free-tier friendly)
- All other clients just read `/stats/displayedPercentages`, `/stats/lastUpdated`, and the current commentary line, and compute the countdown client-side as `3600 - (now - lastUpdated)` seconds

---

### 3.5 Shared Chat
- **Single shared chat room** — chai and coffee users are NOT split into separate rooms (this keeps the chat feeling alive even with a small user base)
- Each message shows: side icon (☕/🍵) + username + message text
- Rolling buffer: only the **last 15–20 messages** are shown; older messages fade out and are not stored or retrievable
- Simple text input + Send button at the bottom
- Lightweight **emoji reactions** on messages (☕ 🔥 😂) as a low-friction alternative to typing a reply — tapping one increments a small counter next to that reaction on the message

**Build detail:**
- Firebase Realtime Database node `/chat/messages`, pushed with `push()` (auto-generates ordered keys)
- Client subscribes with `limitToLast(20)` so only the most recent 20 messages are ever fetched — this naturally handles both the "rolling buffer" requirement and keeps bandwidth low
- To actually cap storage (not just display) and stay within free-tier limits, run a simple cleanup: after pushing a new message, if the total count under `/chat/messages` exceeds ~50, delete the oldest ones (can be done client-side opportunistically, no server function needed for this scale)
- Reactions: nested object per message `/chat/messages/{msgId}/reactions/{emoji}: count` — increment via a Firebase transaction to handle concurrent taps safely

---

### 3.6 Sound
- One soft ambient background loop (kettle simmer / café hum), **muted by default**
- Visible mute/unmute toggle icon in the header
- First user interaction (tap anywhere, or the toggle itself) unmutes it — this satisfies browser autoplay restrictions, which block unmuted audio from playing before any user gesture
- **Slurpy sip sound effects** on each hold-tick (see 3.2) are the star sound of the app — short, satisfying, slightly exaggerated slurp noises, cycled across 2–3 variants with randomized pitch so repeats don't feel robotic. These play independently of the ambient toggle (always audible once the user has interacted once), since they're the core tactile feedback of the whole experience, not background flavor

**Build detail:**
- Use two `<audio>` elements (or Web Audio API `AudioContext` if more control over pitch-randomization is wanted for the sip sound)
- For the sip sound's pitch variation: use Web Audio API's `playbackRate` property, randomized slightly (e.g., `0.9–1.1`) on each play, so repeated ticks don't sound robotic
- Source royalty-free ambient/sip sound clips from a free sound library (e.g., Freesound.org, Mixkit) — must confirm license allows this kind of use before shipping publicly

---

### 3.7 Share
- A "Share" button that generates a shareable link/image reflecting the current tug-of-war percentages (e.g., "64% Chai · 36% Coffee — which side are you on?")
- Simple implementation: use the Web Share API where supported (`navigator.share()`), falling back to a "copy link" button on unsupported browsers

---

## 5. Tech Stack (All Free-Tier)

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | **React** (via Antigravity/vibe-coding, or plain Vite + React) | Component-based, easy state management for hold-to-sip, chat, and side selection |
| Styling | **Plain CSS / CSS variables**, or Tailwind if the build environment supports it | Keep it light — no heavy UI framework needed |
| Realtime backend | **Firebase Realtime Database (free Spark plan)** | Free tier supports up to 100 simultaneous connections and 1GB storage/10GB/month downloaded — sufficient for a small-scale fun project. Built-in presence detection (`onDisconnect`) makes the "online count" feature nearly free to implement correctly |
| Hosting (frontend) | **Firebase Hosting** or **Vercel** (both free tiers) | Static hosting for the React build; both have generous free bandwidth for low-to-moderate traffic |
| Audio | **HTML5 `<audio>` + Web Audio API** (`playbackRate` for pitch variation) | No cost, native browser support, no external service needed |
| Sound assets | **Freesound.org / Mixkit (free/CC-licensed clips)** | Free ambient + sip sound effects — confirm license terms before use |
| Animations | **CSS keyframes + SVG** (clip-path/mask for liquid level, simple path animations for steam) | No animation library needed; keeps bundle size small |
| Haptics | **Web Vibration API** (`navigator.vibrate()`), feature-detected | Free, native, works on supported Android browsers (not iOS Safari — acceptable graceful degradation) |
| Sharing | **Web Share API** (`navigator.share()`) with clipboard-copy fallback | Native, free, no third-party share SDK needed |

---

## 6. UI / UX Look & Feel

**Overall tone:** Warm, minimal, a little playful — closer to a cozy chai stall at dusk than a polished SaaS product. Dark background, warm accent colors, generous negative space, no clutter.

**Color palette:**
- Background: near-black warm brown (`#1a1210` or similar — matches the Chai Time reference aesthetic)
- Chai accent: burnt orange / terracotta (`#c8722c`-ish)
- Coffee accent: deep espresso brown / cream (`#3d2b1f` with cream text `#f0e4d0`)
- Text: warm off-white / muted gold for headers, soft gray for secondary text

**Typography:**
- Monospace or slightly retro display font for headers (matches the "CHAI TIME" reference styling — blocky, warm, a little nostalgic)
- Clean, readable sans-serif for chat text and body copy

**Motion & feel:**
- Steam wisps: slow, continuous, subtle (should feel ambient, not distracting)
- Liquid drain/refill on hold: smooth easing, not linear — should feel a bit like a real physical drink level dropping
- New chat messages: fade/slide in gently; oldest messages fade out rather than snapping away
- Percentage bar: when it updates on the hour, animate the fill transition smoothly (e.g., 800ms ease) rather than jumping instantly, so returning users notice the shift

**Onboarding screen feel:**
- Full-bleed, centered, almost meditative — just the two big tap choices, nothing else competing for attention, mirroring the calm minimalism of the reference app's "TAP TO ENTER" screen

---