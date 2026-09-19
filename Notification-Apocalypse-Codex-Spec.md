# Notification Apocalypse

## Autonomous implementation specification for Codex

This document is the complete source of truth. Implement the application end to end without asking the user product, design, architecture, copy, or implementation questions. When a minor detail is unspecified, choose the simplest polished option consistent with this specification. Prioritize a finished, playable, mobile-first game over extensibility.

## 1. Product definition

Notification Apocalypse is a short browser game about protecting focus while triaging an escalating flood of digital notifications.

The player is trying to finish one piece of deep work before the workday ends. Notifications arrive from fictional work and consumer apps. Some are harmless distractions, some are useful but non-urgent, and a small number are genuinely urgent. The player must quickly choose whether to ignore, snooze, or open each one.

The comedy comes from recognizable notification behavior, escalating interruptions, and an increasingly desperate fictional learning-app mascot called Pip. The skill comes from identifying real urgency without destroying focus through constant context switching.

This is a game, not a productivity tracker. It must not request notification permissions, connect to real services, contain runtime AI, require an account, or store personal information.

### Elevator pitch

> Finish your report while every app on Earth fights for your attention.

### Core experience

- Platform: mobile-first responsive web app, also excellent on desktop.
- Session length: 3–5 minutes for the full run.
- First meaningful interaction: within 15 seconds of opening the app.
- Learning time: under 30 seconds.
- Input: taps/clicks; keyboard shortcuts on desktop.
- Tone: witty, stressful, recognizable, playful—not preachy.
- Runtime: entirely client-side and deterministic.

## 2. Non-goals

Do not implement:

- Authentication or user accounts.
- A backend, database, API, LLM, or AI agent.
- Multiplayer.
- Real browser or OS notifications.
- Real integrations with Slack, Teams, email, calendar, Jira, or any other service.
- A level editor.
- User-generated notification text.
- A general productivity app, task list, or analytics dashboard.
- More levels until the core run is polished.
- Brand names, logos, copyrighted sound effects, or copied brand assets.

## 3. Technical decisions

Use the following stack unless an existing repository already has an equivalent compatible stack:

- Nuxt 4
- Vue 3 Composition API
- TypeScript with strict mode
- Pinia for game state
- Tailwind CSS for styling
- Vitest for unit tests
- Playwright for end-to-end tests
- Web Audio API for small synthesized sound effects; no downloaded audio files required
- localStorage only for settings and personal best

The app must work after:

```bash
npm install
npm run dev
```

Required scripts:

```json
{
  "dev": "nuxt dev",
  "build": "nuxt build",
  "preview": "nuxt preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "lint": "eslint .",
  "typecheck": "nuxt typecheck"
}
```

If starting in an empty repository, initialize the project and include all necessary config files. Do not stop after scaffolding.

## 4. Player journey

### 4.1 Landing screen

Display:

- Title: **Notification Apocalypse**
- Subtitle: **Finish your report while every app on Earth fights for your attention.**
- Large primary button: **Start workday**
- Secondary button: **How to play**
- Small personal-best summary if one exists.
- Sound toggle.

The background should look calm and orderly. Do not show a signup form or settings wall.

### 4.2 Tutorial overlay

Keep it to three compact cards:

1. **Protect focus** — Your report advances while you are not distracted.
2. **Triage fast** — Ignore noise, snooze useful items, open true emergencies.
3. **Opening has a cost** — Every context switch pauses work and makes it harder to refocus.

Actions:

- **Got it** starts the game.
- **Skip** starts the game immediately.

The tutorial must be replayable from the landing screen.

### 4.3 Game screen

The main work surface shows a fictional document titled **Q4 Project Retrospective** with text being typed automatically. It must visually communicate that productive work is happening without requiring the player to type.

Persistent HUD:

- Report progress: 0–100%
- Focus: 0–100
- Cognitive load: 0–100
- Time remaining
- Current wave label

Notifications appear as stacked cards over or beside the work surface. Each card shows:

- Fictional app icon and app name
- Sender/source where relevant
- Title
- Short body
- Age or **NOW** label
- Three actions: **Ignore**, **Snooze**, **Open**
- Severity is never directly shown to the player

Controls:

- Mobile: tap actions; swipe left = ignore; swipe down = snooze; swipe right = open.
- Desktop: click actions; keyboard `1` = ignore, `2` = snooze, `3` = open.
- `Escape` closes an opened notification detail when allowed.

Show a brief result chip after each choice, such as:

