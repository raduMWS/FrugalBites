import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

// Deep link URL scheme
const SCHEME = 'frugalbites';

// Deep link routes
export const DEEP_LINK_ROUTES = {
  offer: 'offer',
  merchant: 'merchant',
  order: 'order',
  verify: 'verify',
  resetPassword: 'reset-password',
  share: 'share',
} as const;

// Create deep link URL
export const createDeepLink = (
  route: keyof typeof DEEP_LINK_ROUTES,
  params?: Record<string, string | number>
): string => {
  let url = `${SCHEME}://${route}`;
  
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }
  
  return url;
};

// Create universal link (for web fallback)
export const createUniversalLink = (
  route: keyof typeof DEEP_LINK_ROUTES,
  params?: Record<string, string | number>
): string => {
  // Replace with your actual domain
  const baseUrl = 'https://frugalbites.app';
  let url = `${baseUrl}/${route}`;
  
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    url += `?${queryString}`;
  }
  
  return url;
};

// Create shareable offer link
export const createOfferShareLink = (offerId: number, offerTitle: string): string => {
  return createUniversalLink('offer', { id: offerId, title: offerTitle });
};

// Create shareable merchant link
export const createMerchantShareLink = (merchantId: number, merchantName: string): string => {
  return createUniversalLink('merchant', { id: merchantId, name: merchantName });
};

// Parse deep link URL
export const parseDeepLink = (url: string): { route: string; params: Record<string, string> } | null => {
  try {
    const parsed = Linking.parse(url);
    
    if (!parsed.path) {
      return null;
    }

    return {
      route: parsed.path,
      params: (parsed.queryParams as Record<string, string>) || {},
    };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

// Handle deep link navigation
export const handleDeepLink = (
  url: string,
  navigate: (screen: string, params?: any) => void
): boolean => {
  const parsed = parseDeepLink(url);
  
  if (!parsed) {
    return false;
  }

  switch (parsed.route) {
    case 'offer':
      if (parsed.params.id) {
        navigate('OfferDetails', { offerId: parseInt(parsed.params.id) });
        return true;
      }
      break;
    
    case 'merchant':
      if (parsed.params.id) {
        navigate('MerchantDetails', { merchantId: parseInt(parsed.params.id) });
        return true;
      }
      break;
    
    case 'order':
      if (parsed.params.id) {
        navigate('OrderDetails', { orderId: parseInt(parsed.params.id) });
        return true;
      }
      break;
    
    case 'verify':
      if (parsed.params.token) {
        navigate('EmailVerification', { token: parsed.params.token, email: parsed.params.email });
        return true;
      }
      break;
    
    case 'reset-password':
      if (parsed.params.token) {
        navigate('ResetPassword', { token: parsed.params.token, email: parsed.params.email });
        return true;
      }
      break;
  }

  return false;
};

// Linking configuration for React Navigation
export const linkingConfiguration = {
  prefixes: [
    `${SCHEME}://`,
    'https://frugalbites.app',
    'https://*.frugalbites.app',
  ],
  config: {
    screens: {
      Home: '',
      OfferDetails: 'offer/:offerId',
      MerchantDetails: 'merchant/:merchantId',
      OrderDetails: 'order/:orderId',
      EmailVerification: 'verify',
      ResetPassword: 'reset-password',
      Search: 'search',
      Profile: 'profile',
      Favorites: 'favorites',
      Orders: 'orders',
      NotFound: '*',
    },
  },
};

// Hook for handling deep links
export const useDeepLinking = (navigate: (screen: string, params?: any) => void) => {
  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const getInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl, navigate);
      }
    };

    getInitialURL();

    // Handle URL changes (app already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url, navigate);
    });

    // Handle notifications
    const notificationSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string | undefined>;
        if (data?.url) {
          handleDeepLink(data.url as string, navigate);
        } else if (data?.type) {
          // Handle notification types
          switch (data.type) {
            case 'order_update':
            case 'order_ready':
              if (data.orderId) navigate('OrderDetails', { orderId: data.orderId });
              break;
            case 'new_offer':
              if (data.offerId) navigate('OfferDetails', { offerId: data.offerId });
              break;
            case 'merchant':
              if (data.merchantId) navigate('MerchantDetails', { merchantId: data.merchantId });
              break;
          }
        }
      }
    );

    return () => {
      subscription.remove();
      notificationSubscription.remove();
    };
  }, [navigate]);
};

// Check if app can open a URL
export const canOpenURL = async (url: string): Promise<boolean> => {
  return await Linking.canOpenURL(url);
};

// Open external URL
export const openURL = async (url: string): Promise<void> => {
  const canOpen = await canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    console.warn('Cannot open URL:', url);
  }
};

// Open phone dialer
export const openPhoneDialer = (phoneNumber: string): Promise<void> => {
  return openURL(`tel:${phoneNumber}`);
};

// Open email client
export const openEmailClient = (email: string, subject?: string, body?: string): Promise<void> => {
  let url = `mailto:${email}`;
  const params: string[] = [];
  
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  return openURL(url);
};

// Open maps with address
export const openMaps = (address: string, lat?: number, lng?: number): Promise<void> => {
  if (lat && lng) {
    // Use coordinates for more accurate location
    return openURL(`https://maps.google.com/?q=${lat},${lng}`);
  }
  return openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
};
