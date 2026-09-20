import { Platform, PixelRatio, Share, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from '../components/shared/ShareCard';

type CaptureRefFn = (
  view: React.RefObject<View | null>,
  options: Record<string, unknown>,
) => Promise<string>;

/**
 * Loads `captureRef` at call time rather than at module scope.
 *
 * react-native-view-shot's spec ends in
 * `TurboModuleRegistry.getEnforcing('RNViewShot')`, which THROWS during import
 * when the native module isn't in the binary — which is the case in Expo Go.
 * A top-level import would therefore take the whole app down on launch, since
 * three screens pull this module in. Requiring it here keeps that failure
 * inside the try/catch below, so an Expo Go build simply falls back to the
 * text share instead of crashing.
 */
function loadCaptureRef(): CaptureRefFn {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-view-shot').captureRef as CaptureRefFn;
}

// Target width of the exported PNG. 1080 is the Instagram Stories short edge.
const TARGET_WIDTH_PX = 1080;

// The plain-text share the button used to do. Still the fallback whenever the
// image path can't complete, so the button never appears broken.
export function affirmationShareText(text: string): string {
  return `"${text}"\n\n— ManifestDaily\nDaily affirmations & focus sessions`;
}

async function shareAffirmationText(text: string): Promise<void> {
  try {
    await Share.share({ message: affirmationShareText(text) });
  } catch {
    // User dismissed, or sharing is unavailable — nothing left to try.
  }
}

function logDev(message: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[shareAffirmation] ${message}`, error);
  }
}

/**
 * Capture size for `captureRef`.
 *
 * The two platforms interpret `width`/`height` in DIFFERENT UNITS, which is
 * the trap here:
 *
 * - Android (ViewShot.java) runs `Bitmap.createScaledBitmap(bitmap, width,
 *   height, ...)` — the numbers are literal output PIXELS.
 * - iOS (RNViewShot.mm) runs `UIGraphicsBeginImageContextWithOptions(size, NO,
 *   0)` — the numbers are POINTS, and the trailing `0` means the context is
 *   created at the device's screen scale. So the real pixel output is
 *   `points x PixelRatio.get()`.
 *
 * Passing 1080 to both would give a correct 1080px on Android and a 3240px
 * monster on an @3x iPhone. Dividing by the pixel ratio on iOS lands both at
 * ~1080px wide. On a @3x device that also happens to equal the card's own
 * 360pt width, so the common case is a no-op with no resampling at all.
 */
function captureSize(): { width: number; height: number } {
  if (Platform.OS === 'ios') {
    const width = Math.round(TARGET_WIDTH_PX / PixelRatio.get());
    return { width, height: Math.round(width * (SHARE_CARD_HEIGHT / SHARE_CARD_WIDTH)) };
  }
  return {
    width: TARGET_WIDTH_PX,
    height: Math.round(TARGET_WIDTH_PX * (SHARE_CARD_HEIGHT / SHARE_CARD_WIDTH)),
  };
}

/**
 * Normalises what `captureRef({ result: 'tmpfile' })` hands back.
 *
 * The platforms disagree here too:
 * - Android resolves `Uri.fromFile(output).toString()` — already `file:///...`.
 * - iOS resolves a bare `RCTTempFilePath(...)` — `/var/mobile/.../x.png`, no
 *   scheme at all.
 *
 * expo-sharing's iOS module signature is `shareAsync(url: URL, ...)` and it
 * runs a FileSystem permission check against that URL, so a scheme-less path
 * is not good enough. Testing the string rather than branching on
 * `Platform.OS` keeps this correct if either platform ever changes.
 */
function toFileUri(captured: string): string {
  return captured.startsWith('file://') ? captured : `file://${captured}`;
}

/**
 * Captures the off-screen ShareCard behind `viewRef` and opens the system
 * share sheet with it as a PNG.
 *
 * Falls back to the original plain-text share on ANY failure — capture error,
 * sharing unavailable, share sheet throwing — so the button always does
 * something. `text` is what that fallback sends.
 */
export async function shareAffirmationImage(
  viewRef: React.RefObject<View | null>,
  text: string,
): Promise<void> {
  try {
    if (!viewRef.current) {
      throw new Error('share card is not mounted');
    }

    if (!(await Sharing.isAvailableAsync())) {
      await shareAffirmationText(text);
      return;
    }

    const captureRef = loadCaptureRef();
    const { width, height } = captureSize();
    const captured = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      width,
      height,
    });

    await Sharing.shareAsync(toFileUri(captured), {
      // mimeType steers the Android chooser, UTI the iOS activity sheet —
      // without them the sheet offers file/document targets instead of
      // Instagram, Messages, Photos and the rest.
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: 'Share affirmation',
    });
  } catch (error) {
    logDev('image share failed, falling back to text', error);
    await shareAffirmationText(text);
  }
}
