import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTranslation } from 'react-i18next';

interface SocialLoginButtonsProps {
  onAppleLogin: () => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  isLoading?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onAppleLogin,
  onGoogleLogin,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttons}>
        {/* Google Sign In */}
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={onGoogleLogin}
          disabled={isLoading}
        >
          <Ionicons name="logo-google" size={20} color="#EA4335" />
          <Text style={styles.googleButtonText}>Google</Text>
        </TouchableOpacity>

        {/* Apple Sign In - iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialButton, styles.appleButton]}
            onPress={onAppleLogin}
            disabled={isLoading}
          >
            <Ionicons name="logo-apple" size={22} color="#fff" />
            <Text style={styles.appleButtonText}>Apple</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Alternative: Native Apple Sign In Button for better UX
interface AppleSignInNativeProps {
  onSignIn: (credential: AppleAuthentication.AppleAuthenticationCredential) => void;
  onError: (error: Error) => void;
}

export const AppleSignInNative: React.FC<AppleSignInNativeProps> = ({
  onSignIn,
  onError,
}) => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      onSignIn(credential);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled, don't treat as error
        return;
      }
      onError(error);
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={12}
      style={styles.appleNativeButton}
      onPress={handleAppleSignIn}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
    gap: 8,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  appleNativeButton: {
    width: '100%',
    height: 50,
  },
});
