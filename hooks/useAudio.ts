import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Audio } from 'expo-av';
import { SoundId } from '../constants/data';

// Static asset map for the three ambient sounds. Metro bundles these mp3s.
const SOUND_FILES: Record<SoundId, number> = {
  rain: require('../assets/sounds/rain.mp3'),
  ocean: require('../assets/sounds/ocean.mp3'),
  forest: require('../assets/sounds/forest.mp3'),
};

/**
 * Plays the selected ambient sound on a loop for a focus session.
 *
 * - Loads and plays the chosen sound (looping) whenever `selectedSound` changes.
 * - Stops when `selectedSound` becomes null.
 * - Pauses when the app leaves the foreground and resumes when it returns,
 *   unless playback was already paused via `pause()`.
 * - Exposes `pause` / `resume` / `stop` for session pause / resume / end.
 *
 * `autoPlay` controls whether the sound starts playing as soon as it loads
 * (default `true`) — pass `false` when reopening an already-paused session.
 */
export function useAudio(selectedSound: SoundId | null, autoPlay: boolean = true) {
  const soundRef = useRef<Audio.Sound | null>(null);
  // Guards against rapid sound switching loading out of order.
  const loadIdRef = useRef(0);
  // Tracks whether playback should be active, so it can be restored when the
  // app returns to the foreground (independent of the session's own pause).
  const isPlayingRef = useRef(autoPlay);

  const unload = useCallback(async () => {
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      try {
        await sound.stopAsync();
      } catch {}
      try {
        await sound.unloadAsync();
      } catch {}
    }
  }, []);

  // Load + play (looping) whenever the selected sound changes.
  useEffect(() => {
    const id = ++loadIdRef.current;

    (async () => {
      await unload();
      if (selectedSound == null) return;

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(SOUND_FILES[selectedSound], {
          isLooping: true,
          shouldPlay: isPlayingRef.current,
          volume: 1,
        });

        // A newer selection won the race — discard this one.
        if (id !== loadIdRef.current) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {}
    })();
  }, [selectedSound, unload]);

  // Pause playback when the app leaves the foreground, and resume it when it
  // returns — unless the user had already paused it themselves.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state !== 'active') {
        soundRef.current?.pauseAsync().catch(() => {});
      } else if (isPlayingRef.current) {
        soundRef.current?.playAsync().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  // Release the sound when the screen unmounts.
  useEffect(() => () => {
    unload();
  }, [unload]);

  const pause = useCallback(async () => {
    isPlayingRef.current = false;
    try {
      await soundRef.current?.pauseAsync();
    } catch {}
  }, []);

  const resume = useCallback(async () => {
    isPlayingRef.current = true;
    try {
      await soundRef.current?.playAsync();
    } catch {}
  }, []);

  const stop = useCallback(async () => {
    isPlayingRef.current = false;
    await unload();
  }, [unload]);

  return { pause, resume, stop };
}
