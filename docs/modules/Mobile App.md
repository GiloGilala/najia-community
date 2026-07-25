# Module Spec — Mobile App

*Document Version: 1.0.0*
*Last Updated: 2026-07-20*
*Status: Draft*
*Owner: Engineering Lead*
*Reviewers: Product Lead, Design Lead, Mobile Lead (TBD), Operations Director*

> **Changelog:**
> - 1.0.0 (2026-07-20) — Initial draft. Module scope: Expo React Native app, iOS and Android, mobile-specific concerns (offline support, native features, performance), integration with the Hono API. Out of scope: push notifications (deferred to Year 2), native features beyond Expo's standard capabilities, separate business logic (all logic is in the services layer).

---

## 1. Overview

### 1.1 Module Name

Mobile App

### 1.2 Purpose

Provide a native mobile experience for iOS and Android that wraps the Hono API and delivers the platform's features on mobile devices. The mobile app is a client of the existing API — all business logic lives in the services layer, and the mobile app is a thin presentation layer. The module's primary design constraints are: (1) **API parity** — the mobile app supports the same features as the web app; (2) **offline resilience** — limited offline support for specific features; (3) **mobile-native UX** — the app is designed for mobile, not a ported web app; (4) **performance on low-bandwidth** — most pilot users will be on mid-range Android over 4G.

### 1.3 In Scope

- Expo React Native app for iOS and Android
- Authentication (login, session management, token refresh)
- Identity verification flows (NIMC, Onfido)
- Policy polls (view, vote, see results)
- Confidence votes (view, vote, see results)
- Evidence upload (with offline queue)
- Lawyer marketplace (directory, profile, intake, match, schedule, consultation)
- Lawyer reviews (post-consultation prompt, review submission)
- Blog and legal literacy (read, progress, quiz)
- Profile and settings
- Offline support for:
  - Evidence upload queue
  - Cached poll results
  - Cached blog/legal literacy content
  - Cached lawyer profiles
- Mobile-specific UX (touch targets, gestures, navigation patterns)
- Low-bandwidth optimizations
- App store metadata and submission
- Analytics and crash reporting (basic)

### 1.4 Out of Scope

- **Push notifications** — deferred to Year 2. In-app notifications only in the pilot.
- **Native features beyond Expo's standard capabilities** — the app uses Expo's managed workflow. Custom native code is deferred to Year 2.
- **Separate business logic** — all business logic is in the services layer. The mobile app is a client only.
- **iPad-specific layouts** — the app works on iPad but is not optimized for tablet layouts in the pilot.
- **Android tablet-specific layouts** — same as iPad.
- **Widget / home screen shortcuts** — deferred to Year 2.
- **Siri / Google Assistant integration** — deferred to Year 2.
- **Wearable app** — out of scope.
- **Mobile-specific content** — content is shared with the web app. No mobile-only content in the pilot.
- **Background sync** — the offline queue syncs when the app is foregrounded. Background sync is deferred to Year 2.

### 1.5 Success Metrics

| Metric | Target (pilot end) | Measurement method |
|--------|---------------------|---------------------|
| App store rating | ≥ 4.0 | App Store / Play Store |
| Crash-free sessions | ≥ 99% | Crash reporting |
| App load time (cold start) | < 3s on mid-range Android | Performance monitoring |
| API call success rate | ≥ 95% | API monitoring |
| Offline queue success rate | ≥ 80% (queued items eventually sync) | Queue metrics |
| Active mobile users (MAU) | ≥ 200 (40% of 500 pilot MAU target) | Analytics |
| Mobile-app-only feature usage | Track (no specific target) | Analytics |

---

## 2. User Stories