- **Good call · noise blocked**
- **Context switch · −8 focus**
- **Emergency handled · crisis avoided**
- **Important alert missed**

Never reveal the correct choice before the decision.

### 4.4 End screen

The run ends when one of these occurs:

- The report reaches 100%: success.
- Time reaches zero: failure unless the report is already complete.
- Focus reaches zero: burnout failure.
- A catastrophic urgent notification is ignored and its consequence timer expires: incident failure.

Show:

- A large grade from S to F.
- A humorous verdict.
- Final score.
- Report completion percentage.
- Correct triage rate.
- Context switches.
- False urgencies opened.
- Real emergencies missed.
- Deep-work streak: longest uninterrupted productive period.
- Best score if beaten.
- **Play again** and **Share result** buttons.

The share button uses the Web Share API when available and otherwise copies a concise text result to the clipboard. Do not render an image.

Example share text:

> I survived Notification Apocalypse with an A: 84% triage accuracy, 6 context switches, and zero missed emergencies. Can you finish the report?

## 5. Core simulation

### 5.1 Run duration and timing

- Total simulated run: 180 seconds.
- The report completes after 120 productive seconds at normal focus.
- Productive progress happens only when no notification detail is open and no reorientation penalty is active.
- A notification can remain pending while work continues, but cognitive load rises for each pending item.
- Cap visible pending notifications at 5. Additional notifications wait in an internal queue.

For development and automated tests, support a query parameter `?speed=4` that accelerates the simulation by 4×. Production defaults to 1×. Clamp accepted speed to 1–10.

### 5.2 Focus

- Starts at 100.
- Opening a notification reduces focus according to its definition, usually 5–15 points.
- Correctly ignoring noise recovers 1 focus point, capped at 100.
- Focus below 50 slows report progress to 80% speed.
- Focus below 25 slows report progress to 55% speed.
- Focus at 0 ends the run.
- Focus does not passively regenerate.

### 5.3 Cognitive load

- Starts at 0.
- Each unresolved visible notification adds load over time.
- A notification's load contribution is its `loadPerSecond` value.
- Cognitive load is capped at 100.
- At 60 load, notification cards gain subtle jitter and the work surface dims slightly.
- At 85 load, report progress slows by another 25% and ambient audio intensifies.
- Resolving a notification removes its ongoing load contribution and immediately reduces load by 2.

The player must be able to understand this relationship visually; do not make cognitive load a decorative number.

### 5.4 Context switching and reorientation

Opening a notification pauses report progress while its detail panel is open. After it is closed or resolved, apply a reorientation penalty:

- Low-complexity item: 2 seconds.
- Normal item: 4 seconds.
- High-complexity item: 7 seconds.

During reorientation, show:

> Rebuilding mental context…

with a small countdown/progress indicator. Snoozing and ignoring do not cause reorientation.

### 5.5 Snooze

- Snooze removes the notification and schedules it to return after 18–28 seconds, defined per item.
- A snoozed item can return only once.
- For useful but non-urgent items, snooze is the optimal action.
- Snoozing urgent items delays the problem and can trigger consequences.
- Snoozing pure noise is safe but less rewarding than ignoring it.

### 5.6 Consequences

Urgent notifications have an expiry window. If ignored or snoozed beyond that window, trigger a consequence event. Consequences can:

- Reduce focus.
- Add new follow-up notifications.
- Freeze report progress temporarily.
- End the run only for the single catastrophic production incident.

Consequences must be telegraphed after they occur, not before.

## 6. Notification model

Create strongly typed data in a dedicated content file. A notification should include at least:

```ts
type OptimalAction = 'ignore' | 'snooze' | 'open'
type NotificationCategory = 'noise' | 'useful' | 'urgent'
type Complexity = 'low' | 'normal' | 'high'

interface GameNotification {
  id: string
  wave: 1 | 2 | 3 | 4
  appearsAt: number
  app: string
  icon: string
  sender?: string
  title: string
  body: string
  category: NotificationCategory
  optimalAction: OptimalAction
  focusCostOnOpen: number
  loadPerSecond: number
  complexity: Complexity
  snoozeSeconds?: number
  expiresAfterSeconds?: number
  consequenceId?: string
  chainId?: string
  chainStep?: number
}
```

Keep correctness metadata outside the rendered notification component so it cannot be exposed accidentally.

## 7. Content and pacing

Implement one carefully authored run containing 32–38 notifications. Timing may include small seeded jitter, but use a fixed default seed so the run is fair and testable. Allow a new seed on replay after the first run while preserving difficulty.

