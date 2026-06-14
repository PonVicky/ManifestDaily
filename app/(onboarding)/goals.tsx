import React, { useState } from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize } from '../../constants/tokens';
import { GOALS, GoalId } from '../../constants/data';
import Button from '../../components/shared/Button';
import Icon, { IconName } from '../../components/ui/Icon';
import ProgressDots from '../../components/ui/ProgressDots';

const TOTAL_STEPS = 13;

export default function GoalsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const setGoals = useAppStore((s) => s.setGoals);
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<GoalId[]>([]);

  const toggleGoal = (id: GoalId) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    setGoals(selected);
    router.push('/(onboarding)/belief');
  };

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <ProgressDots step={4} total={TOTAL_STEPS} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
            What are you{'\n'}manifesting?
          </Text>
          <Text style={[styles.subtitle, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            Choose one or more to personalise your affirmations.
          </Text>

          <View style={styles.grid}>
            {GOALS.map((goal) => {
              const isSelected = selected.includes(goal.id);
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    {
                      backgroundColor: isSelected ? theme.accentTint : theme.card,
                      borderColor: isSelected ? theme.gold : theme.border,
                    },
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isSelected ? theme.sel : theme.bg2,
                      },
                    ]}
                  >
                    <Icon
                      name={goal.icon as IconName}
                      size={22}
                      color={isSelected ? theme.orange : theme.text2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.goalLabel,
                      {
                        color: isSelected ? theme.text : theme.text2,
                        fontFamily: isSelected ? 'DMSans_500Medium' : 'DMSans_400Regular',
                      },
                    ]}
                  >
                    {goal.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={handleContinue}
            variant="primary"
            disabled={selected.length === 0}
          />
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
  dot: {
    height: 7,
    borderRadius: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  goalCard: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.md,
    minHeight: 100,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  footer: {
    paddingTop: spacing.base,
  },
});
