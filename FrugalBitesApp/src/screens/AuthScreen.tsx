import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Dummy auth context for testing
const useAuth = () => ({
  login: async (email: string, password: string) => {
    if (email === 'john.doe@example.com' && password === 'password123') return true;
    throw new Error('Invalid credentials');
  },
  signup: async (data: any) => true,
  isLoading: false,
  error: '',
});
import { SubscriptionStatus } from '../types/auth';
import { colors } from '../theme';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isVIP, setIsVIP] = useState(false);
  const { login, signup, isLoading, error } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Login Failed', error || 'Please check your credentials');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await signup({
        email,
        password,
        firstName,
        lastName,
        subscriptionStatus: isVIP ? SubscriptionStatus.VIP : SubscriptionStatus.FREE,
      });
    } catch (err) {
      Alert.alert('Sign Up Failed', error || 'Please try again');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="leaf" size={32} color={colors.eco} />
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.logo}>FrugalBites</Text>
          <Text style={styles.tagline}>Save food. Save money.</Text>
        </View>

        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
            onPress={() => setIsLogin(true)}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
            onPress={() => setIsLogin(false)}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="user@example.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          </View>

          {/* Name Fields (Sign Up) */}
          {!isLogin && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isLoading}
                />
              </View>
            </>
          )}

          {/* Password */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>

          {/* Confirm Password (Sign Up) */}
          {!isLogin && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!isLoading}
              />
            </View>
          )}

          {/* VIP Status (Sign Up) */}
          {!isLogin && (
            <View style={styles.vipContainer}>
              <TouchableOpacity
                style={[styles.vipOption, isVIP && styles.vipOptionSelected]}
                onPress={() => setIsVIP(!isVIP)}
                disabled={isLoading}
              >
                <View
                  style={[
                    styles.vipCheckbox,
                    isVIP && styles.vipCheckboxSelected,
                  ]}
                >
                  {isVIP && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.vipInfo}>
                  <Text style={styles.vipTitle}>Upgrade to VIP 👑</Text>
                  <Text style={styles.vipSubtitle}>Exclusive deals & 10% extra discount</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={isLogin ? handleLogin : handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? 'Login' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            {/* Google - DEV HACK: Quick login for testing */}
            <TouchableOpacity 
              style={styles.socialButton} 
              disabled={isLoading}
              onPress={async () => {
                try {
                  await login('john.doe@example.com', 'password123');
                } catch (err) {
                  Alert.alert('Login Failed', 'Test login failed');
                }
              }}
            >
              <View style={styles.socialIconContainer}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            {/* Apple */}
            <TouchableOpacity style={[styles.socialButton, styles.socialButtonApple]} disabled={isLoading}>
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-apple" size={20} color="#000" />
              </View>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>

            {/* Facebook - DEV HACK: Login + reset onboarding for testing */}
            <TouchableOpacity 
              style={[styles.socialButton, styles.socialButtonFacebook]} 
              disabled={isLoading}
              onPress={async () => {
                try {
                  // Reset onboarding flag so it shows again
                  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                  await AsyncStorage.removeItem('onboarding_complete');
                  await login('john.doe@example.com', 'password123');
                } catch (err) {
                  Alert.alert('Login Failed', 'Test login failed');
                }
              }}
            >
              <View style={styles.socialIconContainer}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </View>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Your passwords are encrypted and secure
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.background.eco,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  savingsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.savings,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.eco,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  toggleTextActive: {
    color: colors.text.primary,
  },
  formContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  vipContainer: {
    marginBottom: 20,
  },
  vipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border.light,
    borderRadius: 8,
  },
  vipOptionSelected: {
    borderColor: colors.secondary[400],
    backgroundColor: colors.background.savings,
  },
  vipCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipCheckboxSelected: {
    borderColor: colors.secondary[400],
    backgroundColor: colors.secondary[400],
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  vipInfo: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  vipSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: colors.error.light,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error.main,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.eco,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.text.tertiary,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  socialButtonApple: {
    borderColor: colors.neutral[300],
  },
  socialButtonFacebook: {
    borderColor: '#1877F2',
    borderWidth: 1,
  },
  socialIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default AuthScreen;
