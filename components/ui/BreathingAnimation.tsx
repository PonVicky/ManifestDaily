import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

const ORB_SIZE = 200;
const ORB_RADIUS = ORB_SIZE / 2;
const RING_SIZE = ORB_SIZE + 52;
const RING_PEAK = 1.17; // was 1.22, 20% less expansion

export interface BreathingConfig {
  inhale: number;
  hold: number;
  exhale: number;
}

interface BreathingAnimationProps {
  config: BreathingConfig;
  onComplete?: () => void;
  totalSeconds?: number;
}

type PhaseType = 'inhale' | 'hold' | 'exhale';

interface Phase {
  type: PhaseType;
  label: string;
  duration: number;
}

export default function BreathingAnimation({
  config,
  onComplete,
  totalSeconds = 120,
}: BreathingAnimationProps) {
  const { theme, darkMode } = useTheme();

  const phases: Phase[] = [
    { type: 'inhale', label: 'Fill, and hold', duration: config.inhale * 1000 },
    ...(config.hold > 0
      ? [{ type: 'hold' as PhaseType, label: 'Hold', duration: config.hold * 1000 }]
      : []),
    { type: 'exhale', label: 'Release', duration: config.exhale * 1000 },
  ];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [holdCountdown, setHoldCountdown] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beatingRef = useRef(false);

  const fillProgress = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const mascotTranslateY = useSharedValue(200);
  const mascotOpacity = useSharedValue(0);

  const advance = useCallback((idx: number, total: number) => {
    setPhaseIndex((idx + 1) % total);
  }, []);

  const beatPeak = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Recursive beat loop — haptic fires exactly at the peak moment
  const doBeat = useCallback(() => {
    if (!beatingRef.current) return;
    ringScale.value = withTiming(
      RING_PEAK,
      { duration: 900, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        if (!finished || !beatingRef.current) return;
        runOnJS(beatPeak)();
        ringScale.value = withTiming(
          1.0,
          { duration: 900, easing: Easing.inOut(Easing.ease) },
          (finished2) => {
            if (!finished2 || !beatingRef.current) return;
            runOnJS(doBeat)();
          },
        );
      },
    );
  }, [beatPeak]);

  useEffect(() => {
    if (isCompleted) {
      beatingRef.current = false;
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
      cancelAnimation(fillProgress);
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdExitTimerRef.current) clearTimeout(holdExitTimerRef.current);
      if (holdCountdownRef.current) clearInterval(holdCountdownRef.current);

      // Animate mascot slide in with smooth easing
      mascotTranslateY.value = withTiming(0, {
        duration: 1000,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1)
      });
      mascotOpacity.value = withTiming(1, {
        duration: 1000,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1)
      });
    }
  }, [isCompleted]);

  useEffect(() => {
    if (isCompleted) return;

    const phase = phases[phaseIndex];

    if (phase.type === 'hold') {
      beatingRef.current = true;
      ringOpacity.value = withTiming(1, { duration: 400 });
      doBeat();

      setHoldCountdown(config.hold);
      holdCountdownRef.current = setInterval(() => {
        setHoldCountdown((prev) => {
          if (prev <= 0) {
            if (holdCountdownRef.current) clearInterval(holdCountdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      holdTimerRef.current = setTimeout(() => {
        beatingRef.current = false;
        // Smoothly glide back to rest — no abrupt cancel
        ringScale.value = withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) });
        ringOpacity.value = withTiming(0, { duration: 700 });
        holdExitTimerRef.current = setTimeout(() => {
          setPhaseIndex((idx) => (idx + 1) % phases.length);
        }, 700);
      }, phase.duration);

      return () => {
        beatingRef.current = false;
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        if (holdExitTimerRef.current) clearTimeout(holdExitTimerRef.current);
        if (holdCountdownRef.current) clearInterval(holdCountdownRef.current);
      };
    }

    const target = phase.type === 'inhale' ? 1 : 0;
    fillProgress.value = withTiming(
      target,
      { duration: phase.duration, easing: Easing.bezier(0.45, 0, 0.55, 1) },
      (finished) => {
        if (finished) runOnJS(advance)(phaseIndex, phases.length);
      },
    );
  }, [phaseIndex, isCompleted]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setIsCompleted(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fillStyle = useAnimatedStyle(() => ({
    height: fillProgress.value * ORB_SIZE,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: mascotTranslateY.value }],
    opacity: mascotOpacity.value,
  }));

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  if (isCompleted) {
    return (
      <ScrollView
        style={styles.completedScroll}
        contentContainerStyle={styles.completedScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.Image
          source={require('../../assets/mascot-zen.png')}
          style={[styles.mascotImage, mascotStyle]}
        />
        <Text style={[styles.completedTitle, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
          Well Done!
        </Text>
        <Text style={[styles.completedSubtitle, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
          You completed your breathing session
        </Text>
        <TouchableOpacity
          onPress={() => onComplete?.()}
          style={[styles.closeBtn, { backgroundColor: theme.gold, marginTop: 40 }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.closeBtnText, { color: theme.onAccent, fontFamily: 'DMSans_500Medium' }]}>
            Close
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Orb + ring in a shared wrapper so ring sits behind */}
      <View style={styles.orbWrapper}>
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: theme.gold,
              backgroundColor: darkMode ? 'rgba(224,187,140,0.07)' : 'rgba(214,168,122,0.1)',
            },
            ringStyle,
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderColor: theme.gold,
            },
          ]}
        >
          <Animated.View style={[styles.fill, { backgroundColor: theme.gold }, fillStyle]} />
          <View style={styles.iconOverlay} pointerEvents="none">
            <Text style={[styles.breathIcon, { color: darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(80,60,40,0.45)' }]}>
              ≈
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.phaseLabel, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
        {phases[phaseIndex]?.label}
      </Text>

      <View style={styles.countdownPlaceholder}>
        {phases[phaseIndex]?.type === 'hold' && (
          <Text style={[styles.holdCountdown, { color: theme.gold, fontFamily: 'DMSans_500Medium' }]}>
            {holdCountdown}
          </Text>
        )}
      </View>

      <Text style={[styles.remaining, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
        {mins}:{secs.toString().padStart(2, '0')} remaining
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 32 },
  completedScroll: { width: '100%' },
  completedScrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  orbWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    opacity: 0,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_RADIUS,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fill: { width: '100%', position: 'absolute', bottom: 0, left: 0, right: 0 },
  iconOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  breathIcon: { fontSize: 32, lineHeight: 40 },
  phaseLabel: { fontSize: 30, textAlign: 'center' },
  countdownPlaceholder: { height: 62, justifyContent: 'center', alignItems: 'center' },
  holdCountdown: { fontSize: 48, lineHeight: 56, textAlign: 'center' },
  remaining: { fontSize: 15, textAlign: 'center' },
  mascotImage: { width: 240, height: 240, marginBottom: 24 },
  completedTitle: { fontSize: 36, textAlign: 'center', marginTop: 16 },
  completedSubtitle: { fontSize: 15, textAlign: 'center', marginTop: 8 },
  closeBtn: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 100 },
  closeBtnText: { fontSize: 16 },
});
