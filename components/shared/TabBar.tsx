import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';

import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { ThemeColors } from '../../constants/theme';
import Icon, { IconName } from '../ui/Icon';

const TABS: { name: string; icon: IconName; label: string }[] = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'focus', icon: 'focus', label: 'Focus' },
  { name: 'vault', icon: 'lock', label: 'Vault' },
  { name: 'progress', icon: 'progress', label: 'Progress' },
];

function TabItem({
  tab,
  isActive,
  onPress,
  theme,
}: {
  tab: (typeof TABS)[0];
  isActive: boolean;
  onPress: () => void;
  theme: ThemeColors;
}) {
  const scale = useSharedValue(isActive ? 1.12 : 1);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.12 : 1, { damping: 12, stiffness: 200 });
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.iconWrap, animStyle]}>
        <Icon
          name={tab.icon}
          size={22}
          color={isActive ? theme.gold : theme.text2}
          fill={isActive ? theme.accentTint : 'none'}
          strokeWidth={isActive ? 2.1 : 1.7}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          {
            color: isActive ? theme.gold : theme.text2,
            fontFamily: isActive ? 'DMSans_500Medium' : 'DMSans_400Regular',
          },
        ]}
      >
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
}

interface TabBarProps {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
  [key: string]: unknown;
}

export default function TabBar({ state, navigation }: TabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.tabBg,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {TABS.map((tab, index) => (
        <TabItem
          key={tab.name}
          tab={tab}
          isActive={state.index === index}
          onPress={() => navigation.navigate(tab.name)}
          theme={theme}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    height: 88,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
  },
});
