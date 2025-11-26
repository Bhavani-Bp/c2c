# User Feedback & Requirements Report

This document compiles user feedback, bug reports, and feature requests for the **Connect to Connect** application. It serves as a roadmap for developers to address issues and implement new features.

## Session 1 — FEEDBACK (What Users Say)

### A. Positive / Common Praise
- [ ] **Great idea / Fun for couples & friends**: Users enjoy synchronous listening + chat for long-distance social listening. (YouTube +1)
- [ ] **Ad-free listening & decent search**: Users appreciate the ad-free experience between songs and the search/radio options. (Google Play +1)

### B. Frequent Complaints / Bug Reports
> [!IMPORTANT]
> These are critical issues affecting user experience and retention.

- [ ] **Sync / Retry Errors**: Users face playback sync or retry issues. "Retry error fixes" and "sync" improvements are frequently mentioned. (App Store +1)
- [ ] **Video Not Playable**: Media playback bugs were a repeated problem, though some recent updates claim fixes. Needs verification. (Google Play +1)
- [ ] **No Background Playback**: A major missing feature. Users want audio to keep playing when the app is in the background. (App Store +1)
- [ ] **Difficulty Discovering People**: Lack of public rooms makes it hard for new users without friends on the app to join in. (Reddit)
- [ ] **UI/UX Roughness**: Users feel the UI is good but missing important features like background play and better room controls. (App Store +1)

### C. Trust & Data Notes
> [!WARNING]
> Privacy concerns can significantly impact user trust.

- [ ] **Data Declaration**: Google Play listing notes "Data isn't encrypted" and collects personal info. This raises privacy concerns. (Google Play)

### D. Monetization Feedback
- [ ] **Premium Clarity**: Users want clearer distinction between free and premium features, and fewer in-app ads (if applicable). (App Store)

---

## Session 2 — REQUIREMENTS / FEATURE REQUESTS (Prioritized)

### High Priority (Blocks Usage / Critical)
- [ ] **Background Playback**: Keep audio playing when app is backgrounded. Critical for music apps. (App Store +1)
- [ ] **Fix Sync/Retry Stability**: Ensure robust real-time sync so all participants hear the same beat. (App Store +1)
- [ ] **Public Rooms / Discovery**: Add a discovery page or public rooms to improve social engagement. (Reddit)

### Medium Priority (Strong UX Improvement)
- [ ] **Host Controls & Moderation**: Allow hosts to manage queue, remove songs/users, lock room. (Softonic)
- [ ] **Account & Social Features**: Friend search, follow, profiles, invite links. (YouTube +1)
- [ ] **Cross-Service Integration**: Import/export playlists from Spotify/Apple Music. (Google Play +1)

### Low / Nice-to-Have (Differentiators)
- [ ] **Offline Mode**: Downloads for offline listening. (Softonic)
- [ ] **Gapless Playback / Audio Quality**: Crossfade and quality settings. (Softonic)
- [ ] **Better Privacy Transparency**: Clarify encryption and data collection policies. (Google Play)
- [ ] **Host Scheduling**: Ability to schedule rooms or recurring sessions. (Headphonesty)

---

## QA / Telemetry / Engineering Asks
- [ ] **Client-side Telemetry**: Add logs for sync/latency metrics to help debug issues. (App Store)
- [ ] **Improve Error Messages**: specific, actionable feedback when playback fails (e.g., "Retry" button). (Google Play)

---

## Roadmap Suggestion

### Immediate (1–2 Sprints)
- [ ] Background playback
- [ ] Clearer retry/error messages
- [ ] Fix remaining sync edges
- [ ] Public rooms discovery (basic)

### Next (2–4 Sprints)
- [ ] Host/room controls
- [ ] Friend/invite links
- [ ] Improved privacy statements & encryption clarifications

### Later (R&D)
- [ ] Cross-service playlist import/export
- [ ] Offline mode
- [ ] Advanced audio settings
- [ ] Scheduled rooms
