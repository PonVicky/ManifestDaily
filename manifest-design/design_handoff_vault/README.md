# Handoff: Midnight Clarity & Morning Sky Themes

## Overview
This handoff documents two new color themes added to ManifestDaily — a daily affirmation and focus app. Both themes slot into the existing theme system alongside the two original themes (Cream Serenity and Forest).

- **Midnight Clarity** — ink-black backgrounds with warm gold accents. Premium, focused, zero pastels. Inspired by Notion dark × luxury watch brand × night sky.
- **Morning Sky** — crisp white backgrounds with saturated sky-blue accents. Fresh, energized, open.

## About the Design Files
The files in this bundle are **design references created in HTML** — high-fidelity prototypes showing the intended look. The task is to **recreate these designs in your target codebase** using its established patterns and libraries (React Native, Swift, etc.) — not to ship the HTML directly.

## Fidelity
**High-fidelity.** Exact hex values, token names, and component-level specs are all defined below. Implement pixel-precisely.

---

## Theme Architecture

The existing app uses a simple CSS-variable / class-toggle theme system with two axes:
1. **Theme palette** — `cream` | `forest` | `midnight` | `sky`
2. **Dark mode toggle** — independent boolean, works with every theme

Each theme provides both a light and dark variant. In practice:
- **Midnight Clarity** looks best with dark mode ON (that's its hero state)
- **Morning Sky** looks best with dark mode OFF (that's its hero state)

The theme key to add to your constants: `'midnight'` and `'sky'`.

---

## Design Tokens — Midnight Clarity

### Light variant (theme = midnight, dark = false)
| Token | Value |
|---|---|
| Background Primary (`--md-bg`) | `#FDFAF4` |
| Background Secondary (`--md-bg2`) | `#F6F1E8` |
| Card | `#FFFFFF` |
| Accent (`--md-accent`) | `#C9A84C` |
| Accent Tint | `rgba(201,168,76,0.14)` |
| Accent Soft (`--md-gold-soft`) | `#F0E5CC` |
| On Accent | `#1C1710` |
| Text Primary | `#1C1710` |
| Text Secondary | `#6B5C48` |
| Border | `rgba(201,168,76,0.22)` |
| Shadow | `0 1px 2px rgba(28,23,16,.05), 0 8px 24px rgba(28,23,16,.10)` |
| Shadow Large | `0 2px 6px rgba(28,23,16,.07), 0 20px 50px rgba(28,23,16,.14)` |
| Canvas / Page BG | `#EDE8DE` |

### Dark variant (theme = midnight, dark = true) — primary state
| Token | Value |
|---|---|
| Background Primary (`--md-bg`) | `#0D1117` |
| Background Secondary (`--md-bg2`) | `#161B22` |
| Background Tertiary | `#0A0E14` |
| Card | `#1E2530` |
| Card Elevated | `#252D3A` |
| Accent (`--md-accent`) | `#E8C97A` |
| Accent Tint | `rgba(232,201,122,0.12)` |
| Accent Deep | `#C9A84C` |
| Accent Subtle | `rgba(232,201,122,0.12)` |
| Accent Border | `rgba(232,201,122,0.20)` |
| On Accent | `#0D1117` |
| Text Primary | `#F0EBE0` |
| Text Secondary | `#A09890` |
| Text Muted | `#8B8680` |
| Text Disabled | `#4A4540` |
| Border Default | `rgba(255,255,255,0.06)` |
| Border Subtle | `rgba(255,255,255,0.04)` |
| Border Emphasis | `rgba(232,201,122,0.25)` |
| Success | `#4CAF7D` |
| Error | `#E87A7A` |
| Shadow | `0 1px 2px rgba(0,0,0,.40), 0 10px 28px rgba(0,0,0,.45)` |
| Shadow Large | `0 2px 6px rgba(0,0,0,.45), 0 24px 60px rgba(0,0,0,.60)` |
| Canvas / Page BG | `#0A0E14` |

---

## Design Tokens — Morning Sky

### Light variant (theme = sky, dark = false) — primary state
| Token | Value |
|---|---|
| Background Primary (`--md-bg`) | `#F5F9FF` |
| Background Secondary (`--md-bg2`) | `#EEF5FC` |
| Background Tertiary | `#F0F7FF` |
| Card | `#FFFFFF` |
| Card Elevated | `#FAFCFF` |
| Accent (`--md-accent`) | `#4A90D9` |
| Accent Tint | `rgba(74,144,217,0.12)` |
| Accent Deep | `#2E6A96` |
| Accent Subtle | `#E8F3FD` |
| Accent Border | `#B8D8F0` |
| On Accent | `#FFFFFF` |
| Text Primary | `#1E3A52` |
| Text Secondary | `#4A7A9B` |
| Text Muted | `#6A9AB8` |
| Text Disabled | `#A8C8E0` |
| Border Default | `#D6E8F7` |
| Border Subtle | `#E8F3FD` |
| Border Emphasis | `#4A90D9` |
| Success | `#3AAD7A` |
| Error | `#E05A5A` |
| Shadow | `0 1px 2px rgba(30,58,82,.04), 0 8px 24px rgba(30,58,82,.08)` |
| Shadow Large | `0 2px 6px rgba(30,58,82,.06), 0 20px 50px rgba(30,58,82,.12)` |
| Canvas / Page BG | `#DDEEF8` |

### Dark variant (theme = sky, dark = true)
| Token | Value |
|---|---|
| Background Primary (`--md-bg`) | `#0D1826` |
| Background Secondary (`--md-bg2`) | `#131F30` |
| Card | `#1A2A3C` |
| Accent (`--md-accent`) | `#5BAEE6` |
| Accent Tint | `rgba(91,174,230,0.15)` |
| Accent Soft | `#1E3350` |
| On Accent | `#FFFFFF` |
| Text Primary | `#E8F4FF` |
| Text Secondary | `#7AADC8` |
| Border | `rgba(74,144,217,0.15)` |
| Shadow | `0 1px 2px rgba(0,0,0,.35), 0 10px 28px rgba(0,0,0,.40)` |
| Shadow Large | `0 2px 6px rgba(0,0,0,.40), 0 24px 60px rgba(0,0,0,.55)` |
| Canvas / Page BG | `#080F1C` |

---

## Component-Level Specs

### Affirmation Card
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Background | `#1E2530` | `#FFFFFF` |
| Border | `0.5px solid rgba(255,255,255,0.06)` | `0.5px solid #D6E8F7` |
| Affirmation text | `#F0EBE0` | `#1E3A52` |
| Category tag | `#E8C97A` | `#4A90D9` |

### Streak Badge
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Background | `rgba(232,201,122,0.08)` | `#E8F3FD` |
| Border | `0.5px solid rgba(232,201,122,0.18)` | `0.5px solid #B8D8F0` |
| Text + icon | `#E8C97A` | `#2E6A96` |

### Focus Timer Ring
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Track | `rgba(255,255,255,0.05)` | `#D6E8F7` |
| Progress fill | `#E8C97A` | `#4A90D9` |
| Time display | `#E8C97A` | `#1E3A52` |

### Breathing Orb
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Outer ring pulse | `rgba(232,201,122,0.15)` | `#E8F3FD` |
| Orb fill | `#C9A84C` | `#4A90D9` |
| Phase text | `#F0EBE0` | `#1E3A52` |

### Activity Calendar
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Completed day | `#E8C97A` | `#4A90D9` |
| Partial day | `rgba(232,201,122,0.40)` | `rgba(74,144,217,0.40)` |
| Empty day | `rgba(255,255,255,0.06)` | `#EEF5FC` |
| Today ring | `1px solid #C9A84C` | `1px solid #2E6A96` |

### Primary Button
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Background | `#E8C97A` | `#4A90D9` |
| Text | `#0D1117` | `#FFFFFF` |

### Paywall "Most Popular" Badge
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Background | `#E8C97A` | `#4A90D9` |
| Text | `#0D1117` | `#FFFFFF` |

### Onboarding — Selected Goal Card
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Background | `rgba(232,201,122,0.10)` | `#E8F3FD` |
| Border | `1px solid rgba(232,201,122,0.35)` | `1px solid #4A90D9` |
| Text | `#F0EBE0` | `#1E3A52` |

### Onboarding — Unselected Goal Card
| | Midnight Dark | Morning Sky Light |
|---|---|---|
| Background | `rgba(255,255,255,0.03)` | `#FFFFFF` |
| Border | `0.5px solid rgba(255,255,255,0.08)` | `0.5px solid #D6E8F7` |
| Text | `rgba(255,255,255,0.55)` | `#4A7A9B` |

### Onboarding — Progress Dots
| State | Midnight Dark | Morning Sky Light |
|---|---|---|
| Active | `#E8C97A`, width 28px | `#2E6A96`, width 28px |
| Done | `#C9A84C`, width 18px | `#4A90D9`, width 18px |
| Todo | `rgba(255,255,255,0.15)`, width 14px | `#B8D8F0`, width 14px |

---

## Typography
Fonts are **unchanged** for both themes. Only text colors change to the tokens above.
- **DM Serif Display italic** — affirmation text
- **DM Sans 300 / 400 / 500** — all UI text

---

## Where to Add in Your Codebase

The spec documents point to these locations (adapt to your actual file structure):

1. **`constants/tokens.ts`** — add `MIDNIGHT_CLARITY` and `MORNING_SKY` token objects using the values in the tables above.
2. **`constants/theme.ts`** — add `'midnight'` and `'sky'` as valid theme keys to the union type / enum.
3. **`hooks/useTheme.ts`** — map the new keys to their token objects (same pattern as the existing `cream` and `forest` entries).
4. **Theme switcher UI** — add two new options to the existing picker. No new navigation or screens needed.
5. **Do not touch any screen files** — all color values should resolve through the token system.

---

## Interactions & Behavior
- Switching themes is instant (no transition required, though a 200–400ms cross-fade on background/color is a nice touch)
- Dark mode toggle is independent of theme — all four themes support both light and dark
- Selected theme + dark mode state should persist across app restarts (localStorage / UserDefaults / AsyncStorage)
- No new haptics, animations, or timings

---

## Files in This Bundle
| File | Purpose |
|---|---|
| `README.md` | This document |
| `md-tokens.jsx` | Full token system including both new themes — use as color reference |
| `md-app.jsx` | Theme switcher component — shows how the four themes are wired to the picker UI |
