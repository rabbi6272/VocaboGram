import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '../components/colors';

const INDIGO = '#6366f1';
const INDIGO_DARK = '#4f46e5';

export function LoginForm() {
  const [emailFocused, setEmailFocused] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setloginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  console.log('LoginPage rendered with state:', {
    loginEmail,
    loginPassword,
  });

  function handleLogin(): void {}

  function onForgotPassword(): void {}

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Login to Your Account</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address*</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                placeholder="you@example.com"
                placeholderTextColor={Colors.textSecondary}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                accessibilityLabel="Email Address"
                returnKeyType="next"
                editable={!loginLoading}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password*</Text>
              <TextInput
                style={[styles.input, pinFocused && styles.inputFocused]}
                value={loginPassword}
                onChangeText={setloginPassword}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                textContentType="password"
                placeholder="••••••"
                placeholderTextColor={Colors.textSecondary}
                onFocus={() => setPinFocused(true)}
                onBlur={() => setPinFocused(false)}
                accessibilityLabel="Password"
                returnKeyType="done"
                onSubmitEditing={!loginLoading ? handleLogin : undefined}
                editable={!loginLoading}
              />

              <Pressable
                onPress={onForgotPassword}
                accessibilityRole="button"
                accessibilityLabel="Forgot Password"
                accessibilityHint="Tap to reset your password"
              >
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.button, loginLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={loginLoading ? 'Logging in' : 'Login'}
              accessibilityState={{
                disabled: loginLoading,
                busy: loginLoading,
              }}
            >
              {loginLoading ? (
                <>
                  <ActivityIndicator
                    color="#fff"
                    size="small"
                    style={styles.spinner}
                  />
                  <Text style={styles.buttonText}>Logging in...</Text>
                </>
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },

  // Brand mark (replaces the SVG illustration on mobile)
  brandMark: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.cardBorder,
  },
  brandDotAccent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    // Neumorphic-style shadow matching the Colors.background
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },

  // Form fields
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 50,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 48, // WCAG touch target
  },
  inputFocused: {
    borderColor: INDIGO,
    borderWidth: 2,
    // Soft glow matching indigo ring from web
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    paddingLeft: Spacing.sm,
  },

  // Button
  button: {
    backgroundColor: Colors.accent,
    borderRadius: 50,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: Spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: INDIGO_DARK,
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  spinner: {
    marginRight: Spacing.sm,
  },
});
