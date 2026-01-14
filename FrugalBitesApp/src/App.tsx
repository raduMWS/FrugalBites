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
import FloatingCartButton from './components/FloatingCartButton';
import { MerchantDTO } from './types/merchant';

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
  const { isSignedIn, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

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
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
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
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

function App() {
  // Stripe publishable key - only needed for development builds
  const stripePublishableKey = 'pk_test_placeholder'; // Replace with your actual test key

  const AppContent = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RootNavigator />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
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
