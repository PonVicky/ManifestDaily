import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';
import { spacing, fontSize } from '../../constants/tokens';
import Button from '../../components/shared/Button';
import ProgressDots from '../../components/ui/ProgressDots';
import { trackEvent } from '../../lib/analytics';

const TOTAL_STEPS = 13;
const BACKGROUND_TEXT = '#2D211A';
const BACKGROUND_MUTED = '#594033';
const BACKGROUND_ACCENT = '#7A3F20';

export default function NameScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const setName = useAppStore((s) => s.setName);
  const existingName = useAppStore((s) => s.userName);

  const [name, setLocalName] = useState(existingName);
  const trimmed = name.trim();

  const handleContinue = () => {
    setName(trimmed);
    trackEvent('onboarding_step_completed', { step: 2 });
    router.push('/(onboarding)/dob');
  };

  return (
    <ImageBackground
      source={require('../../assets/onboard_bg2.webp')}
      resizeMode="cover"
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <ProgressDots step={2} total={TOTAL_STEPS} />

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Image source={require('../../assets/mascot-zen.png')} style={styles.mascot} />

            <Text style={[styles.title, { color: BACKGROUND_TEXT, fontFamily: 'DMSerifDisplay_400Regular_Italic' }]}>
              What should we call you?
            </Text>
            <Text style={[styles.subtitle, { color: BACKGROUND_MUTED, fontFamily: 'DMSans_400Regular' }]}>
              We'll make your affirmations feel personal.
            </Text>

            <TextInput
              value={name}
              onChangeText={setLocalName}
              placeholder="Your name"
              placeholderTextColor={BACKGROUND_MUTED}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => trimmed.length > 0 && handleContinue()}
              style={[
                styles.input,
                {
                  color: BACKGROUND_TEXT,
                  borderBottomColor: BACKGROUND_ACCENT,
                  fontFamily: 'DMSerifDisplay_400Regular_Italic',
                },
              ]}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label="Continue"
              onPress={handleContinue}
              variant="primary"
              disabled={trimmed.length === 0}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: 30,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    width: '100%',
    maxWidth: 300,
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
  },
  footer: {
    paddingTop: spacing.base,
  },
  mascot: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
});
