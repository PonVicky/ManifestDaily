import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

export default function ScreenTransition({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  // Only fade in on the very first focus — re-running this on every focus
  // (e.g. returning from a modal pushed on top) drops opacity to 0 first,
  // causing a visible "blink" of the screen behind it.
  const hasAnimated = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
    }, []),
  );

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
