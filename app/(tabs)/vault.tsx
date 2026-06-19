import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import LottieView from 'lottie-react-native';

import { useAppStore, type Vault, type Dob } from '../../store/useAppStore';
import { ThemeColors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { shadow, shadowDark } from '../../constants/tokens';
import DrumRollPicker from '../../components/ui/DrumRollPicker';
import Icon from '../../components/ui/Icon';
import Mascot from '../../components/ui/Mascot';
import ScreenTransition from '../../components/shared/ScreenTransition';
import ThemedBackground from '../../components/ui/ThemedBackground';

// Vault-specific background art (sealed-envelope sky) for the create screen,
// swapped by theme via ThemedBackground.
const VAULT_BG_LIGHT = require('../../assets/bg_vault_lite.webp');
const VAULT_BG_DARK = require('../../assets/bg_vault_dark.webp');

// Background art for the seal/open envelope screens, swapped by theme.
const VAULT_OPEN_BG_LIGHT = require('../../assets/bg_vaultopen_lite.webp');
const VAULT_OPEN_BG_DARK = require('../../assets/bg_vaultopen_dark.webp');

// ─── Types ───────────────────────────────────────────────────────────────────

type VaultState = 'locked' | 'soon' | 'ready' | 'opened';

type VaultView =
  | null
  | 'create'
  | { type: 'sealing'; title: string; message: string; unlockDate: Date }
  | { type: 'locked'; vault: Vault }
  | { type: 'unlock'; vault: Vault; reread: boolean };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function daysLeft(unlock: string): number {
  return Math.ceil((new Date(unlock).getTime() - Date.now()) / 86400000);
}

function vaultProgress(created: string, unlock: string): number {
  const now = Date.now();
  const c = new Date(created).getTime();
  const u = new Date(unlock).getTime();
  if (u <= c) return 1;
  return Math.min(1, Math.max(0, (now - c) / (u - c)));
}

function getVaultState(v: Vault): VaultState {
  if (v.opened) return 'opened';
  const days = daysLeft(v.unlock);
  if (days <= 0) return 'ready';
  if (days <= 14) return 'soon';
  return 'locked';
}

function deriveTitleFromMessage(msg: string): string {
  const words = msg.trim().split(/\s+/);
  return words.length > 5 ? words.slice(0, 5).join(' ') + '…' : words.join(' ');
}

// ─── Custom-date helpers (Dob is { day, month(1-12), year }) ──────────────────

// Last calendar day of a 1-indexed month (handles leap Februaries).
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Snap an out-of-range day to the last valid day of its month (Feb 31 → Feb 28/29).
function clampDob(d: Dob): Dob {
  const max = lastDayOfMonth(d.year, d.month);
  return d.day > max ? { ...d, day: max } : d;
}

function dobToDate(d: Dob): Date {
  return new Date(d.year, d.month - 1, d.day);
}

// Midnight tomorrow — the earliest selectable unlock date.
function tomorrowDob(): Dob {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() + 1);
  return { day: t.getDate(), month: t.getMonth() + 1, year: t.getFullYear() };
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── LockArt ─────────────────────────────────────────────────────────────────

function LockArt({
  size,
  open = false,
  pulse = false,
  theme,
}: {
  size: number;
  open?: boolean;
  pulse?: boolean;
  theme: ThemeColors;
}) {
  const pulseVal = useSharedValue(0);

  useEffect(() => {
    if (pulse) {
      pulseVal.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulseVal.value * 0.45,
    transform: [{ scale: 1 + pulseVal.value * 0.14 }],
  }));

  const cSize = size * 0.46;
  const rings = [
    { s: 1, o: 0.22 },
    { s: 0.76, o: 0.17 },
    { s: 0.54, o: 0.12 },
  ];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: theme.accentTint,
          },
          glowStyle,
        ]}
      />
      {rings.map((r, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: size * r.s,
            height: size * r.s,
            borderRadius: (size * r.s) / 2,
            borderWidth: 1,
            borderColor: `rgba(214,168,122,${r.o})`,
          }}
        />
      ))}
      <View
        style={{
          width: cSize,
          height: cSize,
          borderRadius: cSize / 2,
          backgroundColor: theme.gold,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.gold,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <Icon name={open ? 'unlock' : 'lock'} size={cSize * 0.42} color={theme.onAccent} />
      </View>
    </View>
  );
}

// ─── EnvelopeArt (body + animated flap, no internal lock badge) ───────────────

function EnvelopeArt({
  w,
  open = false,
  theme,
}: {
  w: number;
  open?: boolean;
  theme: ThemeColors;
}) {
  const h = Math.round(w * 0.66);
  const flapH = Math.round(h * 0.56);
  const r = 12; // match the body's borderRadius so the flap corners follow the curve

  const flapRot = useSharedValue(open ? 178 : 0);

  useEffect(() => {
    flapRot.value = withTiming(open ? 178 : 0, {
      duration: 900,
      easing: Easing.bezier(0.45, 0, 0.2, 1),
    });
  }, [open]);

  const flapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: flapH / 2 },
      { perspective: 700 },
      { rotateX: `${flapRot.value}deg` },
      { translateY: -(flapH / 2) },
    ],
  }));

  return (
    <View style={{ width: w, height: h }}>
      {/* Body */}
      <View
        style={{
          position: 'absolute',
          width: w,
          height: h,
          borderRadius: 12,
          backgroundColor: theme.card,
          borderWidth: 1.5,
          borderColor: theme.gold,
          overflow: 'hidden',
        }}
      >
        <Svg width={w} height={h} style={{ position: 'absolute' }}>
          <Path
            d={`M 0 0 L ${w / 2} ${h * 0.52} L ${w} 0`}
            stroke={theme.border}
            strokeWidth="1"
            fill="none"
          />
        </Svg>
      </View>

      {/* Animated flap */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, width: w, height: flapH, zIndex: 2 },
          flapStyle,
        ]}
      >
        <Svg width={w} height={flapH}>
          <Path
            d={`M ${r} 1.5 L ${w - r} 1.5 A ${r} ${r} 0 0 1 ${w - 1.5} ${r} L ${w / 2} ${flapH - 1} L 1.5 ${r} A ${r} ${r} 0 0 1 ${r} 1.5 Z`}
            fill={theme.card}
            stroke={theme.gold}
            strokeWidth="1.5"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ─── LockBadge ────────────────────────────────────────────────────────────────