| As a... | I want to... | So that... | Priority |
|---------|--------------|------------|----------|
| Mobile user | Install the app from the App Store / Play Store | I can use the platform on my phone | Must |
| Mobile user | Log in with my existing account | I can use the same account on mobile and web | Must |
| Mobile user | Complete identity verification on my phone | I can use the verified features | Must |
| Mobile user | Vote on a policy poll | I can participate in civic engagement | Must |
| Mobile user | Vote on a confidence question | I can participate in civic engagement | Must |
| Mobile user | Upload evidence with my phone's camera | I can submit evidence as I encounter it | Must |
| Mobile user | See a queue of evidence uploads when offline | I know my uploads are pending | Must |
| Mobile user | Get matched to a lawyer and schedule a consultation | I can find legal help | Must |
| Mobile user | Join a video consultation from my phone | I can have a video call | Must |
| Mobile user | Read blog posts and legal literacy modules | I can learn on the go | Must |
| Mobile user | Complete a legal literacy quiz | I can track my progress | Must |
| Mobile user | Submit a review after a consultation | I can share my experience | Should |
| Mobile user | Use the app on a low-bandwidth connection | I can use it in areas with poor connectivity | Must |
| Mobile user | See my profile and settings | I can manage my account | Must |
| Mobile user | Receive in-app notifications | I know about new polls, matches, etc. | Should |
| Mobile user | Log out securely | I can protect my account | Must |

---

## 3. Functional Specification

### 3.1 Architecture

The mobile app is a client of the Hono API. All business logic is in the services layer on the server. The mobile app is responsible for:

- **UI presentation:** React Native components, navigation, gestures
- **API communication:** HTTP client with auth headers, retry logic, error handling
- **Local state:** Zustand for client state, TanStack Query for server state
- **Local storage:** Expo SecureStore for tokens, AsyncStorage for non-sensitive data, SQLite (via Expo) for offline queues
- **Offline support:** Queue and sync for evidence uploads, cache for content

The mobile app does NOT:
- Implement business logic
- Make decisions about RBAC (the API enforces it)
- Store sensitive data long-term (tokens are in SecureStore; user data is fetched fresh)

#### 3.1.1 Project Structure
mobile/
├── app/ # Expo Router (file-based routing)
│ ├── (auth)/ # Auth-required routes
│ │ ├── (tabs)/ # Tab navigation
│ │ │ ├── home.tsx
│ │ │ ├── polls.tsx
│ │ │ ├── evidence.tsx
│ │ │ ├── lawyers.tsx
│ │ │ └── blog.tsx
│ │ ├── profile.tsx
│ │ ├── settings.tsx
│ │ ├── verification.tsx
│ │ ├── case/
│ │ │ ├── new.tsx
│ │ │ ├── [caseId].tsx
│ │ │ └── [caseId]/schedule.tsx
│ │ ├── consultation/
│ │ │ └── [consultationId].tsx
│ │ ├── review/
│ │ │ └── [consultationId].tsx
│ │ └── ...
│ ├── (public)/ # Public routes
│ │ ├── login.tsx
│ │ ├── register.tsx
│ │ └── ...
│ └── _layout.tsx # Root layout
├── components/ # Mobile-specific components
│ ├── ui/ # Cross-platform UI primitives
│ ├── evidence/ # Evidence upload components
│ ├── polls/ # Poll components
│ ├── consultation/ # Consultation components
│ └── ...
├── hooks/ # Mobile hooks
│ ├── useAuth.ts
│ ├── useOfflineQueue.ts
│ └── ...
├── api/ # API client
│ ├── client.ts # HTTP client with auth
│ ├── endpoints/ # Type-safe endpoint wrappers
│ └── ...
├── store/ # Zustand store
│ ├── auth.ts
│ ├── offline.ts
│ └── ...
├── offline/ # Offline support
│ ├── queue.ts # Evidence upload queue
│ ├── cache.ts # Content cache
│ └── sync.ts # Sync logic
├── utils/ # Utilities
│ ├── storage.ts # SecureStore + AsyncStorage
│ ├── network.ts # Network detection
│ └── ...
├── assets/ # Images, fonts
├── app.json # Expo configuration
└── package.json

text


### 3.2 Data Model

The mobile app does not own any persistent data on the server. The local storage is for client-side concerns only:

