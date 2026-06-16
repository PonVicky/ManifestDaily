import React, { useState, useEffect } from 'react';
import { Alert, ActivityIndicator, ImageBackground, Linking, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, fontSize } from '../../constants/tokens';
import { PAYWALL_PLANS, PAYWALL_FEATURES, GOALS } from '../../constants/data';
import { getOfferings, purchasePackage, restorePurchases } from '../../src/lib/revenueCat';
import Button from '../../components/shared/Button';
import Icon, { IconName } from '../../components/ui/Icon';
import Mascot from '../../components/ui/Mascot';
import ProgressDots from '../../components/ui/ProgressDots';

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
  const { theme } = useTheme();
  const name = useAppStore((s) => s.userName);
  const selectedGoals = useAppStore((s) => s.selectedGoals);
  const setPremium = useAppStore((s) => s.setPremium);
  const insets = useSafeAreaInsets();

  const [selectedPlan, setSelectedPlan] = useState<string>('annual');
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    getOfferings().then(setOfferings);
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

  const showPurchaseError = () =>
    Alert.alert('Purchase Failed', 'Something went wrong. Please try again.', [{ text: 'OK' }]);

  const handleStart = async () => {
    if (purchasing) return;

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
        setPremium(true);
        router.replace('/(onboarding)/allset');
      } else {
        showPurchaseError();
      }
    } else if (!result.cancelled) {
      showPurchaseError();
    }
  };

  const handleClose = () => {
    router.push('/(onboarding)/allset');
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
    Linking.openURL('https://trymanifestdaily.com/terms');
  };

  const handlePrivacy = () => {
    Linking.openURL('https://trymanifestdaily.com/privacy');
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

      {/* Close button */}
      <TouchableOpacity
        style={[
          styles.closeBtn,
          { top: insets.top + 16, backgroundColor: theme.bg2, borderColor: theme.border },
        ]}
        onPress={handleClose}
      >
        <Icon name="close" size={18} color={theme.text2} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots step={12} total={TOTAL_STEPS} style={{ marginBottom: 0 }} />

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
            <View style={[styles.trialBanner, { backgroundColor: theme.accentTint, borderColor: theme.goldSoft }]}>
              <Text style={[styles.trialBannerText, { color: theme.text, fontFamily: 'DMSans_500Medium' }]}>
                🌟 3-day free trial — cancel anytime
              </Text>
            </View>
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
            <Button label="Start 3-day free trial" onPress={handleStart} variant="primary" disabled={purchasing} />
            {purchasing && (
              <View style={styles.ctaSpinner}>
                <ActivityIndicator color={theme.onAccent} />
              </View>
            )}
          </View>

          <Text style={[styles.trialNote, { color: theme.text, fontFamily: 'DMSans_400Regular' }]}>
            Free for 3 days, then $49.99/yr · Cancel anytime
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  closeBtn: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
