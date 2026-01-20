/**
 * FrugalBites Mobile App
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import { NetworkProvider } from './context/NetworkContext';
import { OfflineBanner, ErrorBoundary } from './components';
import { initI18n } from './i18n';
import { initSentry, setUserContext } from './services/crashReporting';
import { registerForPushNotifications } from './services/notifications';
import { linkingConfiguration } from './services/deepLinking';
import { colors } from './theme';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import BrowseScreen from './screens/BrowseScreen';
import MapScreen from './screens/MapScreen';
import WishlistScreen from './screens/WishlistScreen';
import ProfileScreen from './screens/ProfileScreen';
import RestaurantDetailScreen from './screens/RestaurantDetailScreen';
import OfferDetailScreen from './screens/OfferDetailScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import FloatingCartButton from './components/FloatingCartButton';
import { MerchantDTO } from './types/merchant';

// Initialize localization
initI18n();

// Initialize crash reporting
initSentry();

// Conditionally import Stripe (only works in development builds, not Expo Go)
let StripeProvider: React.ComponentType<{ publishableKey: string; children: React.ReactNode }> | null = null;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
  } catch (e) {
    console.warn('Stripe not available - running in Expo Go mode');
  }
}

export type RootStackParamList = {
  MainTabs: undefined;
  RestaurantDetail: { merchantId: string; merchant?: MerchantDTO };
  OfferDetail: { offerId: string };
  Cart: undefined;
  Auth: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string };
  OrderDetails: { orderId: string };
};

export type TabParamList = {
  Home: undefined;
  Browse: undefined;
  Map: undefined;
  Wishlist: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const queryClient = new QueryClient();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Browse':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Wishlist':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }
          
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: colors.tabBar.active,
        tabBarInactiveTintColor: colors.tabBar.inactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar.background,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 10,
          paddingBottom: 25,
          height: 85,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { isSignedIn, isLoading, user } = useAuth();
  const { isDark } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  // Set up push notifications when user signs in
  useEffect(() => {
    if (isSignedIn && user) {
      // Set user context for crash reporting
      setUserContext(user.userId, user.email);
      
      // Register for push notifications
      registerForPushNotifications().then((token) => {
        if (token) {
          console.log('Push token registered:', token.substring(0, 20) + '...');
          // TODO: Send token to backend
        }
      });
    }
  }, [isSignedIn, user]);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_complete');
      setShowOnboarding(completed !== 'true');
    } catch {
      setShowOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  if (isLoading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  // Show onboarding before anything else
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <NavigationContainer linking={linkingConfiguration}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <OfflineBanner />
      {isSignedIn ? (
        <View style={{ flex: 1 }}>
          <Stack.Navigator>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RestaurantDetail"
              component={RestaurantDetailScreen}
              options={{
                title: 'Restaurant',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="OfferDetail"
              component={OfferDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{
                presentation: 'modal',
                title: 'My Cart',
                headerBackTitle: 'Close',
              }}
            />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{
                title: 'Order Details',
                headerBackTitle: 'Back',
              }}
            />
          </Stack.Navigator>
          <FloatingCartButton />
        </View>
      ) : (
        <Stack.Navigator initialRouteName="Auth">
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{
              title: 'Reset Password',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="EmailVerification"
            component={EmailVerificationScreen}
            options={{
              title: 'Verify Email',
              headerBackTitle: 'Back',
            }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

function App() {
  // Stripe publishable key - only needed for development builds
  const stripePublishableKey = 'pk_test_placeholder'; // Replace with your actual test key

  const AppContent = (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastProvider>
                    <RootNavigator />
                  </ToastProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </QueryClientProvider>

    </ErrorBoundary>
  );

  // Wrap with StripeProvider only if available (development build)
  if (StripeProvider && !isExpoGo) {
    return (
      <SafeAreaProvider>
        <StripeProvider publishableKey={stripePublishableKey}>
          {AppContent}
        </StripeProvider>
      </SafeAreaProvider>
    );
  }

  // Expo Go mode - no Stripe
  return (
    <SafeAreaProvider>
      {AppContent}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.eco,
  },
});

export default App;
