# ManifestDaily - App Status Report

**Project Type:** React Native Expo App (Cross-platform)
**Expo SDK:** 54
**Status:** Early-stage, functional MVP with premium UI in place but not wired to payments
**Last Updated:** 2026-06-13

---

## OVERVIEW

ManifestDaily is a mindfulness & manifestation mobile app built with Expo Router. It covers daily affirmations, focused work sessions, progress tracking, a breathing exercise, and a "vault" time-capsule feature for messages to your future self.

---

## CORE INFRASTRUCTURE

- **Navigation** - Expo Router with tab navigation (`(tabs)`) and modal screens (session, breathing, settings, affirmation-detail, saved-affirmations)
- **State Management** - Zustand store (`store/useAppStore.ts`) with AsyncStorage persistence
- **Theme System** - Single "Cream" theme with light + dark variants (`constants/theme.ts`). No other color palettes exist.
- **Fonts** - DM Sans (light/regular/medium) & DM Serif Display, loaded via `@expo-google-fonts`
- **Styling** - Plain React Native `StyleSheet`; NativeWind/Tailwind have been removed (were installed but unused)

---

## ONBOARDING (13 STEPS)

`app/(onboarding)/`: welcome, name, dob, goals, affirmation, belief, science, plan, social, reminder, notification, paywall, allset.

- Paywall screen has full UI (Annual/Monthly/Lifetime plans) but purchases are **not wired up** — there's a `TODO(revenuecat)` comment where `Purchases.purchasePackage(...)` needs to be called. No entitlement checks exist anywhere in the app.

---

## HOME TAB (`(tabs)/index.tsx`)

- Time-aware greeting and date display
- Animated mascot
- Current affirmation card with next/previous navigation and save-to-favorites
- Saved affirmations modal (`saved-affirmations.tsx`)
- Dark/light mode toggle
- Streak badge
- Quick links to Focus session, Breathing exercise, and Vault

---

## FOCUS TAB / SESSION (`session.tsx`)

- Duration selection (15/25/45 min)
- Ambient sound selection: Rain, Ocean, Forest, Silent — audio files present in `assets/sounds/` (rain.mp3, ocean.mp3, forest.mp3) and played via `useAudio` hook
- Animated timer ring, countdown display, play/pause
- Completion screen with haptic feedback
- Sessions logged to the store; recent sessions list on the Focus tab

---

## PROGRESS TAB

- Activity heatmap (18 weeks)
- Stats: current streak, best streak, total sessions, total focus hours
- Text-based insights generated from session history

---

## VAULT TAB (Time Capsule)

- Create sealed messages to your future self, with unlock dates (1/3/6/12 months or custom)
- Vault states: locked, soon, ready, opened
- Sealing/unlocking animations, custom SVG lock and envelope art
- Word-by-word message reveal on unlock; vaults can be reopened/reread
- FAB for creating a new vault; empty state for no vaults

---

## BREATHING EXERCISE (`breathing.tsx`)

- Looping breathing animation with configurable inhale/hold/exhale timing
- Duration setting (1-30 min), start/complete flow

---

## SETTINGS (`settings.tsx`)

- Built as a modal screen (registered in `app/_layout.tsx`) with:
  - Dark mode toggle
  - Daily reminder toggle (wires into `useNotifications`)
  - Goal picker (change focus goal)
- **No entry point in the UI** — nothing currently navigates to `/settings`. A button (e.g. on the Home tab) needs to be added to open it.

---

## NOTIFICATIONS

- `expo-notifications` integration via `useNotifications` hook
- Daily reminder scheduling (morning/afternoon/evening), Android notification channel setup
- Permission request flow; can cancel all scheduled notifications

---

## DATA

- `constants/data.ts` - goals (Career, Finance, Confidence, Health, Love, Growth) with affirmation pools, sound metadata
- `constants/theme.ts` - Cream light/dark palette only
- `constants/tokens.ts` - spacing, radius, font sizes, shadows

---

## KNOWN GAPS

- **Payments** - Paywall UI exists but RevenueCat (or any processor) is not integrated; no premium gating anywhere
- **Settings entry point** - screen is fully built but unreachable from the UI
- **Custom affirmations** - users can save existing affirmations but cannot create/edit/delete their own
- **No tests** - no unit or e2e test files in the repo
- **Single theme** - only Cream (light/dark) is implemented; no theme picker UI exists despite `THEME_PREVIEWS` being structured for multiple themes

---

## PROJECT STRUCTURE

```
ManifestDaily/
├── app/
│   ├── (onboarding)/        # 13-step onboarding flow
│   ├── (tabs)/               # home, focus, progress, vault
│   ├── _layout.tsx           # Root layout & navigation guard
│   ├── session.tsx
│   ├── breathing.tsx
│   ├── settings.tsx
│   ├── saved-affirmations.tsx
│   └── affirmation-detail.tsx
├── components/
│   ├── ui/                   # AffirmationCard, ActivityCalendar, TimerRing,
│   │                          # BreathingAnimation, Mascot, Icon, etc.
│   └── shared/                # Button, Card, TabBar, ScreenTransition
├── hooks/                     # useTheme, useNotifications, useAudio
├── store/useAppStore.ts       # Zustand store
├── constants/                 # data.ts, theme.ts, tokens.ts
├── assets/                     # images, icons, sounds
├── package.json
└── tsconfig.json
```

---

## NEXT STEPS

1. Add a Settings entry point (e.g., gear icon on Home)
2. Integrate RevenueCat for the paywall and add entitlement gating
3. Decide whether to expand beyond the Cream theme or remove the unused multi-theme scaffolding in `THEME_PREVIEWS`
4. Add basic test coverage
