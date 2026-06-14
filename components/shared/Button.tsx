import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle, TextStyle, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { radius, fontSize, spacing } from '../../constants/tokens';
import Icon, { IconName } from '../ui/Icon';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'text';
  icon?: IconName;
  iconRight?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const isText = variant === 'text';

  return (
    <AnimatedTouchable
      style={[
        styles.base,
        isPrimary && { backgroundColor: theme.gold, shadowColor: theme.gold },
        isGhost && { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
        isText && { backgroundColor: 'transparent', paddingHorizontal: 0 },
        disabled && { opacity: 0.45 },
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
    >
      {icon && !iconRight && (
        <View style={{ marginRight: spacing.sm }}>
          <Icon
            name={icon}
            size={18}
            color={isPrimary ? theme.onAccent : theme.text}
          />
        </View>
      )}
      <Text
        style={[
          styles.label,
          { color: isPrimary ? theme.onAccent : theme.text },
          isText && { fontSize: fontSize.md, color: theme.text2 },
          textStyle,
        ]}
      >
        {label}
      </Text>
      {icon && iconRight && (
        <View style={{ marginLeft: spacing.sm }}>
          <Icon
            name={icon}
            size={18}
            color={isPrimary ? theme.onAccent : theme.text}
          />
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius['2xl'],
    paddingVertical: 17,
    paddingHorizontal: 22,
    width: '100%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: fontSize.lg,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.1,
  },
});
