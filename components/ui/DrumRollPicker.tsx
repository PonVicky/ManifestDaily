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
import type { Dob } from '../../store/useAppStore';

// Convert a `#RRGGBB` hex color to `rgba(r,g,b,alpha)`. The fade overlays need
// to blend toward the theme background, not toward black — the keyword
// `transparent` is rgba(0,0,0,0), which produces a visible dark band when
// interpolated from an opaque light color.
const ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS; // 240
// Padding so the first / last item can be scrolled to the centre row.
const PAD = ITEM_HEIGHT * 2;

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

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

// A single drum-roll column. A plain ScrollView with snapToInterval gives the
// iOS wheel feel; we track the centred row in state so its label can switch to
// the serif "selected" treatment live as the user scrolls, while neighbouring
// rows fade out toward the edges.
function WheelColumn({ items, index, onIndexChange, flex, align = 'center' }: WheelColumnProps) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [center, setCenter] = useState(index);

  // Snap to the incoming value on mount (and if it changes externally, e.g.
  // day count shrinking when the month changes).
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

  const textAlign = align;

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
                { textAlign, opacity },
                isSelected
                  ? {
                    color: theme.text,
                    fontFamily: 'DMSans_500Medium',
                    fontSize: 20,
                  }
                  : {
                    color: theme.text2,
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 16,
                  },
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

interface DrumRollPickerProps {
  value: Dob;
  onChange: (value: Dob) => void;
  // Optional year bounds. Defaults preserve the original birthday behaviour
  // (1940 → current year); pass future bounds for forward-looking pickers.
  minYear?: number;
  maxYear?: number;
}

// Reusable Day | Month | Year drum-roll picker. `value.month` is 1-12.
export default function DrumRollPicker({ value, onChange, minYear, maxYear }: DrumRollPickerProps) {
  const { theme } = useTheme();
  const currentYear = new Date().getFullYear();

  const minY = minYear ?? 1940;
  const maxY = maxYear ?? currentYear;

  const days = range(1, 31).map(String);
  const years = range(minY, maxY).map(String);

  return (
    <View style={[styles.container, { height: PICKER_HEIGHT }]}>
      <View style={styles.columns}>
        <WheelColumn
          items={days}
          index={value.day - 1}
          onIndexChange={(i) => onChange({ ...value, day: i + 1 })}
          flex={1}
          align="right"
        />
        <WheelColumn
          items={MONTH_LABELS}
          index={value.month - 1}
          onIndexChange={(i) => onChange({ ...value, month: i + 1 })}
          flex={1.2}
          align="center"
        />
        <WheelColumn
          items={years}
          index={value.year - minY}
          onIndexChange={(i) => onChange({ ...value, year: minY + i })}
          flex={1}
          align="left"
        />
      </View>

      {/* Centre selection band */}
      <View
        pointerEvents="none"
        style={[
          styles.centerBand,
          { borderColor: theme.goldSoft, top: PAD, height: ITEM_HEIGHT },
        ]}
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
    paddingHorizontal: spacing.xl,
    gap: spacing.base,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  centerBand: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 2,
  },
});