### Wave 1 — Inbox drizzle, 0:00–0:35

Purpose: teach the mechanic with obvious decisions and plenty of breathing room.

Examples:

- **Mailroom** — “Your package was delivered.” Optimal: snooze.
- **Chatter** — “Maya reacted 👍 to your message.” Optimal: ignore.
- **Calendarly** — “Design sync starts in 10 minutes.” Optimal: open; resolving it confirms attendance in one tap.
- **CloudBox** — “Your weekly activity report is ready.” Optimal: ignore.
- **IssueForge** — “You were assigned BUG-214.” Optimal: snooze.

### Wave 2 — Everyone needs a quick thing, 0:35–1:15

Purpose: introduce ambiguous work notifications and chains.

Examples:

- **Chatter** — “Quick question?” Optimal: snooze. If opened, it becomes a three-message chain.
- **Mailroom** — “URGENT: updated office snack policy.” Optimal: ignore.
- **BuildShip** — “Deploy completed successfully.” Optimal: ignore.
- **Calendarly** — “Meeting moved to right now.” Optimal: open.
- **LinkUp** — “A recruiter viewed your profile.” Optimal: ignore.
- **FoodDash** — “Your lunch is 3 stops away.” Optimal: snooze.
- **IssueForge** — “BUG-214 priority changed to high.” Optimal: open.

### Wave 3 — Mascot escalation, 1:15–2:05

Purpose: deliver the signature comedy beat and increase pressure.

Use **LinguaLynx**, a fictional language-learning app, and its neon-green lynx mascot **Pip**. Do not use a real company's name, logo, typography, exact copy, or mascot design.

The chain escalates only if ignored:

1. **Pip misses you. Your two-day streak is waiting.**
2. **Your streak is looking nervous.**
3. **Pip has started pacing.**
4. **Pip knows you saw this.**
5. **The subjunctive waits for no one.**
6. **Pip is outside the metaphorical window.**

All are optimal to ignore. Each ignored step scores positively, but the next arrives faster and looks more melodramatic. After the sixth is ignored, award the achievement **Emotionally Unavailable**.

Other Wave 3 examples:

- **SecureGate** — “New login from an unknown device.” Optimal: open; urgent.
- **PhotoLoop** — “You have memories from 7 years ago.” Optimal: ignore.
- **System** — “Restart to finish installing updates.” Optimal: snooze.
- **Mailroom** — “RE: RE: RE: tiny wording change.” Optimal: ignore.
- **Chatter** — “@channel does anyone have a phone charger?” Optimal: ignore.

### Wave 4 — Incident storm, 2:05–3:00

Purpose: final exam. High density, mixed signals, one true catastrophe.

Examples:

- **StatusPulse** — “Checkout error rate is above 18%.” Optimal: open; urgent; begins the production-incident chain.
- **BuildShip** — “Production rollback requires approval.” Optimal: open; urgent. Ignoring past expiry ends the run.
- **Mailroom** — “URGENT URGENT: team offsite T-shirt sizes.” Optimal: ignore.
- **Chatter** — “CEO joined #random.” Optimal: ignore.
- **SecureGate** — “MFA request expires in 30 seconds.” Optimal: open.
- **Calendarly** — “Optional wellbeing webinar starting now.” Optimal: ignore.
- **FoodDash** — “Rate yesterday's delivery.” Optimal: ignore.
- **System** — “Battery at 5%.” Optimal: open; resolving activates low-power mode and prevents a later shutdown penalty.
- **IssueForge** — “Customer data export stuck.” Optimal: open.
- **CloudBox** — “Storage is 95% full.” Optimal: snooze.

The incident chain must be understandable without developer knowledge: error spike → rollback approval → service restored. Opening the first alert reveals two simple actions, **Investigate** and **Dismiss**. Investigate is correct and adds the rollback approval notification shortly after. Approving rollback resolves the incident and grants a large score bonus.

## 8. Opened-notification interactions

Opening should not always instantly resolve an item. Use lightweight detail interactions so opening an urgent item feels meaningful:

- Security login: **That was me** / **Secure account**. Correct: secure account.
- Calendar change: **Join** / **Decline**. Either resolves it; join is optimal.
- Bug priority: **Acknowledge**.
- Delivery: **View map** / **Close**. This is intentionally a small trap and consumes time.
- Production alert: **Investigate** / **Dismiss**.
- Rollback approval: **Approve rollback** / **Wait**.
- MFA request: **Approve** / **Deny**; a short context clue indicates it belongs to the player.
- Battery warning: **Low-power mode** / **Ignore**.

