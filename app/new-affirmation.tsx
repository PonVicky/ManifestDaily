import React, { useState } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius, fontSize } from '../constants/tokens';
import { GOALS, GoalId } from '../constants/data';
import { canCreateCustomAffirmation, presentPaywall } from '../lib/featureAccess';
import Button from '../components/shared/Button';
import Icon, { IconName } from '../components/ui/Icon';

const MAX_LEN = 160;

const isGoalId = (v: unknown): v is GoalId => GOALS.some((g) => g.id === v);

export default function NewAffirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, darkMode } = useTheme();
  const addCustomAffirmation = useAppStore((s) => s.addCustomAffirmation);
  const updateCustomAffirmation = useAppStore((s) => s.updateCustomAffirmation);
  const customAffirmations = useAppStore((s) => s.customAffirmations);
  const isPremium = useAppStore((s) => s.isPremium);
  const selectedGoals = useAppStore((s) => s.selectedGoals);

  // When an `id` is passed we're editing an existing custom affirmation.
  const params = useLocalSearchParams<{ id?: string; text?: string; category?: string }>();
  const editingId = params.id;
  const isEditing = !!editingId;

  const [text, setText] = useState(params.text ?? '');
  // Default the category to the edited one, else the user's first chosen goal,
  // else the first goal — so a one-tap save is possible.
  const [category, setCategory] = useState<GoalId>(
    isGoalId(params.category) ? params.category : selectedGoals[0] ?? GOALS[0].id,
  );

  const trimmed = text.trim();
  const canSave = trimmed.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    // Backstop for the Android free-tier cap (the feed's + button is the main
    // gate; this covers the composer being reached any other way). Edits to
    // existing affirmations are always allowed.
    if (!isEditing && !canCreateCustomAffirmation(customAffirmations.length, isPremium)) {
      presentPaywall(router, 'customAffirmations');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isEditing) {
      updateCustomAffirmation(editingId, trimmed, category);
    } else {
      addCustomAffirmation(trimmed, category);
    }
    router.back();
  };

  return (
    <ImageBackground
      source={darkMode ? require('../assets/bg6_dark.webp') : require('../assets/bg6_lite.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <View style={[styles.handle, { backgroundColor: theme.border }]} />

      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : spacing.lg }]}>
        <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular' }]}>
          {isEditing ? 'Edit Affirmation' : 'New Affirmation'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: theme.bg2, borderColor: theme.border }]}
          activeOpacity={0.75}
        >
          <Icon name="close" size={16} color={theme.text2} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 8}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Affirmation text */}
          <Text style={[styles.label, { color: theme.text2, fontFamily: 'DMSans_500Medium' }]}>
            YOUR AFFIRMATION
          </Text>
          <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX_LEN))}
              placeholder="I am…"
              placeholderTextColor={theme.text2}
              multiline
              autoFocus
              style={[
                styles.input,
                { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' },
              ]}
            />
          </View>
          <Text style={[styles.counter, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            {trimmed.length}/{MAX_LEN}
          </Text>

          {/* Category */}
          <Text style={[styles.label, { color: theme.text2, fontFamily: 'DMSans_500Medium', marginTop: spacing.lg }]}>
            CATEGORY
          </Text>
          <View style={styles.grid}>
            {GOALS.map((goal) => {
              const isSelected = goal.id === category;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isSelected ? theme.sel : theme.card,
                      borderColor: isSelected ? theme.gold : theme.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(goal.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={goal.icon as IconName}
                    size={16}
                    color={isSelected ? theme.gold : theme.text2}
                  />
                  <Text
                    style={[
                      styles.catLabel,
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

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button label="Save Affirmation" onPress={handleSave} variant="primary" disabled={!canSave} />
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['3xl'],
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontSize: fontSize.xs,
    letterSpacing: 1.6,
    marginBottom: spacing.sm,
  },
  inputCard: {
    borderRadius: radius['4xl'],
    borderWidth: 1,
    padding: spacing.lg,
    minHeight: 120,
  },
  input: {
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: -0.3,
    textAlignVertical: 'top',
    flex: 1,
  },
  counter: {
    fontSize: fontSize.xs,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: radius['3xl'],
    borderWidth: 1,
  },
  catLabel: {
    fontSize: fontSize.base,
    letterSpacing: 0.1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
});
