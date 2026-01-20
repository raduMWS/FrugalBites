import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

interface NavigationButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
}

/**
 * Back button - navigates back in the stack
 */
export const BackButton: React.FC<NavigationButtonProps> = ({
  onPress,
  style,
  size = 24,
  color,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const iconColor = color || colors.text;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

/**
 * Close button - for modals and dismissible screens
 */
export const CloseButton: React.FC<NavigationButtonProps> = ({
  onPress,
  style,
  size = 24,
  color,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const iconColor = color || colors.text;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Close"
      accessibilityRole="button"
    >
      <Ionicons name="close" size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

/**
 * Circular back button with background - for overlaying on images
 */
export const CircularBackButton: React.FC<NavigationButtonProps & { backgroundColor?: string }> = ({
  onPress,
  style,
  size = 24,
  color,
  backgroundColor,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const iconColor = color || colors.text;
  const bgColor = backgroundColor || (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)');

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.circularButton, { backgroundColor: bgColor }, style]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Ionicons name="chevron-back" size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

/**
 * Circular close button with background - for modals overlaying content
 */
export const CircularCloseButton: React.FC<NavigationButtonProps & { backgroundColor?: string }> = ({
  onPress,
  style,
  size = 24,
  color,
  backgroundColor,
}) => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const iconColor = color || colors.text;
  const bgColor = backgroundColor || (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)');

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.circularButton, { backgroundColor: bgColor }, style]}
      onPress={handlePress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Close"
      accessibilityRole="button"
    >
      <Ionicons name="close" size={size} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
