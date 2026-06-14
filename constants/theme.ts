export type ThemeKey = 'cream';

export type ThemeColors = {
  bg: string;
  bg2: string;
  card: string;
  gold: string;
  goldSoft: string;
  accentTint: string;
  sel: string;
  cardSolid: string;
  text: string;
  text2: string;
  border: string;
  onAccent: string;
  tabBg: string;
  flame: string;
  flameFill: string;
  orange: string;
  white: string;
};

// ── Cream Serenity ──────────────────────────────────────────────────
// The app ships Cream only, with light + dark variants.
//
// `sel`       — opaque selected / active surface. Used instead of the
//               translucent `accentTint` on any control that sits over the
//               illustrated background, so the artwork can't bleed through.
// `cardSolid` — always-opaque card fill (same value as `card`); documents
//               the intent for surfaces that must never be translucent.
// `accentTint` is now reserved for decorative glows / halos / shadows only.
const CREAM_LIGHT: ThemeColors = {
  bg: '#FBF3E7', bg2: '#F4EADB', card: '#FFFDF9',
  gold: '#D6A87A', goldSoft: '#EAD3B4', accentTint: 'rgba(214,168,122,0.16)',
  sel: '#F5E7D6', cardSolid: '#FFFDF9',
  text: '#3A3028', text2: '#7A6B5D', border: '#ECDFCE', onAccent: '#3A3028',
  tabBg: 'rgba(251,243,231,0.92)',
  flame: '#F2A65A', flameFill: '#F2A65A', orange: '#E08A3C', white: '#FFFFFF',
};

const CREAM_DARK: ThemeColors = {
  bg: '#171210', bg2: '#211913', card: '#29201A',
  gold: '#E0BB8C', goldSoft: '#5A4A36', accentTint: 'rgba(224,187,140,0.16)',
  sel: '#372D24', cardSolid: '#29201A',
  text: '#F5EDE0', text2: '#9A8B7D', border: '#382C22', onAccent: '#3A3028',
  tabBg: 'rgba(23,18,16,0.92)',
  flame: '#F2A65A', flameFill: '#F2A65A', orange: '#E08A3C', white: '#FFFFFF',
};

const THEME_MAP: Record<ThemeKey, [ThemeColors, ThemeColors]> = {
  cream: [CREAM_LIGHT, CREAM_DARK],
};

export function getTheme(themeKey: ThemeKey, dark: boolean): ThemeColors {
  const [light, darkPalette] = THEME_MAP[themeKey];
  return dark ? darkPalette : light;
}

// Light-mode previews for the theme picker (always show light variants)
export const THEME_PREVIEWS: Record<ThemeKey, { bg: string; accent: string; text: string; name: string; subtitle: string }> = {
  cream: { bg: '#FBF3E7', accent: '#D6A87A', text: '#3A3028', name: 'Cream', subtitle: 'Warm & earthy' },
};

export const fonts = {
  sans: 'DMSans_400Regular',
  sansLight: 'DMSans_300Light',
  sansMedium: 'DMSans_500Medium',
  serif: 'DMSerifDisplay_400Regular',
  serifItalic: 'DMSerifDisplay_400Regular_Italic',
} as const;