function LockBadge({
  size = 54,
  open = false,
  theme,
}: {
  size?: number;
  open?: boolean;
  theme: ThemeColors;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.gold,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.gold,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 6,
      }}
    >
      <Icon name={open ? 'unlock' : 'lock'} size={size * 0.41} color={theme.onAccent} />
    </View>
  );
}

// ─── StatePill ────────────────────────────────────────────────────────────────

function StatePill({
  state,
  theme,
}: {
  state: VaultState;
  theme: ThemeColors;
}) {
  const cfg = {
    locked: { label: 'Sealed', icon: 'lock' as const, bg: theme.bg2, color: theme.text2 },
    soon: { label: 'Opens soon', icon: 'lock' as const, bg: theme.bg2, color: theme.text2 },
    ready: { label: 'Ready to open', icon: 'unlock' as const, bg: theme.gold, color: theme.onAccent },
    opened: { label: 'Opened', icon: 'mail' as const, bg: theme.card, color: theme.text },
  };
  const c = cfg[state];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: c.bg,
        borderRadius: 20,
        borderWidth: state === 'opened' ? 1 : 0,
        borderColor: theme.border,
        paddingVertical: 5,
        paddingLeft: 9,
        paddingRight: 11,
      }}
    >
      <Icon name={c.icon} size={12} color={c.color} />
      <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: c.color }}>
        {c.label}
      </Text>
    </View>
  );
}

// ─── VaultCard ────────────────────────────────────────────────────────────────

