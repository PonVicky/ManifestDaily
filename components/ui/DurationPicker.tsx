import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../constants/tokens';

const ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS; // 240
// Padding so the first / last item can be scrolled to the centre row.
const PAD = ITEM_HEIGHT * 2;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

interface WheelColumnProps {
  items: string[];
  index: number;
  onIndexChange: (index: number) => void;
  flex: number;
  align?: 'left' | 'center' | 'right';
}

// A single drum-roll column, matching the onboarding date picker's feel.
function WheelColumn({ items, index, onIndexChange, flex, align = 'center' }: WheelColumnProps) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [center, setCenter] = useState(index);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    setCenter(index);
  }, [index]);

  const clampIndex = (raw: number) => Math.max(0, Math.min(items.length - 1, raw));

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = clampIndex(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT));
    if (idx !== center) {
      setCenter(idx);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = clampIndex(Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT));
    setCenter(idx);
    if (idx !== index) onIndexChange(idx);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex }}
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: index * ITEM_HEIGHT }}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onMomentumScrollEnd={handleMomentumEnd}
      contentContainerStyle={{ paddingVertical: PAD }}
    >
      {items.map((label, i) => {
        const dist = Math.abs(i - center);
        const isSelected = i === center;
        const opacity = isSelected ? 1 : dist === 1 ? 0.55 : dist === 2 ? 0.28 : 0.14;
        return (
          <View key={i} style={styles.item}>
            <Text
              style={[
                { textAlign: align, opacity },
                isSelected
                  ? { color: theme.text, fontFamily: 'DMSans_500Medium', fontSize: 20 }
                  : { color: theme.text2, fontFamily: 'DMSans_400Regular', fontSize: 16 },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export interface DurationValue {
  hours: number;
  minutes: number;
}

const HOURS = range(0, 3).map(String);
const MINUTES = range(0, 59).map((n) => n.toString().padStart(2, '0'));

interface DurationPickerProps {
  value: DurationValue;
  onChange: (value: DurationValue) => void;
}

// Hours | Minutes drum-roll picker, used for custom focus session lengths.
export default function DurationPicker({ value, onChange }: DurationPickerProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { height: PICKER_HEIGHT }]}>
      <View style={styles.columns}>
        <WheelColumn
          items={HOURS}
          index={value.hours}
          onIndexChange={(i) => onChange({ ...value, hours: i })}
          flex={1}
          align="right"
        />
        <View style={styles.unitLabel}>
          <Text style={{ color: theme.text2, fontFamily: 'DMSans_400Regular', fontSize: 14 }}>hr</Text>
        </View>
        <WheelColumn
          items={MINUTES}
          index={value.minutes}
          onIndexChange={(i) => onChange({ ...value, minutes: i })}
          flex={1}
          align="left"
        />
        <View style={styles.unitLabel}>
          <Text style={{ color: theme.text2, fontFamily: 'DMSans_400Regular', fontSize: 14 }}>min</Text>
        </View>
      </View>

      {/* Centre selection band */}
      <View
        pointerEvents="none"
        style={[styles.centerBand, { borderColor: theme.goldSoft, top: PAD, height: ITEM_HEIGHT }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  columns: {
    flexDirection: 'row',
    flex: 1,
    gap: spacing.sm,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  unitLabel: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 2,
  },
});
