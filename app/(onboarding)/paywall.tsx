import React, { useState, useEffect, useRef } from 'react';
import { Alert, ActivityIndicator, ImageBackground, Linking, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize } from '../../constants/tokens';
import { PAYWALL_PLANS, PAYWALL_FEATURES, GOALS, trialDaysForPlan } from '../../constants/data';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  getTrialEligibility,
  addEntitlementListener,
} from '../../src/lib/revenueCat';
import Button from '../../components/shared/Button';
import Icon, { IconName } from '../../components/ui/Icon';
import Mascot from '../../components/ui/Mascot';
import ProgressDots from '../../components/ui/ProgressDots';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;

// Maps PAYWALL_PLANS ids to App Store / Play Store product identifiers.
const PACKAGE_TYPE_MAP: Record<string, string> = {
  weekly: 'com.bepel.manifestdaily.weekly',
  monthly: 'com.bepel.manifestdaily.monthly',
  annual: 'com.bepel.manifestdaily.annual',
  lifetime: 'com.bepel.manifestdaily.lifetime',
};

export default function PaywallScreen() {
  const router = useRouter();
  // Set by presentPaywall/PaywallRedirect (lib/featureAccess.ts) when a free
  // Android user tapped a gated feature. Never set on iOS.
  const { context } = useLocalSearchParams<{ context?: string }>();
  const isFeatureGate = context === 'feature';
  const { theme } = useTheme();
  const name = useAppStore((s) => s.userName);
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const setPremium = useAppStore((s) => s.setPremium);
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<string>('annual');
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  // productId -> already used trial (ineligible). iOS only; empty/false elsewhere.
  const [ineligibleByProductId, setIneligibleByProductId] = useState<Record<string, boolean>>({});

  // The listener effect below is mount-only; read the live selected plan through
  // a ref so a late entitlement confirmation tags analytics with the current
  // selection rather than the stale value captured at mount.
  const selectedPlanRef = useRef(selectedPlan);
  selectedPlanRef.current = selectedPlan;

  useEffect(() => {
    getOfferings().then(setOfferings);

    // Trial eligibility for the two trial-bearing plans (iOS only — see
    // getTrialEligibility). Drives whether trial copy is shown per selected plan.
    getTrialEligibility([PACKAGE_TYPE_MAP.weekly, PACKAGE_TYPE_MAP.annual]).then(
      setIneligibleByProductId,
    );

    const wasOnboarded = useAppStore.getState().hasOnboarded;

    // Reaching the paywall means the onboarding questionnaire is finished.
    // Persist that now (idempotent — skip if already complete so we don't reset
    // onboardingCompletedAt on returning visits) so a user who does NOT
    // subscribe and then backgrounds/force-quits is hard-gated straight back to
    // this paywall on the next launch by NavigationGuard — never dropped back
    // into onboarding from scratch.
    if (!wasOnboarded) {
      useAppStore.getState().completeOnboarding();
    }

    // Trigger inference: an Android feature-gate visit carries the `context`
    // param; otherwise, if onboarding was already complete this is a returning
    // non-premium user being hard-gated at launch (iOS), else it's the paywall
    // step inside the onboarding flow. (Event values kept for analytics continuity.)
    trackEvent('paywall_viewed', {
      trigger: isFeatureGate ? 'feature_gate' : wasOnboarded ? 'soft' : 'post_onboarding',
    });
  }, []);

  // Android soft paywall: this screen must always be leavable. A feature-gate
  // visit was pushed, so pop back to where the user was; a post-onboarding or
  // deep-link visit has nothing sensible behind it, so land on the tabs. On
  // iOS no close button is rendered and the hard paywall stays inescapable.
  const handleClose = () => {
    if (isFeatureGate && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/');
    }
  };

  // Catch entitlements that activate asynchronously while the user sits on the
  // paywall — e.g. a UPI Autopay mandate or Ask-to-Buy approval that confirms
  // after purchasePackage() already returned "pending". When it lands, advance
  // through the normal success path. Cleaned up on unmount.
  useEffect(() => {
    const unsubscribe = addEntitlementListener((isPremium) => {
      if (!isPremium) return;
      trackEvent('purchase_completed', { plan: selectedPlanRef.current, source: 'listener' });
      setPremium(true);
      router.replace('/(onboarding)/allset');
    });
    return unsubscribe;
  }, []);

  const goalLabel = GOALS.find((g) => g.id === selectedGoals[0])?.label ?? 'manifestation';

  const findPackage = (planId: string): PurchasesPackage | null => {
    if (!offerings) return null;
    const productId = PACKAGE_TYPE_MAP[planId];
    return (
      offerings.availablePackages.find(
        (p) => p.product.identifier === productId || p.identifier === productId,
      ) ?? null
    );
  };

  // Trial state for the currently selected plan, driving all trial UI/copy.
  // `selectedTrialDays` is the plan's trial length (null for non-trial plans).
  // A user is ineligible only on iOS (Android eligibility is always "unknown",
  // so we keep showing the trial there). `showTrial` gates banner/CTA/footnote.
  const selectedProductId = PACKAGE_TYPE_MAP[selectedPlan];
  const selectedTrialDays = trialDaysForPlan(selectedPlan);
  const selectedPriceLabel = PAYWALL_PLANS.find((p) => p.id === selectedPlan)?.price ?? '';
  const isIneligible = Platform.OS === 'ios' && !!ineligibleByProductId[selectedProductId];
  const showTrial = selectedTrialDays !== null && !isIneligible;

  const showPurchaseError = () =>
    Alert.alert('Purchase Failed', 'Something went wrong. Please try again.', [{ text: 'OK' }]);

  const handleStart = async () => {
    if (purchasing) return;

    trackEvent('purchase_started', { plan: selectedPlan });

    const pkg = findPackage(selectedPlan);
    if (!pkg) {
      Alert.alert('Not Available', 'This plan is not available right now.', [{ text: 'OK' }]);
      return;
    }

    setPurchasing(true);
    const result = await purchasePackage(pkg);
    setPurchasing(false);

    if (result.success) {
      if (result.isPremium) {
        trackEvent('purchase_completed', { plan: selectedPlan });
        // Only a real trial start: the plan must offer a trial AND the user must
        // be eligible (showTrial). An ineligible user on a trial-bearing plan is
        // charged immediately, so it isn't a trial.
        if (showTrial) {
          trackEvent('trial_started', { plan: selectedPlan });
        }
        setPremium(true);
        router.replace('/(onboarding)/allset');
      } else {
        showPurchaseError();
      }
    } else if (result.pending) {
      // Deferred payment (e.g. UPI Autopay): NOT a failure. Reassure the user;
      // the entitlement listener will advance them automatically once confirmed.
      trackEvent('purchase_pending', { plan: selectedPlan });
      if (__DEV__) console.log('[Paywall] Purchase pending — awaiting store confirmation.');
      Alert.alert(
        'Payment processing',
        "We'll unlock Pro automatically once your payment is confirmed. You can keep this screen open or come back anytime.",
        [{ text: 'OK' }],
      );
    } else if (!result.cancelled) {
      trackEvent('purchase_failed', {
        plan: selectedPlan,
        code: (result.error as { code?: string } | undefined)?.code,
      });
      showPurchaseError();
    }
  };

  const handleRestore = async () => {
    if (purchasing) return;

    setPurchasing(true);
    const result = await restorePurchases();
    setPurchasing(false);

    if (result.success && result.isPremium) {
      setPremium(true);
      router.replace('/(onboarding)/allset');
    } else if (result.success) {
      Alert.alert('No Purchase Found', 'No previous purchase found on this account.', [{ text: 'OK' }]);
    } else {
      Alert.alert('Restore Failed', 'Could not restore purchases. Try again.', [{ text: 'OK' }]);
    }
  };

  const handleTerms = () => {
    Linking.openURL('https://manifestdaily.bepel.in/terms');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://manifestdaily.bepel.in/privacy');
  };

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg3.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <LinearGradient
        colors={[theme.accentTint, 'transparent']}
        style={styles.topGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Feature-gate visits arrive mid-app, not mid-onboarding — no step dots. */}
        {!isFeatureGate && <ProgressDots step={12} total={TOTAL_STEPS} style={{ marginBottom: 0 }} />}

        {/* Mascot */}
        <View style={styles.mascotRow}>
          <Mascot state="zen" size={200} />
        </View>

        <View style={styles.headingBlock}>
          <Text style={[styles.title, { color: theme.text, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
            {name ? `Become who you keep affirming, ${name}.` : 'Become who you keep affirming.'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            Your {goalLabel} journey starts today.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featureList}>
          {PAYWALL_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.card }]}>
                <Icon name={f.icon as IconName} size={15} color={theme.text2} strokeWidth={1.5} />
              </View>
              <Text
                style={[styles.featureText, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}
              >
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom section — plans + button + footer tightly grouped */}
        <View style={styles.bottomSection}>
          {/* Plan selector + trial note */}
          <View style={styles.plansSection}>
            {showTrial && (
              <View style={[styles.trialBanner, { backgroundColor: theme.accentTint, borderColor: theme.goldSoft }]}>
                <Text style={[styles.trialBannerText, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                  🌟 {selectedTrialDays}-day free trial — cancel anytime
                </Text>
              </View>
            )}
            <View style={styles.planRow}>
              {PAYWALL_PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const price = plan.price.split('/')[0].split(' ')[0];
                const period = plan.price.includes('/')
                  ? `/${plan.price.split('/')[1]}`
                  : plan.price.split(' ').slice(1).join(' ');
                const rcPackage = findPackage(plan.id);
                const displayPrice = rcPackage?.product.priceString ?? price;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planPill,
                      {
                        backgroundColor: isSelected ? theme.sel : theme.card,
                        borderColor: isSelected ? theme.gold : theme.border,
                        flex: 1,
                      },
                    ]}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.8}
                    disabled={purchasing}
                  >
                    {plan.badge ? (
                      <View style={[styles.badge, { backgroundColor: theme.orange }]}>
                        <Text
                          style={[
                            styles.badgeText,
                            { color: theme.onAccent, fontFamily: 'DMSans_500Medium' },
                          ]}
                        >
                          {plan.badge}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: theme.border, paddingVertical: 2 }]} />
                    )}
                    <Text
                      style={[
                        styles.planLabel,
                        {
                          color: isSelected ? theme.text : theme.text2,
                          fontFamily: 'DMSans_500Medium',
                        },
                      ]}
                    >
                      {plan.label}
                    </Text>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.planPrice,
                        {
                          color: isSelected ? theme.orange : theme.text,
                          fontFamily: 'DMSerifDisplay_400Regular',
                        },
                      ]}
                    >
                      {displayPrice}
                    </Text>
                    <Text
                      style={[
                        styles.planNote,
                        { color: theme.text2, fontFamily: 'DMSans_400Regular' },
                      ]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={[styles.disclosure, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}>
            Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your iPhone Settings → Apple ID → Subscriptions.
          </Text>

          <View style={styles.ctaWrap}>
            <Button
              label={showTrial ? `Start ${selectedTrialDays}-day free trial` : 'Subscribe now'}
              onPress={handleStart}
              variant="primary"
              disabled={purchasing}
            />
            {purchasing && (
              <View style={styles.ctaSpinner}>
                <ActivityIndicator color={theme.onAccent} />
              </View>
            )}
          </View>

          <Text style={[styles.trialNote, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}>
            {showTrial
              ? `Free for ${selectedTrialDays} days, then ${selectedPriceLabel} · Cancel anytime`
              : `${selectedPriceLabel} · Cancel anytime`}
          </Text>

          {/* Footer links */}
          <View style={styles.footerLinks}>
            {[
              { label: 'Restore', onPress: handleRestore },
              { label: 'Terms', onPress: handleTerms },
              { label: 'Privacy', onPress: handlePrivacy },
            ].map((link, i) => (
              <React.Fragment key={link.label}>
                {i > 0 && (
                  <Text style={[styles.footerDot, { color: theme.border }]}>·</Text>
                )}
                <TouchableOpacity onPress={link.onPress}>
                  <Text
                    style={[styles.footerLink, { color: theme.text2, fontFamily: 'DMSans_400Regular' }]}
                  >
                    {link.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Android-only escape hatch (freemium soft paywall). Rendered after the
          ScrollView so it always draws and hit-tests above it; iOS renders no
          close affordance and stays a hard paywall. */}
      {Platform.OS === 'android' && (
        <TouchableOpacity
          onPress={handleClose}
          style={[
            styles.closeBtn,
            { top: insets.top + 12, backgroundColor: theme.card, borderColor: theme.border },
          ]}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="close" size={16} color={theme.text2} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing['2xl'],
    alignItems: 'center',
    flexGrow: 1,
  },
  mascotRow: {
    marginTop: -spacing.lg,
  },
  headingBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: -75,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  trialBanner: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius['5xl'],
    borderWidth: 1,
  },
  trialBannerText: {
    fontSize: fontSize.sm,
    letterSpacing: 0.2,
  },
  featureList: {
    width: '100%',
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: {
    fontSize: fontSize.md,
    flex: 1,
  },
  bottomSection: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
  },
  plansSection: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: -spacing['2xl'],
  },
  planRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  planPill: {
    borderRadius: radius['2xl'],
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 3,
    alignItems: 'center',
    minHeight: 86,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 3,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    letterSpacing: 0.5,
  },
  planLabel: {
    fontSize: 12,
    marginTop: 14,
  },
  planPrice: {
    fontSize: 15,
  },
  planNote: {
    fontSize: 10,
    textAlign: 'center',
  },
  disclosure: {
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  ctaWrap: {
    width: '100%',
  },
  ctaSpinner: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialNote: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLink: {
    fontSize: 12,
  },
  footerDot: {
    fontSize: 12,
  },
});
