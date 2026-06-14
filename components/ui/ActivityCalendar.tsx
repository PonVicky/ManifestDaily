import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { buildMonthActivity, useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function ActivityCalendar() {
  const { theme } = useTheme();
  const sessions = useAppStore((s) => s.sessions);
  const { daysInMonth, firstWeekday, activeDays, today } = useMemo(
    () => buildMonthActivity(sessions),
    [sessions],
  );

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.cellWrap}>
            <Text style={[styles.weekdayLabel, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.row}>
        {cells.map((day, i) => (
          <View key={i} style={styles.cellWrap}>
            {day !== null && (
              <View
                style={[
                  styles.cell,
                  {
                    backgroundColor: activeDays.has(day) ? theme.gold : theme.bg2,
                    borderColor: day === today ? theme.text : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    {
                      color: activeDays.has(day) ? theme.onAccent : theme.text2,
                      fontFamily: 'DMSans_400Regular',
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 9,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrap: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayLabel: {
    fontSize: 11,
  },
  cell: {
    width: '86%',
    height: '86%',
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 12,
  },
});