function VaultCard({
  vault,
  onPress,
  delay = 0,
  theme,
  sh,
}: {
  vault: Vault;
  onPress: () => void;
  delay?: number;
  theme: ThemeColors;
  sh: object;
}) {
  const state = getVaultState(vault);
  const progress = vaultProgress(vault.created, vault.unlock);
  const days = daysLeft(vault.unlock);

  const opacity = useSharedValue(0);
  const ty = useSharedValue(14);
  const sc = useSharedValue(0.985);
  const press = useSharedValue(1);

  useEffect(() => {
    const ease = Easing.out(Easing.ease);
    opacity.value = withDelay(delay, withTiming(1, { duration: 500, easing: ease }));
    ty.value = withDelay(delay, withTiming(0, { duration: 500, easing: ease }));
    sc.value = withDelay(delay, withTiming(1, { duration: 500, easing: ease }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { scale: sc.value * press.value }],
  }));

  const isReady = state === 'ready';
  const isOpened = state === 'opened';

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          press.value = withTiming(0.97, { duration: 100, easing: Easing.bezier(0.2, 0.7, 0.3, 1) });
        }}
        onPressOut={() => {
          press.value = withTiming(1, { duration: 150 });
        }}
        style={[
          {
            // Opened vaults read as "spent": flatter fill, no shadow, softer dashed edge.
            // Sealed vaults stay raised and intact.
            backgroundColor: isOpened ? theme.bg2 : theme.cardSolid,
            borderColor: isOpened ? theme.text2 : isReady ? theme.gold : theme.border,
            borderWidth: isOpened ? 1.5 : 1,
            borderStyle: isOpened ? 'dashed' : 'solid',
            borderRadius: 24,
            padding: 18,
            paddingBottom: 16,
            gap: 10,
          },
          !isOpened && sh,
        ]}
      >
        {/* Opaque warm gradient fill for the "ready" state (over the artwork) */}
        {isReady && (
          <LinearGradient
            colors={[theme.sel, theme.card]}
            locations={[0, 0.55]}
            start={{ x: 0.4, y: 0 }}
            end={{ x: 0.6, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            pointerEvents="none"
          />
        )}

        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: isOpened ? theme.bg : theme.accentTint,
              borderWidth: isOpened ? 1 : 0,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon
              name={isOpened ? 'mail' : 'lock'}
              size={18}
              color={isOpened ? theme.text2 : theme.gold}
            />
          </View>
          <StatePill state={state} theme={theme} />
        </View>

        {/* Title */}
        <Text
          numberOfLines={2}
          style={{
            fontFamily: 'DMSerifDisplay_400Regular',
            fontSize: 20,
            lineHeight: 25,
            color: theme.text,
          }}
        >
          {vault.title}
        </Text>

        {/* Dates */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <Icon name="calendar" size={13} color={theme.text2} />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12.5, color: theme.text2 }}>
            Sealed {formatDate(vault.created)}
          </Text>
          <Icon name="arrowR" size={11} color={theme.text2} />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12.5, color: theme.text2 }}>
            {formatDate(vault.unlock)}
          </Text>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: theme.border }} />

        {/* Footer */}
        {(state === 'locked' || state === 'soon') && (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: theme.text2 }}>
                {state === 'soon' ? 'Opens soon' : 'Time remaining'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: state === 'soon' ? theme.gold : theme.text }}>
                  {days}
                </Text>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: theme.text2 }}>
                  {' '}days
                </Text>
              </View>
            </View>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: theme.bg2, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${Math.round(progress * 100)}%`,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: theme.gold,
                }}
              />
            </View>
          </View>
        )}

        {state === 'ready' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="sparkle" size={16} fill={theme.gold} color={theme.gold} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: theme.gold }}>
              Tap to open your message
            </Text>
          </View>
        )}

        {state === 'opened' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="check" size={16} color={theme.text} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 13, color: theme.text }}>
              Opened {formatDate(vault.unlock)} · tap to reread
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyVault({
  onCreate,
  theme,
}: {
  onCreate: () => void;
  theme: ThemeColors;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 22 }}>
      <LockArt size={168} theme={theme} />
      <View
        style={{
          alignItems: 'center',
          gap: 10,
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 28,
          paddingVertical: 24,
          paddingHorizontal: 26,
          maxWidth: 330,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 2,
        }}
      >
        <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 25, color: theme.text, textAlign: 'center' }}>
          Nothing sealed yet
        </Text>
        <Text
          style={{
            fontFamily: 'DMSans_400Regular',
            fontSize: 15,
            color: theme.text2,
            textAlign: 'center',
            lineHeight: 23,
            maxWidth: 280,
          }}
        >
          Write a message, intention, or promise — and lock it away for your future self to find.
        </Text>
      </View>
      <Pressable
        onPress={onCreate}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: theme.gold,
          borderRadius: 27,
          paddingHorizontal: 28,
          height: 54,
          width: 230,
          justifyContent: 'center',
          opacity: pressed ? 0.88 : 1,
          shadowColor: theme.gold,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 22,
          elevation: 6,
        })}
      >
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: theme.onAccent }}>
          Write your first
        </Text>
        <Icon name="feather" size={16} color={theme.onAccent} fill={theme.onAccent} />
      </Pressable>
    </View>
  );
}

// ─── Ready Banner ─────────────────────────────────────────────────────────────

function ReadyBanner({ count, theme }: { count: number; theme: ThemeColors }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: theme.sel,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: theme.goldSoft,
      }}
    >
      <Icon name="sparkle" size={16} fill={theme.gold} color={theme.gold} />
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: theme.gold }}>
        {count === 1 ? '1 vault is' : `${count} vaults are`} ready to open.
      </Text>
    </View>
  );
}

// ─── Custom Date Picker Modal ─────────────────────────────────────────────────

function CustomDateModal({
  visible,
  onClose,
  onConfirm,
  theme,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  theme: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + 5;

  const [date, setDate] = useState<Dob>(tomorrowDob);

  // Reset to tomorrow each time the sheet opens.
  useEffect(() => {
    if (visible) setDate(tomorrowDob());
  }, [visible]);

  const handleChange = (d: Dob) => setDate(clampDob(d));

  const selected = dobToDate(date);
  const min = dobToDate(tomorrowDob());
  const max = new Date(min);
  max.setFullYear(max.getFullYear() + 5);

  const tooEarly = selected.getTime() < min.getTime();
  const tooLate = selected.getTime() > max.getTime();
  const valid = !tooEarly && !tooLate;

  const handleConfirm = () => {
    if (!valid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 22,
            paddingBottom: insets.bottom + 20,
            gap: 18,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  fontFamily: 'DMSerifDisplay_400Regular',
                  fontSize: 24,
                  color: theme.text,
                }}
              >
                Choose unlock date
              </Text>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: theme.text2 }}>
                When should this vault open?
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.card,
              }}
            >
              <Icon name="close" size={16} color={theme.text} />
            </Pressable>
          </View>

          {/* Wheels */}
          <DrumRollPicker
            value={date}
            onChange={handleChange}
            minYear={currentYear}
            maxYear={maxYear}
          />

          {/* Selected-date preview / validation note */}
          {valid ? (
            <Text
              style={{
                fontFamily: 'DMSerifDisplay_400Regular_Italic',
                fontSize: 19,
                color: theme.gold,
                textAlign: 'center',
              }}
            >
              Your vault opens on {formatLongDate(selected)}
            </Text>
          ) : (
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 14,
                color: theme.orange,
                textAlign: 'center',
              }}
            >
              {tooEarly
                ? 'Pick a date from tomorrow onward.'
                : 'Pick a date within the next 5 years.'}
            </Text>
          )}

          {/* Confirm */}
          <Pressable
            onPress={handleConfirm}
            disabled={!valid}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.gold,
              borderRadius: 18,
              paddingVertical: 18,
              opacity: !valid ? 0.45 : pressed ? 0.9 : 1,
              shadowColor: theme.gold,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 6,
            })}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: theme.onAccent }}>
              Confirm Date
            </Text>
            <Icon name="check" size={17} color={theme.onAccent} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Create Vault Modal ────────────────────────────────────────────────────────

const DURATION_OPTS = [
  { label: '1 Month', months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '1 Year', months: 12 },
];

function CreateVaultModal({
  visible,
  onClose,
  onSeal,
  theme,
  darkMode,
}: {
  visible: boolean;
  onClose: () => void;
  onSeal: (message: string, title: string, unlockDate: Date) => void;
  theme: ThemeColors;
  darkMode: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [months, setMonths] = useState<number | null>(3);
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sh = darkMode ? shadowDark.md : shadow.md;

  // A custom date overrides the preset duration; otherwise fall back to months.
  const unlockDate = customDate ?? addMonths(new Date(), months ?? 3);
  const canSeal = message.trim().length > 0;

  const handleSeal = () => {
    if (!canSeal) return;
    const title = deriveTitleFromMessage(message);
    onSeal(message.trim(), title, unlockDate);
    setMessage('');
    setMonths(3);
    setCustomDate(null);
  };

  const selectPreset = (m: number) => {
    setMonths(m);
    setCustomDate(null);
  };

  const handleCustomConfirm = (date: Date) => {
    setCustomDate(date);
    setMonths(null);
    setPickerOpen(false);
  };

  // Dev-only shortcut: seal a vault that unlocks in 10 seconds so the full
  // seal → wait → unlock → reveal flow can be tested without waiting months.
  // __DEV__ is a React Native built-in that is always false in release builds.
  const handleDevSeal = () => {
    const msg = message.trim() || 'Dear future me — this is a dev test.';
    onSeal(msg, deriveTitleFromMessage(msg), new Date(Date.now() + 10000));
    setMessage('');
    setMonths(3);
    setCustomDate(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ThemedBackground lightSource={VAULT_BG_LIGHT} darkSource={VAULT_BG_DARK}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            paddingBottom: 120,
            gap: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.card,
              }}
            >
              <Icon name="chevL" size={20} color={theme.text} />
            </Pressable>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: theme.text }}>
              New vault
            </Text>
          </View>

          {/* Prompt */}
          <Text
            style={{
              fontFamily: 'DMSerifDisplay_400Regular_Italic',
              fontSize: 26,
              lineHeight: 33,
              color: theme.text,
            }}
          >
            What do you want to send to your future self?
          </Text>

          {/* Textarea card */}
          <View
            style={[
              {
                backgroundColor: theme.card,
                borderRadius: 22,
                padding: 18,
                minHeight: 180,
                borderWidth: 1,
                borderColor: theme.border,
              },
              sh,
            ]}
          >
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Dear future me…"
              placeholderTextColor={theme.text2}
              multiline
              style={{
                fontFamily: 'DMSerifDisplay_400Regular_Italic',
                fontSize: 19,
                lineHeight: 28,
                color: theme.text,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
            />
            <Text
              style={{
                fontFamily: 'DMSans_400Regular',
                fontSize: 12,
                color: theme.text2,
                textAlign: 'right',
                marginTop: 8,
              }}
            >
              {message.length} characters · sealed once you confirm
            </Text>
          </View>

          {/* Duration */}
          <View style={{ gap: 12 }}>
            <Text
              style={{
                fontFamily: 'DMSans_500Medium',
                fontSize: 12,
                letterSpacing: 1.5,
                color: theme.text2,
              }}
            >
              OPEN THIS IN
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
              {DURATION_OPTS.map((opt) => {
                const sel = !customDate && months === opt.months;
                return (
                  <Pressable
                    key={opt.months}
                    onPress={() => selectPreset(opt.months)}
                    style={{
                      flex: 1,
                      minWidth: '28%',
                      borderRadius: 15,
                      borderWidth: 1,
                      paddingVertical: 13,
                      alignItems: 'center',
                      backgroundColor: sel ? theme.accentTint : theme.card,
                      borderColor: sel ? theme.gold : theme.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: sel ? 'DMSans_500Medium' : 'DMSans_400Regular',
                        fontSize: 14.5,
                        color: sel ? theme.gold : theme.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setPickerOpen(true)}
                style={{
                  flex: 1,
                  minWidth: '28%',
                  flexDirection: 'row',
                  gap: 6,
                  borderRadius: 15,
                  borderWidth: 1,
                  paddingVertical: 13,
                  paddingHorizontal: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: customDate ? theme.accentTint : theme.card,
                  borderColor: customDate ? theme.gold : theme.border,
                }}
              >
                <Icon name="calendar" size={14} color={customDate ? theme.gold : theme.text2} />
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: customDate ? 'DMSans_500Medium' : 'DMSans_400Regular',
                    fontSize: 14.5,
                    color: customDate ? theme.gold : theme.text2,
                  }}
                >
                  {customDate ? `Custom · ${formatDate(customDate)}` : 'Custom'}
                </Text>
              </Pressable>
            </View>

            {/* Dev-only: instant 10-second unlock for testing the full flow.
                Rendered as a subtle footnote and never shown in release builds. */}
            {__DEV__ && (
              <Pressable onPress={handleDevSeal} style={{ alignSelf: 'center', paddingVertical: 2 }}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: theme.text2 }}>
                  ⚡ Open in 10 seconds (dev only)
                </Text>
              </Pressable>
            )}
          </View>

          {/* Live unlock date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="lock" size={13} color={theme.gold} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13.5, color: theme.text2 }}>
              Opens{' '}
              <Text style={{ fontFamily: 'DMSans_500Medium', color: theme.text }}>{formatDate(unlockDate)}</Text>
            </Text>
          </View>
        </ScrollView>

        {/* Seal button */}
        <View style={{ position: 'absolute', bottom: insets.bottom + 16, left: 24, right: 24 }}>
          <Pressable
            onPress={handleSeal}
            disabled={!canSeal}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: theme.gold,
              borderRadius: 18,
              paddingVertical: 18,
              opacity: !canSeal ? 0.45 : pressed ? 0.9 : 1,
              shadowColor: theme.gold,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 6,
            })}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: theme.onAccent }}>
              Seal Vault
            </Text>
            <Icon name="lock" size={17} color={theme.onAccent} />
          </Pressable>
        </View>

        <CustomDateModal
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onConfirm={handleCustomConfirm}
          theme={theme}
        />
      </ThemedBackground>
    </Modal>
  );
}

// ─── Sealing Modal ────────────────────────────────────────────────────────────

function SealingModal({
  visible,
  message,
  unlockDate,
  onDone,
  theme,
}: {
  visible: boolean;
  message: string;
  unlockDate: Date;
  onDone: () => void;
  theme: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const [isFinished, setIsFinished] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const firedRef = useRef(false);

  const captionOp = useSharedValue(0);
  const btnOp = useSharedValue(0);
  const btnTy = useSharedValue(10);

  const reset = () => {
    setIsFinished(false);
    firedRef.current = false;
    captionOp.value = 0; btnOp.value = 0; btnTy.value = 10;
  };

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  // The clip's only layer ("mail envelope") cuts out at frame 90 of 150 — frames
  // 90–150 are blank. Freeze on the last visible frame (89) so the sealed envelope
  // stays on screen, and trip the freeze just before it vanishes (~2.93s @ 30fps).
  const FREEZE_PROGRESS = 89 / 150;
  useEffect(() => {
    if (!visible) return;

    const stopTime = 3400;
    const timer = setTimeout(() => {
      lottieRef.current?.pause();
      handleSealingDone();
    }, stopTime);

    return () => clearTimeout(timer);
  }, [visible]);

  // Lottie envelope-seal animation finished: same completion as before —
  // fire the seal haptic and reveal the caption + button. Guarded so the
  // pause-timer and onAnimationFinish can't double-fire it.
  const handleSealingDone = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setIsFinished(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captionOp.value = withTiming(1, { duration: 600 });
    btnOp.value = withDelay(200, withTiming(1, { duration: 600 }));
    btnTy.value = withDelay(200, withTiming(0, { duration: 600 }));
  };

  const captionStyle = useAnimatedStyle(() => ({ opacity: captionOp.value }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOp.value,
    transform: [{ translateY: btnTy.value }],
  }));

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <ThemedBackground lightSource={VAULT_OPEN_BG_LIGHT} darkSource={VAULT_OPEN_BG_DARK}>
        {/* Glow — centered on the envelope stage (stage center: top 18% + 110;
            the 380 circle is shifted up 190 then the stage offset to sit behind it). */}
        <View
          style={{
            position: 'absolute',
            top: '15%',
            alignSelf: 'center',
            width: 380,
            height: 380,
            borderRadius: 190,
            backgroundColor: theme.accentTint,
            opacity: 0.6,
            transform: [{ translateY: -80 }],
          }}
        />

        {/* Stage: Lottie envelope-seal animation (centered, upper half) */}
        <View
          style={{
            position: 'absolute',
            top: '10%',
            left: 0,
            right: 0,
            height: 220,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {visible && (
            <LottieView
              ref={lottieRef}
              source={require('../../assets/animations/envelope-seal.json')}
              autoPlay
              loop={false}
              speed={1}
              style={{ width: 280, height: 280 }}
              progress={isFinished ? FREEZE_PROGRESS : undefined}
              onAnimationFinish={handleSealingDone}
            />
          )}
        </View>

        {/* Caption (step 4) */}
        <Animated.View
          style={[
            captionStyle,
            {
              position: 'absolute',
              top: '58%',
              left: 24,
              right: 24,
              alignItems: 'center',
              gap: 16,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: 'DMSerifDisplay_400Regular_Italic',
              fontSize: 27,
              lineHeight: 34,
              color: theme.text,
              textAlign: 'center',
            }}
          >
            Your message has been sealed.
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.card,
              borderRadius: 18,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Icon name="lock" size={13} color={theme.text2} />
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: theme.text2 }}>
              Opens {formatDate(unlockDate)}
            </Text>
          </View>
        </Animated.View>

        {/* Return button */}
        <Animated.View
          style={[btnStyle, { position: 'absolute', bottom: insets.bottom + 24, left: 24, right: 24 }]}
        >
          <Pressable
            onPress={onDone}
            style={({ pressed }) => ({
              backgroundColor: theme.gold,
              borderRadius: 18,
              paddingVertical: 18,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.9 : 1,
              shadowColor: theme.gold,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 6,
            })}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: theme.onAccent }}>
              Return to the Vault
            </Text>
          </Pressable>
        </Animated.View>
      </ThemedBackground>
    </Modal>
  );
}

// ─── Locked Detail Modal ──────────────────────────────────────────────────────

function LockedDetailModal({
  vault,
  visible,
  onClose,
  theme,
  darkMode,
}: {
  vault: Vault | null;
  visible: boolean;
  onClose: () => void;
  theme: ThemeColors;
  darkMode: boolean;
}) {
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.md : shadow.md;
  if (!vault) return null;

  const days = daysLeft(vault.unlock);
  const state = getVaultState(vault);

  const metaRows = [
    { icon: 'feather' as const, label: 'Sealed', value: formatDate(vault.created), accent: false },
    { icon: 'calendar' as const, label: 'Opens', value: formatDate(vault.unlock), accent: false },
    { icon: 'clock' as const, label: 'Remaining', value: `${days} days`, accent: state === 'soon' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        {/* Glow — centered behind the lock art. The lock's center sits at
            insets.top + 16 (top pad) + 40 (header) + 26 (gap) + 75 (half of the
            150-tall LockArt); offset the 280 circle up by half to sit behind it. */}
        <View
          style={{
            position: 'absolute',
            top: insets.top + 17,
            left: '5%',
            width: '90%',
            height: 280,
            borderRadius: 140,
            backgroundColor: theme.accentTint,
            opacity: 0.5,
          }}
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: insets.top + 16,
            paddingBottom: 100,
            gap: 26,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.card,
              }}
            >
              <Icon name="chevL" size={20} color={theme.text} />
            </Pressable>
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: theme.text }}>
              Sealed vault
            </Text>
          </View>

          <LockArt size={150} open={false} pulse={false} theme={theme} />

          <Text
            style={{
              fontFamily: 'DMSerifDisplay_400Regular',
              fontSize: 24,
              lineHeight: 30,
              color: theme.text,
              textAlign: 'center',
            }}
          >
            {vault.title}
          </Text>

          {/* Hidden message card */}
          <View
            style={[
              {
                width: '100%',
                borderRadius: 20,
                padding: 20,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: 'hidden',
                minHeight: 100,
              },
              sh,
            ]}
          >
            <View style={{ gap: 10, opacity: 0.45 }}>
              {[92, 100, 84, 70].map((w, i) => (
                <View
                  key={i}
                  style={{
                    height: 12,
                    width: `${w}%`,
                    borderRadius: 6,
                    backgroundColor: theme.border,
                  }}
                />
              ))}
            </View>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: darkMode ? 'rgba(41,32,26,0.75)' : 'rgba(255,253,249,0.75)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="lock" size={14} color={theme.text2} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: theme.text2 }}>
                  Hidden until it opens
                </Text>
              </View>
            </View>
          </View>

          {/* Meta card */}
          <View
            style={[
              {
                width: '100%',
                borderRadius: 20,
                backgroundColor: theme.card,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: 'hidden',
              },
              sh,
            ]}
          >
            {metaRows.map((row, i) => (
              <View key={i}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: theme.bg2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name={row.icon} size={16} color={theme.text2} />
                  </View>
                  <Text
                    style={{ flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14.5, color: theme.text2 }}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'DMSans_500Medium',
                      fontSize: 15,
                      color: row.accent ? theme.gold : theme.text,
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
                {i < metaRows.length - 1 && (
                  <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 62 }} />
                )}
              </View>
            ))}
          </View>

          {/* Footer note */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 4 }}>
            <Icon name="lock" size={13} color={theme.text2} />
            <Text
              style={{
                flex: 1,
                fontFamily: 'DMSans_400Regular',
                fontSize: 13,
                color: theme.text2,
                textAlign: 'center',
                lineHeight: 19,
              }}
            >
              This vault can't be edited, deleted, or opened until {formatDate(vault.unlock)}.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Animated Word ────────────────────────────────────────────────────────────

function AnimatedWord({
  word,
  delay,
  theme,
  haptic = false,
}: {
  word: string;
  delay: number;
  theme: ThemeColors;
  haptic?: boolean;
}) {
  const op = useSharedValue(0);
  const ty = useSharedValue(10);

  useEffect(() => {
    const ease = Easing.bezier(0.22, 0.7, 0.3, 1);
    op.value = withDelay(delay, withTiming(1, { duration: 600, easing: ease }));
    ty.value = withDelay(delay, withTiming(0, { duration: 600, easing: ease }));

    // Gentle tick as the word lands, building a soft rhythm while the message
    // types itself onto the screen.
    if (!haptic) return;
    const t = setTimeout(() => Haptics.selectionAsync(), delay);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.Text
      style={[
        style,
        { fontFamily: 'DMSerifDisplay_400Regular_Italic', fontSize: 23, lineHeight: 32, color: theme.text },
      ]}
    >
      {word}{' '}
    </Animated.Text>
  );
}

// ─── Unlock Celebration Modal ─────────────────────────────────────────────────

function UnlockModal({
  vault,
  visible,
  reread,
  onClose,
  onKeep,
  onDelete,
  theme,
  darkMode,
}: {
  vault: Vault | null;
  visible: boolean;
  reread: boolean;
  onClose: () => void;
  onKeep: () => void;
  onDelete: () => void;
  theme: ThemeColors;
  darkMode: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [opened, setOpened] = useState(reread);
  const lottieRef = useRef<LottieView>(null);

  // The shared envelope clip (150 frames @ 30fps) opens its flap and lifts the
  // letter out around frame ~45, then re-seals later. Freeze on that open frame.
  const OPEN_PROGRESS = 45 / 150;
  // How much the envelope + glow shrink to once the message is revealed.
  const ART_OPENED_SCALE = 0.7;

  const eyebrowOp = useSharedValue(reread ? 1 : 0);
  const contentOp = useSharedValue(reread ? 1 : 0);
  const datOp = useSharedValue(reread ? 1 : 0);
  const btnOp = useSharedValue(reread ? 1 : 0);
  const btnTy = useSharedValue(reread ? 0 : 10);
  // Envelope + glow shrink once the message is revealed so the letter gives the
  // text more room (full size while opening, compact once opened).
  const artScale = useSharedValue(reread ? ART_OPENED_SCALE : 1);

  const revealMessage = () => {
    artScale.value = withTiming(ART_OPENED_SCALE, { duration: 600, easing: Easing.out(Easing.ease) });
    eyebrowOp.value = withTiming(1, { duration: 700 });
    contentOp.value = withDelay(200, withTiming(1, { duration: 500 }));
    datOp.value = withDelay(400, withTiming(1, { duration: 500 }));
    btnOp.value = withDelay(600, withTiming(1, { duration: 600 }));
    btnTy.value = withDelay(600, withTiming(0, { duration: 600 }));
  };

  const reset = () => {
    setOpened(false);
    eyebrowOp.value = 0; contentOp.value = 0; datOp.value = 0;
    btnOp.value = 0; btnTy.value = 10;
    artScale.value = 1;
  };

  // Deleting an opened message is permanent — confirm before destroying it.
  const confirmDelete = () => {
    Alert.alert(
      'Delete this message?',
      'This message from your past self will be permanently removed. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete();
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (!visible) { if (!reread) reset(); return; }
    if (reread) {
      // Re-reading an already-opened vault: show the message immediately,
      // no entrance animation (and restore opacities a prior reset may have zeroed).
      setOpened(true);
      eyebrowOp.value = 1; contentOp.value = 1; datOp.value = 1;
      btnOp.value = 1; btnTy.value = 0;
      artScale.value = ART_OPENED_SCALE;
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Let the envelope play open, then pause on the open frame and reveal.
    const stopTime = 1500; // ~frame 45 @ 30fps
    const timer = setTimeout(() => {
      lottieRef.current?.pause();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setOpened(true);
      revealMessage();
    }, stopTime);

    return () => clearTimeout(timer);
  }, [visible]);

  const eyebrowStyle = useAnimatedStyle(() => ({ opacity: eyebrowOp.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOp.value }));
  const datStyle = useAnimatedStyle(() => ({ opacity: datOp.value }));
  const artStyle = useAnimatedStyle(() => ({ transform: [{ scale: artScale.value }] }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOp.value,
    transform: [{ translateY: btnTy.value }],
  }));

  if (!vault) return null;

  const words = vault.message.split(/\s+/);

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <ThemedBackground lightSource={VAULT_OPEN_BG_LIGHT} darkSource={VAULT_OPEN_BG_DARK}>
        {/* Glow — centered behind the envelope */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: insets.top - 10,
              alignSelf: 'center',
              width: 380,
              height: 380,
              borderRadius: 190,
              backgroundColor: theme.accentTint,
              opacity: opened ? 0.7 : 0.45,
            },
            artStyle,
          ]}
        />

        {/* Close button (after open) — the message has been seen, so mark it read
            (same as "Keep") instead of just dismissing, otherwise it stays "ready". */}
        {opened && (
          <Pressable
            onPress={onKeep}
            style={{
              position: 'absolute',
              top: insets.top + 16,
              right: 20,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.card,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={16} color={theme.text} />
          </Pressable>
        )}

        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 40,
            paddingHorizontal: 24,
            paddingBottom: insets.bottom + 200,
            alignItems: 'center',
            gap: 20,
            minHeight: '100%',
            justifyContent: 'flex-start',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Envelope (Lottie) — plays open, then freezes on the open frame.
              Shrinks (via artStyle) once opened; marginBottom tightens the gap
              the scale leaves so the message sits closer. */}
          <Animated.View
            style={[
              {
                width: 280,
                height: 280,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: opened ? -60 : 0,
              },
              artStyle,
            ]}
          >
            {visible && (
              <LottieView
                ref={lottieRef}
                source={require('../../assets/animations/envelope-seal.json')}
                autoPlay={!reread}
                loop={false}
                speed={1}
                style={{ width: 280, height: 280 }}
                progress={opened ? OPEN_PROGRESS : undefined}
              />
            )}
          </Animated.View>

          {!opened ? (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: theme.text2 }}>
              Opening…
            </Text>
          ) : (
            /* Reveal: the message below the opened envelope */
            <View style={{ alignItems: 'center', width: '100%', gap: 20 }}>
              <Animated.View style={eyebrowStyle}>
                <Text
                  style={{
                    fontFamily: 'DMSans_500Medium',
                    fontSize: 11,
                    letterSpacing: 2.5,
                    color: theme.gold,
                    textAlign: 'center',
                  }}
                >
                  A MESSAGE FROM YOUR PAST SELF
                </Text>
              </Animated.View>

              <Animated.View style={[contentStyle, { width: '100%' }]}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {words.map((w, i) => (
                    <AnimatedWord key={i} word={w} delay={i * 50} theme={theme} haptic={i % 2 === 0} />
                  ))}
                </View>
              </Animated.View>

              <Animated.View style={datStyle}>
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: theme.text2 }}>
                  Sealed {formatDate(vault.created)}
                </Text>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* Keep / Delete buttons (after open) — anchored bar with a solid backing
            and a soft top fade so long messages dissolve out instead of bleeding
            through the buttons. */}
        {opened && (
          <Animated.View
            style={[btnStyle, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}
          >
            {/* Fade from transparent into the page bg, sitting just above the bar */}
            <LinearGradient
              colors={[`${theme.bg}00`, theme.bg]}
              style={{ position: 'absolute', top: -40, left: 0, right: 0, height: 40 }}
              pointerEvents="none"
            />
            <View
              style={{
                backgroundColor: theme.bg,
                paddingHorizontal: 24,
                paddingTop: 6,
                paddingBottom: insets.bottom + 20,
                gap: 6,
              }}
            >
              <Pressable
                onPress={onKeep}
                style={({ pressed }) => ({
                  backgroundColor: theme.gold,
                  borderRadius: 18,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: theme.gold,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 20,
                  elevation: 6,
                })}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: theme.onAccent }}>
                  Keep in my Vault
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  paddingVertical: 12,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Icon name="close" size={15} color={theme.orange} />
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14.5, color: theme.orange }}>
                  Delete forever
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ThemedBackground>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VaultScreen() {
  const { theme, darkMode } = useTheme();
  const vaults = useAppStore((s) => s.vaults);
  const addVault = useAppStore((s) => s.addVault);
  const markVaultOpened = useAppStore((s) => s.markVaultOpened);
  const deleteVault = useAppStore((s) => s.deleteVault);
  const { requestPermissions, scheduleVaultUnlock, cancelVaultUnlock } = useNotifications();
  const insets = useSafeAreaInsets();
  const sh = darkMode ? shadowDark.md : shadow.md;

  const [vaultView, setVaultView] = useState<VaultView>(null);

  // Auto-open first ready vault on mount
  useEffect(() => {
    const ready = vaults.find((v) => getVaultState(v) === 'ready');
    if (ready) {
      const t = setTimeout(() => setVaultView({ type: 'unlock', vault: ready, reread: false }), 900);
      return () => clearTimeout(t);
    }
  }, []);

  // Dev-only: while testing the 10-second unlock shortcut, poll for a vault that
  // has just flipped to "ready" and auto-open its reveal modal. Each vault is
  // auto-opened at most once per session (tracked here) so dismissing the modal
  // without tapping "Keep" doesn't reopen it on the next tick. Gated behind
  // __DEV__ so production runtime behaviour is unchanged.
  const autoOpenedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!__DEV__) return;
    const interval = setInterval(() => {
      setVaultView((current) => {
        if (current !== null) return current; // never interrupt an open modal
        const ready = useAppStore
          .getState()
          .vaults.find((v) => getVaultState(v) === 'ready' && !autoOpenedRef.current.has(v.id));
        if (!ready) return current;
        autoOpenedRef.current.add(ready.id);
        return { type: 'unlock', vault: ready, reread: false };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const readyCount = vaults.filter((v) => getVaultState(v) === 'ready').length;

  const handleCardPress = (vault: Vault) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const state = getVaultState(vault);
    if (state === 'locked' || state === 'soon') {
      setVaultView({ type: 'locked', vault });
    } else {
      setVaultView({ type: 'unlock', vault, reread: state === 'opened' });
    }
  };

  const handleSeal = (message: string, title: string, unlockDate: Date) => {
    setVaultView({ type: 'sealing', title, message, unlockDate });
  };

  const handleSealingDone = async () => {
    if (vaultView && typeof vaultView === 'object' && vaultView.type === 'sealing') {
      const { title, message, unlockDate } = vaultView;

      // Schedule one "vault is ready" notification for the exact unlock moment,
      // then store its id on the vault so it can be cancelled when opened.
      let notificationId: string | undefined;
      try {
        if ((await requestPermissions()).granted) {
          notificationId = await scheduleVaultUnlock(unlockDate);
        }
      } catch { }

      addVault({
        title,
        message,
        created: new Date().toISOString(),
        unlock: unlockDate.toISOString(),
        notificationId,
      });
    }
    setVaultView(null);
  };

  const handleKeep = () => {
    if (vaultView && typeof vaultView === 'object' && vaultView.type === 'unlock' && !vaultView.reread) {
      markVaultOpened(vaultView.vault.id);
      // The user has seen it — drop the pending "ready" notification.
      cancelVaultUnlock(vaultView.vault.notificationId);
    }
    setVaultView(null);
  };

  const handleDelete = () => {
    if (vaultView && typeof vaultView === 'object' && vaultView.type === 'unlock') {
      // Cancel any still-pending "ready" notification before removing the vault.
      cancelVaultUnlock(vaultView.vault.notificationId);
      deleteVault(vaultView.vault.id);
    }
    setVaultView(null);
  };

  const sealingView =
    vaultView && typeof vaultView === 'object' && vaultView.type === 'sealing' ? vaultView : null;
  const lockedView =
    vaultView && typeof vaultView === 'object' && vaultView.type === 'locked' ? vaultView : null;
  const unlockView =
    vaultView && typeof vaultView === 'object' && vaultView.type === 'unlock' ? vaultView : null;

  return (
    <ScreenTransition>
      <ThemedBackground>
        {vaults.length === 0 ? (
          /* Empty state */
          <View style={{ flex: 1, paddingTop: insets.top + 20 }}>
            <View style={{ paddingHorizontal: 24 }}>
              <Text
                style={{
                  fontFamily: 'DMSerifDisplay_400Regular',
                  fontSize: 34,
                  color: theme.text,
                  letterSpacing: -0.5,
                }}
              >
                The Vault
              </Text>
            </View>
            <EmptyVault onCreate={() => setVaultView('create')} theme={theme} />
          </View>
        ) : (
          /* List */
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 100,
              gap: 13,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 4,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'DMSerifDisplay_400Regular',
                    fontSize: 34,
                    color: theme.text,
                    letterSpacing: -0.5,
                  }}
                >
                  The Vault
                </Text>
                <Text
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 15,
                    color: theme.text,
                    marginTop: 4,
                    maxWidth: 260,
                    lineHeight: 21,
                    textShadowColor: theme.bg,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 4,
                  }}
                >
                  Sealed messages to the person you're becoming.
                </Text>
              </View>
              <Mascot state="rest" size={64} opacity={0.8} />
            </View>

            {readyCount > 0 && <ReadyBanner count={readyCount} theme={theme} />}

            {vaults.map((vault, i) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onPress={() => handleCardPress(vault)}
                delay={i * 60}
                theme={theme}
                sh={sh}
              />
            ))}
          </ScrollView>
        )}

        {/* FAB — only when there are vaults */}
        {vaults.length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setVaultView('create');
            }}
            style={({ pressed }) => ({
              position: 'absolute',
              right: 22,
              // Tab bar is a fixed 88px tall (it absorbs the safe-area inset
              // internally), so anchor a fixed gap above it — consistent on every
              // device rather than drifting with insets.bottom.
              bottom: 88 + 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.gold,
              borderRadius: 27,
              paddingHorizontal: 22,
              height: 54,
              opacity: pressed ? 0.88 : 1,
              shadowColor: theme.gold,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 28,
              elevation: 8,
            })}
          >
            <Icon name="feather" size={17} color={theme.onAccent} fill={theme.onAccent} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 15, color: theme.onAccent }}>
              New vault
            </Text>
          </Pressable>
        )}

        {/* Modals */}
        <CreateVaultModal
          visible={vaultView === 'create'}
          onClose={() => setVaultView(null)}
          onSeal={handleSeal}
          theme={theme}
          darkMode={darkMode}
        />
        <SealingModal
          visible={!!sealingView}
          message={sealingView?.message ?? ''}
          unlockDate={sealingView?.unlockDate ?? new Date()}
          onDone={handleSealingDone}
          theme={theme}
        />
        <LockedDetailModal
          vault={lockedView?.vault ?? null}
          visible={!!lockedView}
          onClose={() => setVaultView(null)}
          theme={theme}
          darkMode={darkMode}
        />
        <UnlockModal
          vault={unlockView?.vault ?? null}
          visible={!!unlockView}
          reread={unlockView?.reread ?? false}
          onClose={() => setVaultView(null)}
          onKeep={handleKeep}
          onDelete={handleDelete}
          theme={theme}
          darkMode={darkMode}
        />
      </ThemedBackground>
    </ScreenTransition>
  );
}