| Local storage | Purpose | Technology |
|---------------|---------|------------|
| Auth tokens | JWT access and refresh tokens | Expo SecureStore (encrypted) |
| User profile (cached) | Display name, role, verification status | AsyncStorage |
| Evidence upload queue | Pending evidence uploads when offline | SQLite (via Expo) |
| Content cache | Cached blog posts, legal literacy modules, lawyer profiles | SQLite (via Expo) |
| API response cache | Cached API responses for offline read | SQLite (via Expo) |
| Form drafts | In-progress forms (intake, review) | AsyncStorage |

The evidence upload queue is the only local data with server-side implications. The queue:

- Stores: file path, metadata, case association (if any), timestamp
- Syncs: when the app is online and foregrounded
- Retries: with exponential backoff
- Notifies: the user of pending items and sync status
- Clears: after successful upload

### 3.3 API Surface

The mobile app calls the same Hono API endpoints as the web app. The API client is a thin wrapper that:

- Adds auth headers (Bearer token)
- Handles token refresh
- Handles errors (network errors → offline mode; auth errors → re-login; server errors → retry)
- Returns typed responses

The mobile app does not have separate endpoints. It is a client of the same API.

### 3.4 Business Rules

1. **All business logic is on the server.** The mobile app is a presentation layer only.
2. **Auth tokens are stored in Expo SecureStore.** They are never in AsyncStorage or SQLite.
3. **The offline queue is for evidence uploads only.** Other actions (votes, comments, etc.) require connectivity.
4. **The offline queue retries with exponential backoff.** Max 5 retries; then the user is notified to retry manually.
5. **Cached content is shown when offline.** The user sees a "offline" indicator.
6. **The mobile app does not support push notifications in the pilot.** In-app notifications only.
7. **The mobile app supports the same RBAC as the web app.** A user's role and permissions are the same regardless of client.
8. **Token refresh is automatic.** The app refreshes the JWT before it expires; if refresh fails, the user is logged out.
9. **The app detects network status** and shows appropriate UI (offline banner, retry options).
10. **The app respects the platform's design system.** Components are cross-platform where possible; native-specific only where necessary.
11. **The app supports both iOS and Android.** Platform-specific code is minimal and documented.
12. **The app is signed and submitted to the App Store and Play Store.** Submission process is documented in a runbook.

### 3.5 Offline Support

#### 3.5.1 Evidence Upload Queue

When a user uploads evidence while offline:

1. The file is saved to local storage
2. The metadata is added to the upload queue
3. The user sees a "pending upload" indicator
4. When the app is online and foregrounded, the queue syncs
5. Each upload is processed in order (FIFO)
6. Successful uploads are removed from the queue; the user is notified
7. Failed uploads are retried with exponential backoff
8. After 5 failed retries, the user is notified to retry manually
9. The queue is preserved across app restarts

#### 3.5.2 Content Cache

The following content is cached for offline read:

- Published blog posts (the full content, not just metadata)
- Published legal literacy modules (the full content)
- Lawyer profiles (for users who have consulted with them)
- Past poll results (read-only)

The cache:

- Is updated when the user views the content online
- Is shown when the user views the content offline (with an "offline" indicator)
- Is cleared when the user logs out
- Has a max size (configurable; default 100 MB)

#### 3.5.3 What Is NOT Supported Offline

The following require connectivity:

- Voting (polls, confidence)
- Identity verification
- Bar verification
- Consultation delivery (video/audio)
- New content submission (comments, reviews)
- Admin actions
- Real-time features

The app shows a clear "you need to be online" message for these features when offline.

### 3.6 Mobile-Specific UX

#### 3.6.1 Navigation

The mobile app uses Expo Router (file-based routing) with a bottom tab navigator for the main sections:

- **Home:** Dashboard, recent activity
- **Polls:** Policy polls and confidence votes
- **Evidence:** Upload, view my evidence
- **Lawyers:** Directory, my cases
- **Blog:** Blog and legal literacy

Other screens are accessed via stack navigation from the tabs.

#### 3.6.2 Touch Targets

