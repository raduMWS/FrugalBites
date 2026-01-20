import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
  AccessibilityRole,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';

// Accessibility props type
export interface A11yProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{
    name: string;
    label?: string;
  }>;
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
}

// Accessible button component
interface AccessibleButtonProps extends A11yProps {
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onPress,
  children,
  style,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={style}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    accessibilityHint={accessibilityHint}
    accessibilityState={{ disabled }}
    {...props}
  >
    {children}
  </TouchableOpacity>
);

// Accessible text input wrapper
interface AccessibleTextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  isHeading?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  style,
  accessibilityLabel,
  isHeading = false,
  headingLevel,
}) => {
  const role: AccessibilityRole | undefined = isHeading ? 'header' : undefined;
  
  return (
    <Text
      style={style}
      accessible={true}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel}
      // iOS specific heading level
      {...(Platform.OS === 'ios' && isHeading && headingLevel
        ? { accessibilityLevel: headingLevel }
        : {}
      )}
    >
      {children}
    </Text>
  );
};

// Screen reader announcement
export const announceForAccessibility = (message: string): void => {
  AccessibilityInfo.announceForAccessibility(message);
};

// Check if screen reader is enabled
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  return await AccessibilityInfo.isScreenReaderEnabled();
};

// Hook for screen reader status
export const useScreenReader = (): boolean => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  React.useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
};

// Hook for reduced motion preference
export const useReducedMotion = (): boolean => {
  const [isEnabled, setIsEnabled] = React.useState(false);

  React.useEffect(() => {
    const checkReducedMotion = async () => {
      const enabled = await AccessibilityInfo.isReduceMotionEnabled();
      setIsEnabled(enabled);
    };

    checkReducedMotion();

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
};

// Generate accessibility label for price
export const getPriceAccessibilityLabel = (
  originalPrice: number,
  discountedPrice: number,
  currency: string = 'dollars'
): string => {
  const discount = Math.round((1 - discountedPrice / originalPrice) * 100);
  return `${discountedPrice.toFixed(2)} ${currency}, was ${originalPrice.toFixed(2)} ${currency}, ${discount} percent off`;
};

// Generate accessibility label for rating
export const getRatingAccessibilityLabel = (
  rating: number,
  maxRating: number = 5,
  reviewCount?: number
): string => {
  const label = `${rating.toFixed(1)} out of ${maxRating} stars`;
  if (reviewCount !== undefined) {
    return `${label}, based on ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`;
  }
  return label;
};

// Generate accessibility label for offer card
export const getOfferAccessibilityLabel = (offer: {
  title: string;
  merchantName: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  pickupTime?: string;
}): string => {
  const discount = Math.round(
    (1 - offer.discountedPrice / offer.originalPrice) * 100
  );
  let label = `${offer.title} from ${offer.merchantName}. `;
  label += `${offer.discountedPrice.toFixed(2)} dollars, ${discount} percent off. `;
  label += `${offer.quantity} available. `;
  if (offer.pickupTime) {
    label += `Pickup: ${offer.pickupTime}.`;
  }
  return label;
};

// Accessible group component for related items
interface AccessibleGroupProps {
  children: ReactNode;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

export const AccessibleGroup: React.FC<AccessibleGroupProps> = ({
  children,
  accessibilityLabel,
  style,
}) => (
  <View
    style={style}
    accessible={true}
    accessibilityLabel={accessibilityLabel}
    accessibilityRole="summary"
  >
    {children}
  </View>
);

// Live region for dynamic content updates
interface LiveRegionProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  politeness?: 'polite' | 'assertive' | 'none';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  style,
  politeness = 'polite',
}) => (
  <View
    style={style}
    accessibilityLiveRegion={politeness}
  >
    {children}
  </View>
);

// Skip link for keyboard navigation (mainly for web/tablet)
interface SkipLinkProps {
  targetId: string;
  label?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label = 'Skip to main content',
}) => {
  // This is mainly useful for web accessibility
  // On native, VoiceOver/TalkBack handle navigation differently
  return null;
};

// Minimum touch target size (44x44 points as per WCAG)
export const MINIMUM_TOUCH_TARGET = 44;

// Ensure touch target meets minimum size
export const ensureMinimumTouchTarget = (
  size: number
): number => Math.max(size, MINIMUM_TOUCH_TARGET);

// Accessibility constants
export const A11Y_CONSTANTS = {
  MINIMUM_TOUCH_TARGET: 44,
  MINIMUM_CONTRAST_RATIO: 4.5,
  MINIMUM_CONTRAST_RATIO_LARGE: 3,
  FOCUS_RING_WIDTH: 2,
} as const;
