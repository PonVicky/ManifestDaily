import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  INTRO_ELIGIBILITY_STATUS,
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

type RevenueCatKeys = {
  ios?: string;
  android?: string;
};

// RevenueCat entitlement identifier that unlocks ManifestDaily Pro features.
export const ENTITLEMENT_ID = 'pro';

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

  // Apple Search Ads attribution. iOS-only (no-op / unsupported on Android).
  // Must run AFTER configure(). Fire-and-forget: never block or fail init on it.
  if (Platform.OS === 'ios') {
    Purchases.enableAdServicesAttributionTokenCollection().catch((error) => {
      if (__DEV__) console.warn('[RevenueCat] AdServices token collection failed:', error);
    });
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
  | { success: false; cancelled?: boolean; pending?: boolean; error?: unknown };

/** Purchases a package and reports whether the Pro entitlement is now active. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, isPremium: hasActiveEntitlement(customerInfo) };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, cancelled: true };
    }
    // Deferred payment method (e.g. UPI Autopay mandate on Android, or
    // Ask-to-Buy / SCA on iOS): the purchase is PENDING, not failed. The store
    // will confirm it asynchronously and the entitlement will arrive via the
    // customer-info listener (see addEntitlementListener). Surface this as a
    // distinct state so callers don't show a misleading "Purchase Failed".
    if (error?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
      if (__DEV__) console.log('[RevenueCat] Purchase pending — deferred payment awaiting confirmation.');
      return { success: false, pending: true };
    }
    // The product is already owned on this Apple ID (e.g. the user reinstalled,
    // or is on a different device) but the entitlement hasn't been synced to
    // this install yet. The App Store won't let them "buy" it again, so fall
    // back to a restore automatically and unlock from the restored entitlement
    // instead of surfacing a confusing "Purchase Failed" error.
    if (error?.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
      if (__DEV__) console.log('[RevenueCat] Product already purchased — restoring instead.');
      return restorePurchases();
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

/**
 * Subscribes to RevenueCat customer-info updates and reports the current Pro
 * entitlement state on every change. This catches purchases that complete
 * asynchronously *after* purchasePackage() has already returned — e.g. a UPI
 * Autopay mandate or an Ask-to-Buy approval that confirms while the user is
 * still sitting on the paywall. Returns an unsubscribe function; call it on
 * unmount. No-ops (returns a no-op unsubscribe) when the SDK isn't configured,
 * so it's safe to call in Expo Go.
 */
export function addEntitlementListener(onUpdate: (isPremium: boolean) => void): () => void {
  if (!configured) return () => {};
  const listener = (customerInfo: CustomerInfo) => {
    onUpdate(hasActiveEntitlement(customerInfo));
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}

/**
 * Returns a map of productId -> "ineligible for the introductory/trial offer".
 * `true` means the user has already used the trial for that product (charge
 * them normally, hide trial copy); `false` means eligible OR unknown — the safe
 * default that keeps showing the trial offer.
 *
 * iOS only. checkTrialOrIntroductoryPriceEligibility ALWAYS returns UNKNOWN on
 * Android, so we never derive an ineligible state there — Android trial
 * detection is a separate, future task. On Android (and on any error / when the
 * SDK isn't configured) every product defaults to `false` (eligible).
 */
export async function getTrialEligibility(productIds: string[]): Promise<Record<string, boolean>> {
  const allEligible = () =>
    productIds.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = false;
      return acc;
    }, {});

  if (Platform.OS !== 'ios' || !configured) {
    return allEligible();
  }

  try {
    const result = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
    return productIds.reduce<Record<string, boolean>>((acc, id) => {
      acc[id] = result[id]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE;
      return acc;
    }, {});
  } catch (error) {
    if (__DEV__) console.error('[RevenueCat] eligibility check failed:', error);
    return allEligible();
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
