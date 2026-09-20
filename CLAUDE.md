@AGENTS.md

# ManifestDaily — working rules

Instructions to myself for future sessions on this repo.

## Platform safety — the most important rule in this repo

ManifestDaily ships on BOTH iOS and Android from one codebase. iOS is LIVE on the
App Store with paying subscribers. Android is mid-launch on Google Play (closed
testing done, production access not yet applied for).

**A change made for one platform must never alter behaviour on the other.** This has
already caused one production incident and is the single biggest risk in this
codebase.

Before any change, ask: can this affect the other platform? If yes, either scope it
to a platform branch or stop and ask.

### Shared files where platform leakage happens

These contain logic used by BOTH platforms. Treat every edit here as high-risk, and
say explicitly in the summary what the impact on the other platform is:

- `lib/featureAccess.ts` — `hasAccess()` branches on `Platform.OS`; the
  `ANDROID_FREE_FEATURES` set applies only to Android but lives in shared code.
- `app/_layout.tsx` — `NavigationGuard` is iOS-only (`needsPaywall` checks
  `Platform.OS === 'ios'`); `PaywallRedirect` handles Android.
- `store/useAppStore.ts` — persisted state is shared. NEVER change `partialize`, the
  store `version`, or the `migrate` function for a platform-specific reason. A
  migration runs on both platforms.
- `src/lib/revenueCat.ts` — entitlement logic is shared; only the API key selection
  is platform-specific.

### Safe to change without cross-platform risk

- `app.json` under the `"android"` key (permissions, blockedPermissions,
  adaptiveIcon, package).
- `app.json` under the `"ios"` key (bundleIdentifier, infoPlist).
- Anything inside an explicit `Platform.OS === 'android'` / `'ios'` branch.

## RevenueCat facts (verified — do not re-derive)

- Entitlement identifier: `pro`. Display name is "ManifestDaily Pro" — that is a
  DISPLAY NAME, never an identifier. Do not change `ENTITLEMENT_ID`.
- Offering identifier: `default2`. Same display-name caveat.
- As of Sep 2026 the offering and entitlement have App Store products attached only.
  No Google Play products yet. This is why the Android paywall shows hardcoded
  fallback prices.

## Known blocked work — do not "fix" these

- `ANDROID_FREE_FEATURES` is deliberately widened so all features are free on
  Android. Do NOT revert it. Reverting re-gates features behind a paywall that cannot
  complete a purchase, because Play Console products do not exist yet. This revert
  happens only after Play products are live.
- The paywall's hardcoded price fallbacks ($2.99 etc.) stay until Play products load.

## Release process gotchas

- `eas build` does NOT submit to TestFlight. `eas.json` has an empty
  `submit.production` and no `autoSubmit`. Use `--auto-submit`, or run
  `eas submit --platform ios --latest` separately.
- `autoIncrement` in `eas.json` bumps the BUILD NUMBER only, not the marketing
  version. `appVersionSource: "remote"` also manages build numbers only.
- The marketing version in `app.json` must be bumped MANUALLY for every App Store
  release. Reusing a released version fails with Apple error 90186 (invalid
  pre-release train). This already happened with 1.1.2 build 19.
- Keep `app.json` version and `package.json` version in sync.

## Current platform focus

Android launch. iOS is effectively frozen — only ship iOS changes that are deliberate
and discussed, not as a side effect of Android work.