Keep every interaction to one additional decision after opening. Never require typing.

## 9. Scoring and grades

Start at 1,000 points.

Apply:

- Optimal action: +100.
- Acceptable but not optimal action: +35.
- Wrong action: −80.
- Correct urgent resolution: +180.
- Missed urgent notification: −250.
- Catastrophic incident prevented: +400.
- Each context switch: −20.
- Finish report: +500.
- Remaining focus at success: `focus × 5`.
- Each full second remaining after report completion: +10.
- Emotionally Unavailable achievement: +150.

Never allow the displayed score below 0.

Triage accuracy counts the initial Ignore/Snooze/Open classification, not the secondary action inside a detail panel.

Grade thresholds:

- S: 3,900+
- A: 3,300–3,899
- B: 2,700–3,299
- C: 2,100–2,699
- D: 1,400–2,099
- F: below 1,400 or catastrophic failure

Verdict examples:

- S: **Unbothered. Focused. Frighteningly efficient.**
- A: **You controlled the notifications. Mostly.**
- B: **Productive, with several unnecessary side quests.**
- C: **The report survived. Your attention did not.**
- D: **You attended every fire drill, including the fake ones.**
- F: **The notifications have unionized and taken control.**

Balance the authored run so a strong first-time player can earn B or A, S requires near-perfect play, and randomly opening everything produces D or F.

## 10. Visual direction

The game should feel like a polished operating-system/work-app satire, not a generic dashboard.

### Calm state

- Deep navy background with a warm off-white document surface.
- Accent color: electric cyan.
- Spacious layout and slow ambient movement.
- Report text types smoothly.
- HUD is compact and stable.

### Escalated state

- Notifications stack with depth and slight rotation.
- Amber appears above 50 cognitive load; coral/red above 80.
- Subtle screen vignette, grain, and jitter increase with load.
- Pip's notifications become progressively larger and more theatrical without obscuring essential controls.
- At most one major animation runs at once.

### Constraints

- Use system fonts or bundled open-source fonts only.
- All text must remain legible at 320 px viewport width.
- No horizontal scrolling.
- Touch targets at least 44×44 px.
- Respect `prefers-reduced-motion`; replace shakes/jitter with color and border changes.
- Never rely on color alone to communicate state.
- Do not use emoji as the only icon system. Simple inline SVG icons are acceptable.

## 11. Audio

Audio is optional and off by default until the player enables it or starts the game after interacting.

Create short synthesized cues:

- Soft notification ping.
- Sharper urgent alert.
- Muted ignore sound.
- Context-switch whoosh.
- Success chord.
- Failure tone.

Do not play overlapping pings for a burst. Debounce burst audio and vary pitch slightly. Provide a persistent mute control. The game must remain fully understandable without sound.

## 12. State architecture

Implement a clear finite-state flow:

```text
landing → tutorial → playing → paused → result
                         ↘ failure → result
```

Centralize all game mutations in the Pinia store or a dedicated engine composable. UI components must not independently alter score, timing, or notification correctness.

Suggested structure:

```text
app/
  components/
    game/
      GameHud.vue
      WorkDocument.vue
      NotificationStack.vue
      NotificationCard.vue
      NotificationDetail.vue
      ReorientationOverlay.vue
      ResultSummary.vue
    ui/
  composables/
    useGameEngine.ts
    useGameAudio.ts
    useShareResult.ts
  data/
    notifications.ts
    consequences.ts
  pages/
    index.vue
  stores/
    game.ts
  types/
    game.ts
tests/
  unit/
  e2e/
```

Use `performance.now()` and elapsed-time calculations rather than assuming every interval fires exactly on time. Pausing, background tabs, and timer throttling must not corrupt state. If the tab becomes hidden, automatically pause and show a **Resume workday** overlay on return. Do not let the player exploit backgrounding to advance work without notifications.

## 13. Persistence

Store only:

- Best score.
- Best grade.
- Number of completed runs.
- Whether tutorial has been seen.
- Sound preference.
- Reduced-effects preference if the user explicitly sets it.

Namespace the localStorage key and version the schema. Recover gracefully from invalid stored JSON.

## 14. Accessibility

- Semantic buttons and headings.
- Visible keyboard focus states.
- Full keyboard playability.
- `aria-live="polite"` for new ordinary notifications and `assertive` only for urgent incident alerts.
- Do not move keyboard focus whenever a notification appears.
- When opening a detail dialog, trap focus; restore it on close.
- Provide text labels for all icons.
- Maintain WCAG AA contrast.
- Include a reduced-effects toggle in pause/settings.
- Automated checks must have no obvious critical accessibility violations.