All interactive elements are ≥ 44x44px (per [UX & Design §1.2](../product/UX%20%26%20Design.md#12-design-principles)).

#### 3.6.3 Gestures

The app supports standard mobile gestures:
- Pull to refresh on lists
- Swipe to dismiss on modals
- Tap and hold for context menus
- Pinch to zoom on images (evidence)

#### 3.6.4 Camera Integration

For evidence upload, the app uses the device camera:
- Direct camera access (not gallery picker) for "capture in the moment" evidence
- Gallery picker for uploading existing photos/videos
- Document scanner (Expo's built-in) for document evidence

#### 3.6.5 Biometric Authentication (Optional)

The app supports optional biometric authentication (Face ID, Touch ID, fingerprint) for login. The user can opt in during onboarding or in settings. Biometric is a convenience, not a security requirement — the password is still the source of truth.

#### 3.6.6 Low-Bandwidth Optimizations

- **Image compression:** Evidence uploads are compressed on-device before upload (configurable quality)
- **Lazy loading:** Lists load images as they scroll into view
- **Request batching:** Multiple API calls are batched where possible
- **Reduced data mode:** A setting that disables auto-playing videos and high-resolution images

### 3.7 Edge Cases and Error Handling

| Scenario | Expected Behavior | Error Code |
|----------|-------------------|------------|
| App starts offline | The app loads from cache; the user sees an "offline" indicator | (Not an error) |
| API call fails due to no network | The app shows a "no connection" message; the user can retry | `NETWORK_ERROR` |
| API call fails due to auth (401) | The app attempts to refresh the token; if refresh fails, the user is logged out | `AUTH_EXPIRED` |
| API call fails due to server error (5xx) | The app shows an error message; the user can retry | `SERVER_ERROR` |
| Evidence upload fails | The item stays in the queue and is retried later | (Queued) |
| Evidence upload fails 5 times | The user is notified to retry manually | (Notification) |
| Token refresh fails | The user is logged out and redirected to login | `REFRESH_FAILED` |
| Camera permission denied | The app shows a message explaining why camera access is needed; offers gallery picker as alternative | `PERMISSION_DENIED` |
| Storage full | The user is notified; they must free up space or delete old evidence | `STORAGE_FULL` |
| App is backgrounded during upload | The upload continues if possible; otherwise it's paused and resumed on foreground | (Handled by OS) |
| Server returns stale data (e.g., new RBAC role) | The user is logged out and prompted to re-login to get the new role | `ROLE_CHANGED` |
| Evidence file too large for mobile | The app shows a message; the user can compress or select a different file | `FILE_TOO_LARGE` |
| Consultation fails to connect | The app shows a "connection failed" message; the user can retry | `CONSULTATION_CONNECTION_FAILED` |

---

## 4. Permissions

The mobile app's RBAC is the same as the web app's. The mobile app does not add any new roles or permissions; it consumes the existing ones.

The mobile app does have **device permissions** (distinct from RBAC):

| Device permission | Purpose | Required for |
|-------------------|---------|--------------|
| Camera | Evidence upload (capture) | Evidence upload (camera mode) |
| Photo library | Evidence upload (gallery) | Evidence upload (gallery mode) |
| Microphone | Consultation (audio) | Consultation delivery |
| Notifications | In-app notifications | Future push (not in pilot) |
| Biometric | Optional login convenience | Login (optional) |
| Network | API access | All features |

The app requests permissions contextually (when the user tries to use a feature that requires them), not all at once at startup.

---

## 5. User Experience

### 5.1 Visual Design

The mobile app uses the same design system as the web app (per [UX & Design §4](../product/UX%20%26%20Design.md#4-design-system-foundations)). Colors, typography, and components are consistent.

Mobile-specific adaptations:
- **Touch targets:** ≥ 44x44px
- **Font sizes:** Body text ≥ 16px
- **Spacing:** Generous (mobile screens are smaller)
- **Navigation:** Bottom tab bar for primary sections

### 5.2 Onboarding

The onboarding flow is similar to the web app but optimized for mobile:

- Welcome screen with the value proposition
- Registration (email, password, name)
- Email verification
- Identity verification choice (NIMC or Onfido)
- "You're verified" success screen
- Optional biometric setup
- Permission requests (contextual, not all at once)

### 5.3 Key Screens

The mobile app implements the same screens as the web app, adapted for mobile. The screen inventory from [UX & Design §3](../product/UX%20%26%20Design.md#3-screen-inventory-pilot) applies, with mobile-specific implementations.

The most mobile-specific screens are:

| Screen | Mobile-specific considerations |
|--------|--------------------------------|
| Evidence upload | Camera integration, compression, offline queue |
| Consultation | Full-screen video, PiP support, network quality indicator |
| Identity verification | Camera for document capture, Onfido SDK |
| Lawyer intake | Multi-step form, save draft, resume later |

### 5.4 Offline Experience

When offline, the app:

- Shows a persistent "offline" banner
- Disables features that require connectivity (with a clear message)
- Shows cached content (with an "offline" indicator on each item)
- Queues evidence uploads (visible in the evidence section)
- Retries queued items when back online

### 5.5 Accessibility

Same standards as the web app. Mobile-specific:

- VoiceOver (iOS) and TalkBack (Android) support
- Dynamic Type (iOS) and font scaling (Android)
- Reduce Motion support
- High contrast support
- Touch target sizing

### 5.6 The Mobile Test (Module-Specific)

Beyond the general design principles:

> **Would a mobile user on a mid-range Android over 4G be able to (1) complete the core flows (verify, vote, upload, find lawyer), (2) understand what's offline, and (3) recover from network interruptions?**

If the answer to any of these is "no" — the design is not ready. The mobile user is the majority of pilot users; their experience is the platform's experience.

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Cold start time (mid-range Android) | < 3s |
| **Performance** | Screen transition time | < 300ms |
| **Performance** | API call P95 (mobile network) | < 1s |
| **Performance** | Evidence upload (10 MB photo) | < 10s on 4G |
| **Performance** | App size | < 50 MB |
| **Security** | Tokens in SecureStore (encrypted) | Yes |
| **Security** | All API calls over TLS 1.3 | Yes |
| **Security** | Certificate pinning | Yes (for the API domain) |
| **Security** | Jailbreak / root detection | Basic (warn but don't block) |
| **Security** | Biometric is optional, not required | Yes |
| **Privacy** | NDPR compliance | Full |
| **Privacy** | No PII in local storage beyond what's needed for functionality | Yes |
| **Privacy** | Cache cleared on logout | Yes |
| **Reliability** | Crash-free sessions | ≥ 99% |
| **Reliability** | Offline queue success rate | ≥ 80% |
| **Reliability** | Token refresh success rate | ≥ 99% |
| **Observability** | Crash reporting (Sentry or similar) | Yes |
| **Observability** | Analytics (basic events) | Yes |
| **Observability** | API error tracking | Yes |

---

## 7. Dependencies

| Depends On | Type | Notes |
|------------|------|-------|
| Hono API (all modules) | Internal (server) | The mobile app is a client of the same API |
| Expo SDK 50+ | External | The React Native framework |
| TanStack Query | External | Server state management |
| Zustand | External | Client state management |
| Expo SecureStore | External | Encrypted token storage |
| Expo Router | External | File-based routing |
| Expo Camera | External | Camera integration |
| Expo Document Picker | External | Document evidence upload |
| Expo Image Picker | External | Gallery evidence upload |
| Expo AV | External | Video/audio for consultations |
| WebRTC client | External | Consultation video/audio |
| React Native Reanimated | External | Animations |
| Sentry or similar | External | Crash reporting |
| Analytics service (e.g., PostHog, Amplitude) | External | Basic analytics |

---

## 8. Acceptance Criteria

Testable checklist. Every item must be verifiable before the pilot launches.

### 8.1 App Store Submission

- [ ] iOS app is submitted to the App Store and approved
- [ ] Android app is submitted to the Play Store and approved
- [ ] App store metadata is complete (description, screenshots, keywords)
- [ ] App store privacy policy is linked
- [ ] App store terms of service are linked

### 8.2 Core Flows

- [ ] A user can install the app
- [ ] A user can register and log in
- [ ] A user can complete identity verification
- [ ] A user can vote on a policy poll
- [ ] A user can vote on a confidence question
- [ ] A user can upload evidence (with camera or gallery)
- [ ] A user can find a lawyer and schedule a consultation
- [ ] A user can join a video consultation
- [ ] A user can read blog posts and legal literacy modules
- [ ] A user can complete a legal literacy quiz
- [ ] A user can submit a review after a consultation

### 8.3 Offline Support

- [ ] Evidence uploads are queued when offline
- [ ] The queue syncs when back online
- [ ] Cached blog posts are readable when offline
- [ ] Cached legal literacy modules are readable when offline
- [ ] The offline indicator is visible
- [ ] Features that require connectivity are disabled with a clear message

### 8.4 Mobile-Specific UX

- [ ] All touch targets are ≥ 44x44px
- [ ] Pull-to-refresh works on lists
- [ ] Camera integration works for evidence upload
- [ ] Gallery picker works for evidence upload
- [ ] Biometric login is optional and works when enabled
- [ ] Reduced data mode is available in settings

### 8.5 Security

- [ ] Auth tokens are in SecureStore (encrypted)
- [ ] All API calls are over TLS 1.3
- [ ] Certificate pinning is implemented
- [ ] Cache is cleared on logout
- [ ] No PII in local storage beyond what's needed

### 8.6 Performance

- [ ] Cold start time is < 3s on mid-range Android
- [ ] App size is < 50 MB
- [ ] API calls succeed ≥ 95% of the time
- [ ] Crash-free sessions are ≥ 99%

### 8.7 Accessibility

- [ ] VoiceOver / TalkBack support is implemented
- [ ] Dynamic Type / font scaling is supported
- [ ] Reduce Motion is supported
- [ ] High contrast is supported
- [ ] All touch targets meet accessibility guidelines

### 8.8 Operational

- [ ] Crash reporting is configured
- [ ] Basic analytics are configured
- [ ] App store metadata is maintained
- [ ] Runbook exists for "app rejected by App Store / Play Store"
- [ ] Runbook exists for "critical crash in production"

---

## 9. Test Plan Summary

Reference [QA.md](../technical/QA.md) (forthcoming). This module's test focus:

### 9.1 Unit Tests

- `api/client.ts` — HTTP client, auth headers, error handling
- `offline/queue.ts` — evidence upload queue, retry logic
- `offline/cache.ts` — content cache, cache invalidation
- `store/auth.ts` — auth state, token refresh
- `utils/network.ts` — network detection, offline state

Coverage target: ≥ 85% on all modules.

### 9.2 Integration Tests

- Auth flow: register → login → token refresh → logout
- Evidence upload: online (immediate) and offline (queued, then synced)
- Consultation: join → video → end
- Content cache: view online → go offline → view from cache
- RBAC: same role as web app, same permissions

### 9.3 E2E Tests (Detox or Maestro)

- Full user journey: install → register → verify → vote → upload → find lawyer → consult → review
- Offline journey: upload while offline → reconnect → sync
- Consultation: video call with two devices
- Low-bandwidth: throttled network, verify the app degrades gracefully

### 9.4 Manual Tests (during pilot)

- Real device testing on iOS and Android (multiple models)
- Real low-bandwidth testing (throttled to 3G)
- Real offline testing (airplane mode)
- App Store review process (if applicable)
- Real user testing with pilot users

### 9.5 Security Tests (required)

- **Penetration test:** Attempt to extract tokens from local storage. Must fail.
- **Penetration test:** Attempt to bypass certificate pinning. Must fail.
- **Penetration test:** Attempt to access API without a valid token. Must fail.
- **Device testing:** Test on jailbroken / rooted devices. Behavior is documented.

### 9.6 The "Negative Test" Rule

For every "user can do X" test, there must be a matching "user cannot do X" test. For this module, the negative tests are especially important for:
- A user cannot access features when offline (if they require connectivity)
- A user cannot upload evidence that exceeds the size limit
- A user cannot bypass certificate pinning
- A user cannot access cached content after logout
- A user cannot submit a vote offline (it would be a security risk)

---

## 10. Rollout Plan

### 10.1 Feature Flags (Server-Side)

The mobile app respects the same feature flags as the web app. No mobile-specific flags in the pilot.

### 10.2 App Store Rollout

- **iOS:** TestFlight beta with pilot users → App Store review → public release
- **Android:** Internal testing track → closed beta → Play Store release

The rollout is phased:
1. **Internal testing:** Engineering team, ~1 week
2. **Closed beta:** 10–20 pilot users, ~2 weeks
3. **Public release:** All pilot users, ~4 weeks before public launch

### 10.3 Rollback Plan

- **App rejected by App Store / Play Store:** Address the rejection; resubmit. This is a process rollback, not a code rollback.
- **Critical crash in production:** Release a hotfix version. The app store review process takes 1–3 days; in the meantime, the previous version is still available.
- **Offline queue corruption:** Clear the queue; users re-upload.
- **Certificate pinning failure:** This would mean the API certificate changed. Update the pinning config; release a new version.

---

## 11. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should we use Expo's managed workflow or eject to bare React Native? | Engineering Lead | Open — recommend managed for pilot |
| 2 | What is the right offline queue max size? | Engineering Lead | Open — recommend 50 items |
| 3 | Should the app support tablet-specific layouts? | Product Lead | Open — recommend no for pilot |
| 4 | What analytics service do we use? (PostHog, Amplitude, etc.) | Engineering Lead | Open — needs decision |
| 5 | Should the app support Android tablet split-screen? | Product Lead | Open — recommend no for pilot |
| 6 | What is the right evidence compression quality? | Engineering Lead | Open — recommend 80% JPEG quality as default |
| 7 | Should the app support dark mode? | Product Lead | Open — recommend yes (system-follow) |

Resolved questions move to the [Decision Log](../business/Decision%20Log.md). Decisions that affect the app store submission or the mobile-specific UX require Design Lead and Mobile Lead sign-off.

---

## Appendix A: Glossary
- **API** — Application Programming Interface
- **E2E** — End-to-End
- **JWT** — JSON Web Token
- **MDX** — Markdown with JSX
- **NDPR** — Nigeria Data Protection Regulation
- **PII** — Personally Identifiable Information
- **RBAC** — Role-Based Access Control
- **SDK** — Software Development Kit
- **SLA** — Service Level Agreement
- **TLS** — Transport Layer Security

## Appendix B: References
- [PRD.md §6.2 — Onboarding](../product/PRD.md#62-onboarding) (mobile-first)
- [UX & Design.md §1.3 — Mobile-First, Low-Bandwidth Aware](../product/UX%20%26%20Design.md#13-mobile-first-low-bandwidth-aware)
- [PLATFORM.md §13.3 — Phase 2 Scaling](../PLATFORM.md#133-phase-2-scaling-months-712) (mobile app beta)
- [ARCHITECTURE.md §3.3 — Mobile Application — Expo](../ARCHITECTURE.md#33-mobile-application--expo)
- [ARCHITECTURE.md §3.3.3 — Offline Capabilities](../ARCHITECTURE.md#333-offline-capabilities)
- [Roadmap.md §2.1 — Pilot Feature Inventory](../product/Roadmap.md#21-pilot-feature-inventory) (P-32, P-33, P-41)
- [Every other module spec] — the mobile app implements the same features
- [Decision Log](../business/Decision%20Log.md)

## Appendix C: Module Spec Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-07-20 | Engineering Lead | Initial draft. Covers the Expo React Native app, iOS and Android, mobile-specific concerns (offline support, native features, performance), and integration with the Hono API. 12 business rules, 13 edge cases, 40+ acceptance criteria. The offline support (limited and explicit) and the API parity (no separate business logic) are the most important design decisions and reflect the platform's commitment to a unified codebase. |