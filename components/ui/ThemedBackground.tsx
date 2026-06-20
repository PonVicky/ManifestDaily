import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

const LIGHT_BG = require('../../assets/manifest-background-lite.webp');
const DARK_BG = require('../../assets/manifest-background-dark.png');

export default function ThemedBackground({
  children,
  style,
  lightSource = LIGHT_BG,
  darkSource = DARK_BG,
}: {
  children: React.ReactNode;
  style?: object;
  // Optional per-screen background overrides; defaults to the app-wide art.
  lightSource?: number;
  darkSource?: number;
}) {
  const { darkMode } = useTheme();
  const darkOpacity = useRef(new Animated.Value(darkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(darkOpacity, {
      toValue: darkMode ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [darkMode]);

  return (
    <View style={[styles.container, style]}>
      <Animated.Image source={lightSource} style={[StyleSheet.absoluteFill, styles.bg]} resizeMode="cover" />
      <Animated.Image source={darkSource} style={[StyleSheet.absoluteFill, styles.bg, { opacity: darkOpacity }]} resizeMode="cover" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { width: '100%', height: '100%' },
});
