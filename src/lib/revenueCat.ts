import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

type RevenueCatKeys = {
  ios?: string;
  android?: string;
};

// RevenueCat entitlement identifier that unlocks ManifestDaily Pro features.
export const ENTITLEMENT_ID = 'ManifestDaily Pro';

function hasActiveEntitlement(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

let configured = false;

/**
 * Reads the platform-appropriate RevenueCat public SDK key from the Expo
 * config `extra` block (see app.config.js).
 */
function getApiKey(): string | undefined {
  const keys = (Constants.expoConfig?.extra?.revenueCat ?? {}) as RevenueCatKeys;
  return Platform.OS === 'ios' ? keys.ios : keys.android;
}

/**
 * Initializes the RevenueCat SDK. Safe to call more than once — subsequent
 * calls are no-ops. Returns true when Purchases was configured, false when it
 * was skipped (missing key or unsupported platform).
 */
export function initRevenueCat(): boolean {
  if (configured) return true;

  // RevenueCat only supports the native platforms; skip on web.
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    if (__DEV__) console.log('[RevenueCat] Skipped: unsupported platform', Platform.OS);
    return false;
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    // Graceful fallback: don't crash the app if the key is missing. Paywall /
    // entitlement checks elsewhere should treat the user as non-subscribed.
    if (__DEV__) {
      console.warn(
        `[RevenueCat] No API key found for ${Platform.OS} in ` +
          'Constants.expoConfig.extra.revenueCat — RevenueCat is disabled.',
      );
    }
    return false;
  }

  // Verbose logs while developing, silent in production builds.
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);

  try {
    Purchases.configure({ apiKey });
    configured = true;
  } catch (error) {
    // Throws in Expo Go because the native store is unavailable there.
    // Use a RevenueCat Test Store API key for Expo Go testing, or switch to a dev build.
    if (__DEV__) console.warn('[RevenueCat] configure failed (likely Expo Go):', error);
    return false;
  }

  if (__DEV__) {
    console.log(`[RevenueCat] Configured for ${Platform.OS}`);
  }

  return true;
}

/** Whether initRevenueCat() has successfully configured the SDK. */
export function isRevenueCatConfigured(): boolean {
  return configured;
}

/** Fetches the current default offering, or null if unavailable. */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all['default2'];
  } catch (error) {
    if (__DEV__) console.error('[RevenueCat] getOfferings failed:', error);
    return null;
  }
}

type PurchaseResult =
  | { success: true; isPremium: boolean }
  | { success: false; cancelled?: boolean; error?: unknown };

/** Purchases a package and reports whether the Pro entitlement is now active. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, isPremium: hasActiveEntitlement(customerInfo) };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, cancelled: true };
    }
    if (__DEV__) console.error('[RevenueCat] purchasePackage failed:', error);
    return { success: false, error };
  }
}

/** Restores past purchases and reports whether the Pro entitlement is active. */
export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, isPremium: hasActiveEntitlement(customerInfo) };
  } catch (error) {
    if (__DEV__) console.error('[RevenueCat] restorePurchases failed:', error);
    return { success: false, error };
  }
}

/** Checks whether the current user has an active Pro entitlement. */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return hasActiveEntitlement(customerInfo);
  } catch (error) {
    if (__DEV__) console.error('[RevenueCat] checkPremiumStatus failed:', error);
    return false;
  }
}
