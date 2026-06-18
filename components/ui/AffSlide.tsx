import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { GOALS, GoalId, goalIdForAffirmation } from '../../constants/data';
import Icon from './Icon';

interface AffSlideProps {
  text: string;
  index: number;
  isActive: boolean;
  // Height of one slide. The feed measures its own visible viewport and passes
  // it here so each slide is exactly one page tall — content centers naturally
  // and the list snaps cleanly with no leftover tail to get stuck in. Falls
  // back to the device height before the first measure.
  slideHeight?: number;
  // Category for the ✦ tag. Pass it for custom affirmations (which can't be
  // reverse-looked-up from the built-in pool); built-ins can omit it and fall
  // back to lookup by text.
  goalId?: GoalId | null;
  // Custom (user-authored) slides get extra edit/delete actions.
  isCustom?: boolean;
  onSave?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function AffSlide({ text, index, isActive, slideHeight, goalId: goalIdProp, isCustom, onSave, onShare, onEdit, onDelete }: AffSlideProps) {
  const { theme, darkMode } = useTheme();
  const savedAffirmations = useAppStore((s) => s.savedAffirmations);

  const isSaved = useMemo(
    () => savedAffirmations.includes(text),
    [savedAffirmations, text]
  );

  const goalId = goalIdProp ?? goalIdForAffirmation(text);
  const goal = goalId ? GOALS.find((g) => g.id === goalId) : undefined;

  // Built-ins are short, but custom affirmations can run long. Step the type
  // size down as the text grows so it always stays within the slide.
  const textSize = useMemo(() => {
    const len = text.length;
    if (len <= 60) return { fontSize: 33, lineHeight: 47 };
    if (len <= 90) return { fontSize: 28, lineHeight: 40 };
    if (len <= 120) return { fontSize: 24, lineHeight: 34 };
    if (len <= 150) return { fontSize: 21, lineHeight: 30 };
    return { fontSize: 19, lineHeight: 27 };
  }, [text]);

  const isEven = index % 2 === 0;
  const bgColor = isEven ? theme.gold : theme.goldSoft;

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave?.();
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.();
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit?.();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.();
  };

  return (
    <View
      style={[
        styles.slide,
        {
          // One slide = one feed page; content centers within it directly.
          height: slideHeight ?? screenHeight,
          backgroundColor: 'transparent',
          opacity: isActive ? 1 : 0.28,
        },
      ]}
    >
      {/* Category eyebrow */}
      {goal && (
        <Text
          style={[
            styles.eyebrow,
            {
              color: theme.goldDark,
              fontFamily: 'DMSans_500Medium',
            },
          ]}
        >
          ✦ {goal.label.toUpperCase()}
        </Text>
      )}

      {/* Affirmation text */}
      <Text
        style={[
          styles.affirmationText,
          {
            color: theme.text,
            fontFamily: 'DMSerifDisplay_400Regular_Italic',
            fontSize: textSize.fontSize,
            lineHeight: textSize.lineHeight,
          },
        ]}
      >
        {text}
      </Text>

      {/* Accent rule */}
      <View style={[styles.rule, { backgroundColor: theme.goldDark }]} />

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: isSaved ? theme.gold : darkMode ? theme.text2 : theme.border,
              backgroundColor: isSaved ? theme.sel : 'transparent',
            },
          ]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Icon
            name="heart"
            size={18}
            color={isSaved ? theme.gold : theme.text2}
            fill={isSaved ? theme.gold : 'none'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            {
              borderColor: darkMode ? theme.text2 : theme.border,
              backgroundColor: 'transparent',
            },
          ]}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Icon name="share" size={18} color={theme.text2} />
        </TouchableOpacity>

        {isCustom && (
          <>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={handleEdit}
              activeOpacity={0.85}
            >
              <Icon name="edit" size={18} color={theme.text2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: 'transparent',
                },
              ]}
              onPress={handleDelete}
              activeOpacity={0.85}
            >
              <Icon name="trash" size={18} color={theme.text2} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    paddingHorizontal: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 33,
    lineHeight: 47,
    letterSpacing: -0.3,
    textAlign: 'center',
    maxWidth: 330,
    marginBottom: 24,
  },
  rule: {
    width: 40,
    height: 1,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  actionBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
