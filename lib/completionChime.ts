import { Audio } from 'expo-av';

// Short bell chime played when a focus session reaches zero with the app
// in the foreground. Bundled as a wav (not mp3) so it decodes instantly on
// both platforms — at ~100KB the size difference doesn't matter here.
const CHIME_FILE = require('../assets/sounds/complete.wav');

/**
 * Plays the session-completion chime once, then releases it.
 *
 * Fire-and-forget: the caller is in a completion effect and shouldn't await
 * audio. Any failure (device muted at the OS level, audio focus denied,
 * Expo Go quirks) is swallowed — the haptic and the completion screen still
 * land, so a silent failure degrades gracefully.
 *
 * `playsInSilentModeIOS` is set so the chime is audible even with the ring
 * switch flipped, matching how the ambient session audio already behaves and
 * how system timers announce themselves. It only ever fires as the direct
 * result of a session the user started.
 */
export async function playCompletionChime(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(CHIME_FILE, {
      shouldPlay: true,
      volume: 1,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {}
}
