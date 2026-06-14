import React, { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

export type MascotState = 'meditate' | 'celebrate' | 'sleep' | 'content' | 'zen' | 'rest' | 'side' | 'back';

interface MascotProps {
  state?: MascotState;
  size?: number;
  opacity?: number;
  float?: boolean;
  halo?: boolean;
}

const MASCOT_IMAGES: Record<MascotState, any> = {
  meditate: require('../../assets/mascot-meditate.png'),
  celebrate: require('../../assets/mascot-celebrate.png'),
  sleep: require('../../assets/mascot-sleep.png'),
  content: require('../../assets/mascot-content.png'),
  zen: require('../../assets/mascot-zen.png'),
  rest: require('../../assets/mascot-rest.png'),
  side: require('../../assets/mascot-side.png'),
  back: require('../../assets/mascot-back.png'),
};

export default function Mascot({
  state = 'meditate',
  size = 120,
  opacity = 1,
  float = false,
  halo = false,
}: MascotProps) {
  const { theme } = useTheme();

  const translateY = useSharedValue(0);

  useEffect(() => {
    if (float) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-7, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity,
  }));

  const imageSource = MASCOT_IMAGES[state];

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {halo && (
        <View
          style={[
            styles.halo,
            {
              width: size * 1.4,
              height: size * 1.4,
              borderRadius: size * 0.7,
              backgroundColor: theme.accentTint,
              top: -size * 0.2,
              left: -size * 0.2,
            },
          ]}
        />
      )}
      <Animated.View style={[styles.mascotContainer, floatStyle]}>
        <Image
          source={imageSource}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
