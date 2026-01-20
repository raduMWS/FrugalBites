import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, Linking } from 'react-native';

const REVIEW_PROMPTED_KEY = '@review_prompted';
const ORDERS_COUNT_KEY = '@orders_count';
const FIRST_LAUNCH_KEY = '@first_launch';

// App Store / Play Store URLs
const IOS_APP_ID = 'com.frugalbites.app'; // Replace with actual App Store ID
const ANDROID_PACKAGE = 'com.frugalbites.app';

// Check if we can request a review
export const canRequestReview = async (): Promise<boolean> => {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return false;

    // Check if we've already prompted recently
    const lastPrompted = await AsyncStorage.getItem(REVIEW_PROMPTED_KEY);
    if (lastPrompted) {
      const daysSincePrompt = (Date.now() - parseInt(lastPrompted)) / (1000 * 60 * 60 * 24);
      // Don't prompt more than once every 90 days
      if (daysSincePrompt < 90) return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking review availability:', error);
    return false;
  }
};

// Request in-app review
export const requestReview = async (): Promise<boolean> => {
  try {
    const canRequest = await canRequestReview();
    if (!canRequest) return false;

    // Check if we can use the native review dialog
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      // Mark as prompted
      await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, Date.now().toString());
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error requesting review:', error);
    return false;
  }
};

// Track completed orders and prompt for review after threshold
export const trackOrderAndMaybeRequestReview = async (): Promise<void> => {
  try {
    // Increment order count
    const countStr = await AsyncStorage.getItem(ORDERS_COUNT_KEY);
    const count = countStr ? parseInt(countStr) + 1 : 1;
    await AsyncStorage.setItem(ORDERS_COUNT_KEY, count.toString());

    // Prompt after 3 successful orders
    if (count === 3 || count === 10 || count === 25) {
      const canRequest = await canRequestReview();
      if (canRequest) {
        // Small delay for better UX
        setTimeout(async () => {
          await requestReview();
        }, 2000);
      }
    }
  } catch (error) {
    console.error('Error tracking order for review:', error);
  }
};

// Check if it's the first launch and track
export const trackFirstLaunch = async (): Promise<boolean> => {
  try {
    const firstLaunch = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (!firstLaunch) {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, Date.now().toString());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error tracking first launch:', error);
    return false;
  }
};

// Prompt user to rate the app with custom dialog
export const promptForRating = async (): Promise<void> => {
  Alert.alert(
    'Enjoying FrugalBites? 🌱',
    'Help us save more food by rating the app! Your feedback helps others discover us.',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Rate App',
        onPress: async () => {
          const success = await requestReview();
          if (!success) {
            // Fallback to store URL
            openStoreListing();
          }
        },
      },
    ],
    { cancelable: true }
  );
};

// Open store listing directly
export const openStoreListing = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      // Open App Store
      const url = `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web URL
        await Linking.openURL(`https://apps.apple.com/app/id${IOS_APP_ID}`);
      }
    } else {
      // Open Google Play
      const url = `market://details?id=${ANDROID_PACKAGE}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web URL
        await Linking.openURL(`https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`);
      }
    }
    // Mark as prompted since they clicked
    await AsyncStorage.setItem(REVIEW_PROMPTED_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error opening store listing:', error);
  }
};

// Check if user should be prompted based on app usage
export const shouldPromptForReview = async (): Promise<boolean> => {
  try {
    const canRequest = await canRequestReview();
    if (!canRequest) return false;

    // Get first launch date
    const firstLaunchStr = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    if (!firstLaunchStr) return false;

    const daysSinceInstall = (Date.now() - parseInt(firstLaunchStr)) / (1000 * 60 * 60 * 24);
    // Wait at least 7 days before prompting
    if (daysSinceInstall < 7) return false;

    // Get order count
    const countStr = await AsyncStorage.getItem(ORDERS_COUNT_KEY);
    const orderCount = countStr ? parseInt(countStr) : 0;
    // Need at least 2 orders
    if (orderCount < 2) return false;

    return true;
  } catch (error) {
    console.error('Error checking if should prompt for review:', error);
    return false;
  }
};

// Reset review tracking (for testing)
export const resetReviewTracking = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      REVIEW_PROMPTED_KEY,
      ORDERS_COUNT_KEY,
      FIRST_LAUNCH_KEY,
    ]);
  } catch (error) {
    console.error('Error resetting review tracking:', error);
  }
};
