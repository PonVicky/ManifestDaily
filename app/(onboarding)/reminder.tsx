import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize } from '../../constants/tokens';
import { REMINDER_OPTIONS } from '../../constants/data';
import Button from '../../components/shared/Button';
import Icon, { IconName } from '../../components/ui/Icon';
import ProgressDots from '../../components/ui/ProgressDots';

const TOTAL_STEPS = 13;

export default function ReminderScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const setReminder = useAppStore((s) => s.setReminder);
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<string>('morning');

  const handleContinue = () => {
    setReminder(selected as any);
    router.push('/(onboarding)/notification');
  };

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={6} total={TOTAL_STEPS} />

        <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
          When should we{'\n'}remind you?
        </Text>
        <Text style={[styles.subtitle, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
          We'll nudge you gently at your chosen time.
        </Text>

        <View style={styles.optionList}>
          {REMINDER_OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected ? theme.accentTint : theme.card,
                    borderColor: isSelected ? theme.gold : theme.border,
                  },
                ]}
                onPress={() => setSelected(opt.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: isSelected ? theme.sel : theme.bg2 },
                  ]}
                >
                  <Icon
                    name={opt.icon as IconName}
                    size={22}
                    color={isSelected ? theme.orange : theme.text2}
                  />
                </View>

                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: theme.text,
                        fontFamily: 'DMSans_500Medium',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionTime,
                      { color: theme.text2, fontFamily: 'DMSans_400Regular' },
                    ]}
                  >
                    {opt.time}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: isSelected ? theme.gold : theme.border,
                      backgroundColor: isSelected ? theme.gold : 'transparent',
                    },
                  ]}
                >
                  {isSelected && (
                    <Icon name="check" size={14} color={theme.onAccent} strokeWidth={2.5} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
  dots: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: { height: 7, borderRadius: 4 },
  title: {
    fontSize: 32,
    letterSpacing: -0.3,
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  optionList: { gap: spacing.md, flex: 1 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.base,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontSize: fontSize.lg },
  optionTime: { fontSize: fontSize.sm },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { paddingTop: spacing.base },
});
