import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, Dob } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, fontSize } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import ProgressDots from '../../components/ui/ProgressDots';
import DrumRollPicker from '../../components/ui/DrumRollPicker';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;
const DEFAULT_DOB: Dob = { day: 1, month: 1, year: 2000 };
const BACKGROUND_TEXT = '#2D211A';
const BACKGROUND_MUTED = '#594033';

export default function DobScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const name = useAppStore((s) => s.userName);
  const storedDob = useAppStore((s) => s.userDob);
  const setDob = useAppStore((s) => s.setDob);

  const [dob, setLocalDob] = useState<Dob>(storedDob ?? DEFAULT_DOB);

  const handleContinue = () => {
    setDob(dob);
    trackEvent('onboarding_step_completed', { step: 3 });
    router.push('/(onboarding)/goals');
  };

  const heading = name ? `When were you born, ${name}?` : 'When were you born?';

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={3} total={TOTAL_STEPS} />

        <Text style={[styles.title, { color: BACKGROUND_TEXT, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
          {heading}
        </Text>
        <Text style={[styles.subtitle, { color: BACKGROUND_MUTED, fontFamily: 'DMSans_400Regular' }]}>
          Your journey is unique to you.
        </Text>

        <View style={styles.pickerArea}>
          <DrumRollPicker value={dob} onChange={setLocalDob} />
        </View>

        <View style={styles.footer}>
          <Button label="Continue" onPress={handleContinue} variant="primary" />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: 30,
    letterSpacing: -0.3,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  pickerArea: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingTop: spacing.base,
  },
});