## 15. Responsive behavior

### Mobile

- HUD across the top in a compact 2×2 or scroll-free grid.
- Work document fills most of the screen.
- Notification stack appears in the lower half, reachable by thumb.
- Action buttons remain visible without requiring hover.
- Detail interactions use a bottom sheet.

### Desktop

- Work document occupies roughly 60–65% width.
- Notifications stack in a right-side attention rail.
- HUD spans the top.
- Detail interactions may appear as a modal or side panel.

## 16. Tests

### Unit tests

At minimum, test:

- Score calculation for optimal, acceptable, and wrong actions.
- Focus thresholds and report-progress multipliers.
- Cognitive-load accumulation and cap.
- Snooze returning exactly once.
- Expired urgent notification triggering its consequence.
- Reorientation duration by complexity.
- Run success, timeout failure, focus failure, and catastrophic failure.
- Grade thresholds.
- Seeded scheduling is deterministic.
- Invalid localStorage data falls back safely.

### End-to-end tests

At minimum, test:

1. Landing → tutorial → start → notification decision → result using accelerated mode.
2. Keyboard controls work.
3. Opening and resolving the production incident allows the run to continue.
4. Ignoring the rollback approval triggers failure.
5. Reloading preserves best score and preferences.
6. Mobile viewport has usable action buttons and no horizontal overflow.
7. Share fallback copies result text.

Mock time where practical. Avoid flaky tests based on real three-minute waits.

## 17. Quality gates

Before declaring completion, Codex must run and fix failures from:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Also manually inspect at:

- 320×568
- 390×844
- 768×1024
- 1440×900

Verify:

- A complete run is possible.
- All three actions have meaningful consequences.
- The production incident chain works.
- Pip's six-step chain works and is funny without blocking play.
- Audio can be muted.
- Reduced motion works.
- Backgrounding pauses correctly.
- The result screen stats match the run.
- There are no placeholder strings, dead buttons, console errors, or obviously broken layouts.

## 18. Implementation order

Codex should execute in this order and continue autonomously through all stages:

1. Initialize project, tooling, layout, and types.
2. Implement deterministic game engine and unit tests.
3. Add notification content, chains, consequences, scoring, and grades.
4. Build the complete playable UI.
5. Add responsive gestures and keyboard controls.
6. Add visual escalation, audio, accessibility, and reduced motion.
7. Add result sharing and local persistence.
8. Add Playwright coverage.
9. Run all quality gates and fix issues.
10. Write a concise README with setup, commands, architecture notes, and gameplay controls.

Do not build stretch features until all core acceptance criteria pass.

## 19. Acceptance criteria

The implementation is complete only when all of the following are true:

- A new visitor can start playing in no more than two taps.
- The core loop is understandable without reading external documentation.
- The run lasts approximately 3 minutes at normal speed.
- At least 32 authored notifications appear across four escalating waves.
- Ignore, snooze, and open are all strategically necessary.
- Opening notifications creates a visible and mechanical context-switch cost.
- At least four urgent notifications have timed consequences.
- The production-incident chain can end the run if mishandled.
- The six-step LinguaLynx/Pip chain appears when repeatedly ignored.
- The game includes success, timeout, burnout, and incident-failure endings.
- Result statistics and grade are accurate.
- The game is fully playable at 320 px width and via keyboard.
- It works without a network connection after the app has loaded.
- No backend, authentication, AI API, or real notification permission is used.
- Lint, typecheck, unit tests, production build, and E2E tests pass.

## 20. Stretch features

Only implement these if the core game is finished, tested, and polished:

1. Daily seeded challenge with the same notification order for everyone that day.
2. A compact post-game timeline showing each decision and its impact.
3. Two additional achievements: **Inbox Zero Hero** and **Everything Is Urgent**.
4. Installable PWA support.
5. A subtle fake desktop theme on wide screens.

Do not implement online leaderboards, accounts, a backend, AI-generated content, or additional levels during the hackathon build.

## 21. Final instruction to Codex

Build the complete game described above. Make sensible decisions independently. Do not ask the user to choose libraries, colors, architecture, copy, or scope. If a dependency creates friction, replace it with a simpler equivalent while preserving behavior. Treat visual polish, game feel, accessibility, and a reliable full run as first-class requirements. Stop only after the quality gates pass and the repository contains a production-ready playable build plus README.
