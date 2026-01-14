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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SubscriptionStatus } from '../types/auth';

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
          <Text style={styles.logo}>🍱 FrugalBites</Text>
          <Text style={styles.tagline}>Fresh food, great savings</Text>
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
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
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  toggleTextActive: {
    color: '#333',
  },
  formContainer: {
    backgroundColor: 'white',
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
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  vipContainer: {
    marginBottom: 20,
  },
  vipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  vipOptionSelected: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  vipCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipCheckboxSelected: {
    borderColor: '#fbbf24',
    backgroundColor: '#fbbf24',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  vipInfo: {
    flex: 1,
  },
  vipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  vipSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default AuthScreen;
