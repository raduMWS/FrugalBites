import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const PUSH_TOKEN_KEY = '@push_token';
const NOTIFICATION_PREFS_KEY = '@notification_prefs';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPreferences {
  orderUpdates: boolean;
  newOffers: boolean;
  promotions: boolean;
  reminders: boolean;
}

const defaultPreferences: NotificationPreferences = {
  orderUpdates: true,
  newOffers: true,
  promotions: false,
  reminders: true,
};

// Register for push notifications
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permissions not granted');
      return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Configure for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications about your order status',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10B981',
      });

      await Notifications.setNotificationChannelAsync('offers', {
        name: 'New Offers',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Notifications about new offers nearby',
      });
    }

    // Store token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

// Register device token with backend
export const registerDeviceWithBackend = async (token: string): Promise<boolean> => {
  try {
    await api.post('/auth/register-device', {
      pushToken: token,
      platform: Platform.OS,
      deviceId: Constants.deviceId || 'unknown',
    });
    return true;
  } catch (error) {
    console.error('Error registering device with backend:', error);
    return false;
  }
};

// Get stored push token
export const getStoredPushToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored push token:', error);
    return null;
  }
};

// Save notification preferences
export const saveNotificationPreferences = async (
  prefs: Partial<NotificationPreferences>
): Promise<void> => {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
};

// Get notification preferences
export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error getting notification preferences:', error);
  }
  return defaultPreferences;
};

// Schedule a local notification
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> => {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });
  return id;
};

// Schedule pickup reminder
export const schedulePickupReminder = async (
  orderId: number,
  merchantName: string,
  pickupTime: Date
): Promise<string> => {
  // Remind 15 minutes before pickup
  const reminderTime = new Date(pickupTime.getTime() - 15 * 60 * 1000);
  
  // Only schedule if reminder time is in the future
  if (reminderTime <= new Date()) {
    return '';
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pickup Reminder 🛍️',
      body: `Don't forget to pick up your order from ${merchantName} in 15 minutes!`,
      data: { type: 'pickup_reminder', orderId },
      sound: true,
      categoryIdentifier: 'orders',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });
  return id;
};

// Cancel a scheduled notification
export const cancelNotification = async (notificationId: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
};

// Cancel all notifications for an order
export const cancelOrderNotifications = async (orderId: number): Promise<void> => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.orderId === orderId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

// Get badge count
export const getBadgeCount = async (): Promise<number> => {
  return await Notifications.getBadgeCountAsync();
};

// Set badge count
export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

// Clear all notifications
export const clearAllNotifications = async (): Promise<void> => {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
};

// Add notification response listener
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

// Add notification received listener
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription => {
  return Notifications.addNotificationReceivedListener(callback);
};

// Handle notification tap navigation
export const handleNotificationNavigation = (
  data: Record<string, any>,
  navigate: (screen: string, params?: any) => void
): void => {
  const type = data?.type;
  
  switch (type) {
    case 'order_update':
    case 'order_ready':
    case 'pickup_reminder':
      navigate('OrderDetails', { orderId: data.orderId });
      break;
    case 'new_offer':
      navigate('OfferDetails', { offerId: data.offerId });
      break;
    case 'merchant':
      navigate('MerchantDetails', { merchantId: data.merchantId });
      break;
    default:
      // Navigate to home or notifications screen
      navigate('Home');
  }
};
