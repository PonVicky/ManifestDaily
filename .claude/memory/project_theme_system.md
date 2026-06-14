---
name: project-theme-system
description: ManifestDaily theme architecture — Cream-only (light+dark), useTheme hook, opaque sel/cardSolid tokens, illustrated bg
metadata:
  type: project
---

The app ships **Cream Serenity only** (light + dark variants). The Forest, Midnight, and Sky themes were removed.

**Why:** Design changelog (post-handoff) reduced the palette to Cream only and added a full-bleed illustrated background on the 4 main tab screens, which forced opaque active-state surfaces.

**Architecture:**
- `constants/theme.ts` — `ThemeKey = 'cream'`, `ThemeColors`, `getTheme(themeKey, dark)`, `THEME_PREVIEWS` (cream only)
- `hooks/useTheme.ts` — hook returning `{ theme, darkMode, themeKey }`
- `store/useAppStore.ts` — `themeKey` always `'cream'` (migrate forces it); `setThemeKey` is effectively a no-op; `darkMode` + `toggleDarkMode` persisted
- `app/settings.tsx` — Appearance modal with **dark-mode switch only** (no theme picker)

**Opaque-surface tokens (added for the illustrated bg):**
- `theme.sel` — opaque selected/active surface (`#F5E7D6` light / `#372D24` dark). Use instead of translucent `accentTint` on any button/chip/card/banner that sits over the [[project-illustrated-background]].
- `theme.cardSolid` — always-opaque card (same value as `card`).
- `accentTint` is now reserved for **decorative glows/halos/shadows and small icon tiles only**.

**Illustrated background:** `components/ui/ThemedBackground.tsx` wraps Home/Focus/Vault/Progress (light/dark webp crossfade). Onboarding, Paywall, and overlays (session/breathing/vault modals) keep plain solid `bg`.

**How to apply:** All components call `useTheme()`. `ThemeColors.gold` = accent. Selected controls signal via gold border + opaque `sel` fill; the Home affirmation card and Vault "ready" card use a `LinearGradient(168°, sel → card@55%)` over an opaque base.

**Entry point:** Home header settings icon → `router.push('/settings')`.
