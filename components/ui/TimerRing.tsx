import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import Icon from './Icon';
import { SOUNDS } from '../../constants/data';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 300;
const STROKE = 10;
const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface TimerRingProps {
  progress: number; // 0 to 1
  timeString: string; // "mm:ss"
  soundId: string | null;
}

export default function TimerRing({ progress, timeString, soundId }: TimerRingProps) {
  const { theme, darkMode } = useTheme();

  const animatedOffset = useSharedValue(CIRCUMFERENCE);

  useEffect(() => {
    animatedOffset.value = withTiming(CIRCUMFERENCE * (1 - progress), {
      duration: 1000,
      easing: Easing.linear,
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const sound = SOUNDS.find((s) => s.id === soundId);

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background ring */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={darkMode ? theme.bg2 : '#D9C7AE'}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={theme.gold}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.center} pointerEvents="none">
        <Text
          style={[
            styles.timeText,
            { color: theme.gold, fontFamily: 'DMSerifDisplay_400Regular' },
          ]}
        >
          {timeString}
        </Text>
        {sound && (
          <View style={styles.soundRow}>
            <Icon name={sound.icon as any} size={14} color={theme.text2} />
            <Text
              style={[
                styles.soundLabel,
                { color: theme.text2, fontFamily: 'DMSans_400Regular' },
              ]}
            >
              {sound.label}
            </Text>
          </View>
        )}
        {!sound && (
          <Text style={[styles.soundLabel, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            No sound
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 66,
    lineHeight: 72,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  soundLabel: {
    fontSize: 14,
  },
});
