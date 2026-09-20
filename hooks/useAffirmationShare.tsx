import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ShareCard from '../components/shared/ShareCard';
import { shareAffirmationImage } from '../lib/shareAffirmation';
import { GoalId } from '../constants/data';

interface PendingShare {
  text: string;
  goalId: GoalId | null;
}

// Backstop for the background photo's load callback. The asset is bundled and
// warm after the first render, so this effectively never fires — but if
// onLoadEnd is ever missed the button would otherwise spin forever, so capture
// anyway rather than hang.
const IMAGE_READY_TIMEOUT_MS = 2500;

/**
 * Wires up "share as image" for a screen that already has a share button.
 *
 * Returns the off-screen card to render (`shareCard`), the trigger to hand to
 * the existing button (`share`), and `isSharing` for its loading state. The
 * three share call sites all need the same fiddly off-screen-render-then-
 * capture dance, so it lives here once instead of being copied three times.
 */
export function useAffirmationShare() {
  const shotRef = useRef<View>(null);
  const [pending, setPending] = useState<PendingShare | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  // Resolver for the current capture's "background photo has decoded" wait.
  const readyRef = useRef<(() => void) | null>(null);
  // Guards re-entry without depending on state, which lags behind rapid taps.
  const busyRef = useRef(false);

  const handleReady = useCallback(() => {
    readyRef.current?.();
    readyRef.current = null;
  }, []);

  const share = useCallback(async (text: string, goalId: GoalId | null = null) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setIsSharing(true);

    // Arm the wait BEFORE mounting the card, so a cached image that decodes
    // immediately can't resolve into a null ref.
    const ready = new Promise<void>((resolve) => {
      readyRef.current = resolve;
    });

    setPending({ text, goalId });

    try {
      await Promise.race([
        ready,
        new Promise<void>((resolve) => setTimeout(resolve, IMAGE_READY_TIMEOUT_MS)),
      ]);
      // Let the frame after the image lands actually commit before capturing.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await shareAffirmationImage(shotRef, text);
    } finally {
      readyRef.current = null;
      setPending(null);
      setIsSharing(false);
      busyRef.current = false;
    }
  }, []);

  // Laid out, but parked far off-screen: display:none / zero-size wrappers
  // don't get a native view to draw, so they capture blank. collapsable={false}
  // is mandatory on Android — without it view flattening removes the wrapper
  // and the capture comes back empty.
  const shareCard = pending ? (
    <View style={styles.offscreen} pointerEvents="none" collapsable={false}>
      <View ref={shotRef} collapsable={false}>
        <ShareCard text={pending.text} goalId={pending.goalId} onReady={handleReady} />
      </View>
    </View>
  ) : null;

  return { shareCard, share, isSharing };
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -9999,
    left: -9999,
  },
});
