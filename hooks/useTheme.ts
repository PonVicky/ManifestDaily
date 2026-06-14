import { useSegments } from 'expo-router';
import { useAppStore } from '../store/useAppStore';
import { getTheme, ThemeColors, ThemeKey } from '../constants/theme';

export function useTheme(): { theme: ThemeColors; darkMode: boolean; themeKey: ThemeKey } {
  const segments = useSegments();
  const appStoreDarkMode = useAppStore((s) => s.darkMode);
  const themeKey = useAppStore((s) => s.themeKey);

  // Force light theme for onboarding screens (until paywall is passed)
  const isOnboarding = segments[0] === '(onboarding)';
  const darkMode = isOnboarding ? false : appStoreDarkMode;

  return { theme: getTheme(themeKey, darkMode), darkMode, themeKey };
}
