import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { spacing, fontSize } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import Icon from '../../components/ui/Icon';
import ProgressDots from '../../components/ui/ProgressDots';

const TOTAL_STEPS = 13;

export default function NotificationScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const reminderTime = useAppStore((s) => s.reminderTime);
  const { requestPermissions, scheduleDaily } = useNotifications();

  const handleEnable = async () => {
    // Request permission, then schedule the daily reminder for the time the
    // user already picked on the previous step. Onboarding continues either way.
    const granted = await requestPermissions();
    if (granted && reminderTime) {
      await scheduleDaily(reminderTime);
    }
    router.push('/(onboarding)/social');
  };

  const handleSkip = () => {
    router.push('/(onboarding)/social');
  };

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={7} total={TOTAL_STEPS} />

        <View style={styles.content}>
          {/* Bell icon container */}
          <View
            style={[
              styles.bellContainer,
              { backgroundColor: theme.accentTint, borderColor: theme.goldSoft },
            ]}
          >
            <Icon name="bell" size={48} color={theme.gold} fill={theme.accentTint} />
            {/* Orange badge */}
            <View style={[styles.badge, { backgroundColor: theme.orange }]} />
          </View>

          <Text
            style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}
          >
            Stay on track, gently
          </Text>
          <Text
            style={[styles.body, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
          >
            We'll remind you once a day — no noise, just a gentle nudge toward your practice.
          </Text>
        </View>

        <View style={styles.buttonArea}>
          <Button label="Enable reminders" onPress={handleEnable} variant="primary" />
          <Button label="Not now" onPress={handleSkip} variant="ghost" />
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
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: { height: 7, borderRadius: 4 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  bellContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  buttonArea: {
    gap: spacing.md,
  },
});
