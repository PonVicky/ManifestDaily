import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, TouchableOpacity, View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { fonts, ThemeColors } from '../constants/theme';
import { spacing, radius, shadow, shadowDark } from '../constants/tokens';
import BreathingAnimation, { BreathingConfig } from '../components/ui/BreathingAnimation';
import Mascot from '../components/ui/Mascot';
import Icon from '../components/ui/Icon';
import { trackEvent } from '../lib/analytics';

function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
  theme,
  darkMode,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  theme: ThemeColors;
  darkMode: boolean;
}) {
  const sh = darkMode ? shadowDark.sm : shadow.sm;
  return (
    <View style={styles.stepperRow}>
      <Text style={[styles.stepperLabel, { color: theme.text2, fontFamily: fonts.sans }]}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}
          onPress={() => onChange(Math.max(min, value - step))}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: theme.text }]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.stepValue, { color: theme.text, fontFamily: fonts.sansMedium }]}>
          {value}
          <Text style={[styles.stepUnit, { color: theme.text2, fontFamily: fonts.sans }]}>{unit}</Text>
        </Text>
        <TouchableOpacity
          style={[styles.stepBtn, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}
          onPress={() => onChange(Math.min(max, value + step))}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function BreathingScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const logBreathingSession = useAppStore((s) => s.logBreathingSession);
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.md : shadow.md;

  const [started, setStarted] = useState(false);
  const [config, setConfig] = useState<BreathingConfig>({ inhale: 5, hold: 5, exhale: 5 });
  const [totalMins, setTotalMins] = useState(2);
  const [totalSecs, setTotalSecs] = useState(0);

  const cycleDuration = config.inhale + config.hold + config.exhale;
  const minSecs = Math.ceil((cycleDuration % 60) / 15) * 15 % 60;
  const minMins = Math.floor(cycleDuration / 60);

  const set = (key: keyof BreathingConfig) => (v: number) =>
    setConfig((c) => ({ ...c, [key]: v }));

  // Keep the selected duration valid whenever the breathing rhythm changes —
  // a longer cycle can push the previously-set duration below one full cycle.
  useEffect(() => {
    setTotalMins((m) => Math.max(m, minMins));
    setTotalSecs((s) => Math.max(s, minSecs));
  }, [cycleDuration]);

  const totalDuration = totalMins * 60 + totalSecs;
  const isDurationValid = totalDuration >= cycleDuration && totalDuration > 0;

  return (
    <ImageBackground
      source={darkMode ? require('../assets/bg7_dark.webp') : require('../assets/bg7_lite.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <LinearGradient
        colors={[theme.accentTint, 'transparent']}
        style={styles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <TouchableOpacity
        style={[styles.closeBtn, { top: insets.top, backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.back()}
      >
        <Icon name="close" size={18} color={theme.text2} />
      </TouchableOpacity>

      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        {started ? (
          <BreathingAnimation
            config={config}
            totalSeconds={totalMins * 60 + totalSecs}
            onComplete={() => {
              logBreathingSession(totalMins * 60 + totalSecs);
              trackEvent('breathing_exercise_completed');
              router.back();
            }}
          />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.setup}>
              <Mascot state="meditate" size={140} opacity={0.7} />
              <Text style={[styles.title, styles.titleNoTopGap, { color: theme.text, fontFamily: fonts.serifItalic }]}>
                Breathe
              </Text>
              <Text style={[styles.subtitle, { color: theme.text2, fontFamily: fonts.sans }]}>
                Set your rhythm
              </Text>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, ...sh }]}>
                <Stepper label="Inhale" value={config.inhale} unit="s" min={2} max={10} onChange={set('inhale')} theme={theme} darkMode={darkMode} />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Stepper label="Hold" value={config.hold} unit="s" min={0} max={10} onChange={set('hold')} theme={theme} darkMode={darkMode} />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Stepper label="Exhale" value={config.exhale} unit="s" min={2} max={10} onChange={set('exhale')} theme={theme} darkMode={darkMode} />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Stepper label="Duration" value={totalMins} unit=" min" min={minMins} max={30} onChange={setTotalMins} theme={theme} darkMode={darkMode} />
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Stepper label="Seconds" value={totalSecs} unit="s" min={minSecs} max={45} step={15} onChange={setTotalSecs} theme={theme} darkMode={darkMode} />
              </View>

              <TouchableOpacity
                style={[styles.beginBtn, { backgroundColor: theme.gold, opacity: isDurationValid ? 1 : 0.5 }]}
                onPress={() => isDurationValid && setStarted(true)}
                activeOpacity={0.85}
                disabled={!isDurationValid}
              >
                <Text style={[styles.beginText, { color: theme.onAccent, fontFamily: fonts.sansMedium }]}>
                  Begin
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  closeBtn: {
    position: 'absolute', right: spacing.xl, zIndex: 10,
    width: 38, height: 38, borderRadius: 19, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { width: '100%' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  setup: { alignItems: 'center', gap: 24, width: '100%', paddingHorizontal: spacing.xl },
  title: { fontSize: 36, textAlign: 'center' },
  titleNoTopGap: { marginTop: -16 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: -16 },
  card: {
    width: '100%', borderRadius: radius['3xl'],
    borderWidth: 1, paddingVertical: 4,
  },
  divider: { height: 1, marginHorizontal: spacing.xl },
  stepperRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: 14,
  },
  stepperLabel: { fontSize: 15 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, lineHeight: 20 },
  stepValue: { fontSize: 16, width: 44, textAlign: 'center' },
  stepUnit: { fontSize: 13 },
  beginBtn: {
    width: '100%', height: 52, borderRadius: radius['4xl'],
    alignItems: 'center', justifyContent: 'center',
  },
  beginText: { fontSize: 17 },
});
