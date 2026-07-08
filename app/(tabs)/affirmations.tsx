import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, NativeScrollEvent, LayoutChangeEvent, Share, StatusBar, Dimensions, ImageBackground, TouchableOpacity, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { affirmationPool, goalIdForAffirmation, GoalId } from '../../constants/data';
import AffSlide from '../../components/ui/AffSlide';
import Icon from '../../components/ui/Icon';

const { height: screenHeight } = Dimensions.get('window');

// How many slide positions on either side of the active slide get their full
// content mounted; everything farther out renders as an empty spacer until
// the user scrolls near it. Keeps a comfortable buffer ahead of fast swipes.
const ACTIVE_WINDOW = 2;

type Filter = 'all' | 'liked' | 'custom';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'liked', label: 'Liked' },
  { key: 'custom', label: 'Custom' },
];

// One slide in the feed. `goalId` carries the ✦ category tag; custom slides
// supply it directly since they can't be reverse-looked-up from the pool.
interface FeedItem {
  key: string;
  // Store id, present only for custom affirmations (used for edit/delete).
  id?: string;
  text: string;
  goalId: GoalId | null;
  isCustom: boolean;
}

export default function AffirmationsScreen() {
  const router = useRouter();
  const { theme, darkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const savedAffirmations = useAppStore((s) => s.savedAffirmations);
  const customAffirmations = useAppStore((s) => s.customAffirmations);
  const toggleSaveAffirmation = useAppStore((s) => s.toggleSaveAffirmation);
  const deleteCustomAffirmation = useAppStore((s) => s.deleteCustomAffirmation);
  const lastReflectFilter = useAppStore((s) => s.lastReflectFilter);
  const lastReflectKey = useAppStore((s) => s.lastReflectKey);
  const setLastReflectPosition = useAppStore((s) => s.setLastReflectPosition);

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  // Last slide we ticked a haptic for, so each new slide buzzes exactly once.
  const lastIndex = useRef(0);
  // Guards the one-time jump onto the first real slide after layout.
  const didInit = useRef(false);
  // Guards the one-time restore of the last-viewed slide from a previous app
  // session. Only fires on the feed's first successful layout of the whole
  // component lifetime — manual filter switches after that still land on the
  // first slide, matching the existing behavior below.
  const restoredPosition = useRef(false);
  // Each slide is exactly the feed's visible viewport tall (measured on layout),
  // so content centers and the list snaps cleanly with no leftover tail at the
  // bottom. `slideHRef` mirrors the state for use inside scroll callbacks.
  const [slideH, setSlideH] = useState(screenHeight);
  const slideHRef = useRef(screenHeight);

  // Built-in affirmations for the user's goals, tagged with their category.
  const builtinItems = useMemo<FeedItem[]>(
    () =>
      affirmationPool(selectedGoals).map((text) => ({
        key: `b-${text}`,
        text,
        goalId: goalIdForAffirmation(text) ?? null,
        isCustom: false,
      })),
    [selectedGoals],
  );

  // User-authored affirmations (newest first, as stored).
  const customItems = useMemo<FeedItem[]>(
    () =>
      customAffirmations.map((c) => ({
        key: `c-${c.id}`,
        id: c.id,
        text: c.text,
        goalId: c.category,
        isCustom: true,
      })),
    [customAffirmations],
  );

  // "All" leads with the user's custom affirmations so they're easy to find.
  const allItems = useMemo<FeedItem[]>(
    () => [...customItems, ...builtinItems],
    [customItems, builtinItems],
  );

  const items = useMemo<FeedItem[]>(() => {
    if (filter === 'custom') return customItems;
    if (filter === 'liked') return allItems.filter((it) => savedAffirmations.includes(it.text));
    return allItems;
  }, [filter, allItems, customItems, savedAffirmations]);

  const total = items.length;

  // For the infinite loop we render [lastClone, ...items, firstClone].
  // The clones let us silently teleport across the seam so scrolling never ends.
  // Only the endless "All" feed loops; Liked/Custom are finite, curated sets and
  // scroll as a plain paged list that stops at the ends.
  const loop = filter === 'all' && total > 1;
  const loopedItems = loop ? [items[total - 1], ...items, items[0]] : items;

  // Maps a position in the looped list back to the real item index.
  const toRealIndex = (loopedIndex: number) =>
    loop ? (((loopedIndex - 1) % total) + total) % total : loopedIndex;

  // When the active filter (or its length) changes, the feed remounts via its
  // `key`; reset the init guard + active slide so the new list starts fresh on
  // its first real slide.
  useEffect(() => {
    didInit.current = false;
    lastIndex.current = 0;
    setActiveIndex(0);
  }, [filter, total]);

  // For the looped "All" feed, jump onto the first real slide (past the leading
  // clone). Runs once the viewport height is known and the content is laid out.
  const initLoop = useCallback(() => {
    if (loop && !didInit.current && slideHRef.current > 0) {
      didInit.current = true;
      scrollViewRef.current?.scrollTo({ y: slideHRef.current, animated: false });
    }
  }, [loop]);

  // Jumps to the slide the user was reading last time they had the app open,
  // if it's still in the current (matching) filter's list. Runs once per app
  // session, after initLoop so it wins the final scroll position.
  const applyRestoredPosition = useCallback(() => {
    if (restoredPosition.current || slideHRef.current <= 0) return;
    restoredPosition.current = true;
    if (lastReflectFilter !== filter) return;
    const idx = items.findIndex((it) => it.key === lastReflectKey);
    if (idx <= 0) return;
    lastIndex.current = idx;
    setActiveIndex(idx);
    const y = loop ? (idx + 1) * slideHRef.current : idx * slideHRef.current;
    scrollViewRef.current?.scrollTo({ y, animated: false });
  }, [filter, items, loop, lastReflectFilter, lastReflectKey]);

  // Measure the feed's visible height so each slide is exactly one page tall.
  const handleFeedLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - slideHRef.current) > 0.5) {
      slideHRef.current = h;
      setSlideH(h);
    }
    initLoop();
    applyRestoredPosition();
  }, [initLoop, applyRestoredPosition]);

  // Tracks the slide continuously while scrolling: brightens the incoming slide
  // smoothly and ticks a haptic the moment you cross into a new affirmation.
  const handleScroll = useCallback((event: NativeScrollEvent) => {
    const realIndex = toRealIndex(Math.round(event.contentOffset.y / slideHRef.current));
    if (realIndex !== lastIndex.current) {
      lastIndex.current = realIndex;
      setActiveIndex(realIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const item = items[realIndex];
      if (item) setLastReflectPosition(filter, item.key);
    }
  }, [total, loop, items, filter, setLastReflectPosition]);

  // When a swipe settles on a cloned edge slide, jump (without animation) to the
  // matching real slide so the next swipe continues seamlessly in either direction.
  const handleMomentumEnd = useCallback((event: NativeScrollEvent) => {
    if (!loop) return;
    const h = slideHRef.current;
    const loopedIndex = Math.round(event.contentOffset.y / h);
    if (loopedIndex === 0) {
      scrollViewRef.current?.scrollTo({ y: total * h, animated: false });
    } else if (loopedIndex === total + 1) {
      scrollViewRef.current?.scrollTo({ y: h, animated: false });
    }
  }, [total, loop]);

  // Once content is measured, start on the first real slide (past the leading
  // clone) so the user can immediately scroll up into the loop as well.
  const handleContentSizeChange = useCallback(() => {
    initLoop();
    applyRestoredPosition();
  }, [initLoop, applyRestoredPosition]);

  const handleSave = useCallback((text: string) => {
    toggleSaveAffirmation(text);
  }, [toggleSaveAffirmation]);

  const handleShare = useCallback(async (text: string) => {
    try {
      await Share.share({
        message: `"${text}"\n\n— ManifestDaily\nDaily affirmations & focus sessions`,
      });
    } catch {
      // User dismissed or sharing unavailable
    }
  }, []);

  const handleEdit = useCallback((item: FeedItem) => {
    if (!item.id) return;
    router.push({
      pathname: '/new-affirmation',
      params: { id: item.id, text: item.text, category: item.goalId ?? '' },
    });
  }, [router]);

  const handleDelete = useCallback((item: FeedItem) => {
    if (!item.id) return;
    const id = item.id;
    Alert.alert(
      'Delete affirmation?',
      'This custom affirmation will be removed for good.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteCustomAffirmation(id);
          },
        },
      ],
    );
  }, [deleteCustomAffirmation]);

  const selectFilter = (next: Filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(false);
    setFilter(next);
  };

  const activeLabel = FILTERS.find((f) => f.key === filter)?.label ?? 'All';

  const emptyMessage =
    filter === 'liked'
      ? 'No liked affirmations yet.\nTap the ♡ on any affirmation to save it.'
      : 'No custom affirmations yet.\nTap “+” to write your own.';

  return (
    <ImageBackground
      source={darkMode ? require('../../assets/bg5_dark.webp') : require('../../assets/bg5_lite.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Tap-catcher so the dropdown closes when tapping outside it */}
      {menuOpen && (
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)} />
      )}

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: theme.border,
            backgroundColor: 'transparent',
          },
        ]}
      >
        <View>
          <Text
            style={[
              styles.eyebrow,
              {
                color: theme.text2,
                fontFamily: 'DMSans_400Regular',
              },
            ]}
          >
            REFLECT
          </Text>
          <Text
            style={[
              styles.title,
              {
                color: theme.text,
                fontFamily: 'DMSerifDisplay_400Regular',
              },
            ]}
          >
            Affirmations
          </Text>
        </View>

        <View style={styles.controls}>
          {/* All / Liked / Custom dropdown */}
          <TouchableOpacity
            onPress={() => setMenuOpen((o) => !o)}
            style={[styles.filterPill,]}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterLabel, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
              {activeLabel}
            </Text>
            <Icon name="chevD" size={15} color={theme.text2} />
          </TouchableOpacity>

          {/* Add */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/new-affirmation');
            }}
            style={[styles.newBtn, { backgroundColor: theme.gold }]}
            activeOpacity={0.85}
          >
            <Icon name="plus" size={18} color={theme.onAccent} strokeWidth={2.2} />
          </TouchableOpacity>

          {/* Dropdown menu */}
          {menuOpen && (
            <View style={[styles.menu, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {FILTERS.map((f, i) => {
                const isActive = f.key === filter;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => selectFilter(f.key)}
                    style={[
                      styles.menuItem,
                      i < FILTERS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.menuLabel,
                        {
                          color: isActive ? theme.gold : theme.text,
                          fontFamily: isActive ? 'DMSans_500Medium' : 'DMSans_400Regular',
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                    {isActive && <Icon name="check" size={15} color={theme.gold} strokeWidth={2.2} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Scrolling feed (or empty state) */}
      {total === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}>
            {emptyMessage}
          </Text>
        </View>
      ) : (
        <ScrollView
          key={`${filter}-${total}`}
          ref={scrollViewRef}
          style={styles.feed}
          onLayout={handleFeedLayout}
          scrollEventThrottle={16}
          onScroll={(e) => handleScroll(e.nativeEvent)}
          onMomentumScrollEnd={(e) => handleMomentumEnd(e.nativeEvent)}
          onContentSizeChange={handleContentSizeChange}
          decelerationRate="fast"
          snapToInterval={slideH}
          snapToAlignment="start"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
        >
          {loopedItems.map((item, i) => {
            const realIndex = toRealIndex(i);
            // Only mount the heavy slide content (text, icons, action buttons)
            // for slides near the active one; everything else is a same-height
            // empty spacer. This keeps the loop/clone array, scroll offsets, and
            // snap behavior untouched — it only changes what each loopedItems
            // entry renders, not how many entries there are or where they sit.
            const activeLoopedIndex = loop ? activeIndex + 1 : activeIndex;
            const isNear = Math.abs(i - activeLoopedIndex) <= ACTIVE_WINDOW;

            if (!isNear) {
              return <View key={`${i}-${item.key}`} style={{ height: slideH }} />;
            }

            return (
              <AffSlide
                key={`${i}-${item.key}`}
                text={item.text}
                index={realIndex}
                slideHeight={slideH}
                goalId={item.goalId}
                isCustom={item.isCustom}
                isActive={activeIndex === realIndex}
                onSave={() => handleSave(item.text)}
                onShare={() => handleShare(item.text)}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            );
          })}
        </ScrollView>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.4,
    marginBottom: 2,
  },
  title: {
    fontSize: 25,
    letterSpacing: -0.3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 14,
    paddingLeft: 20,
  },
  filterLabel: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  newBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  menu: {
    position: 'absolute',
    top: 48,
    right: 0,
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 2,
    zIndex: 40,
    // Sit above the feed and the tap-catcher overlay.
    shadowColor: '#3A3028',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuLabel: {
    fontSize: 15,
    letterSpacing: 0.1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  feed: {
    flex: 1,
  },
});
