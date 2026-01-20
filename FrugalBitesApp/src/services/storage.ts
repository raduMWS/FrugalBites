import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfferCategory } from '../types/offer';

const FILTERS_STORAGE_KEY = '@saved_filters';
const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface SavedFilters {
  categories: OfferCategory[];
  dietaryTypes: string[];
  maxDistance: number;
  minDiscount: number;
  sortBy: 'distance' | 'discount' | 'price' | 'endTime';
  priceRange: {
    min: number;
    max: number;
  };
}

const defaultFilters: SavedFilters = {
  categories: [],
  dietaryTypes: [],
  maxDistance: 10, // km
  minDiscount: 0,
  sortBy: 'distance',
  priceRange: {
    min: 0,
    max: 100,
  },
};

// Filter persistence
export const saveFilters = async (filters: Partial<SavedFilters>): Promise<void> => {
  try {
    const current = await getFilters();
    const updated = { ...current, ...filters };
    await AsyncStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving filters:', error);
  }
};

export const getFilters = async (): Promise<SavedFilters> => {
  try {
    const stored = await AsyncStorage.getItem(FILTERS_STORAGE_KEY);
    if (stored) {
      return { ...defaultFilters, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error getting filters:', error);
  }
  return defaultFilters;
};

export const clearFilters = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FILTERS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing filters:', error);
  }
};

// Recent searches
export const addRecentSearch = async (search: string): Promise<void> => {
  try {
    const searches = await getRecentSearches();
    // Remove if already exists
    const filtered = searches.filter((s) => s.toLowerCase() !== search.toLowerCase());
    // Add to beginning
    const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding recent search:', error);
  }
};

export const getRecentSearches = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting recent searches:', error);
  }
  return [];
};

export const clearRecentSearches = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
};

// Favorites (local cache)
const FAVORITES_CACHE_KEY = '@favorites_cache';

export const cacheFavorites = async (favoriteIds: number[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favoriteIds));
  } catch (error) {
    console.error('Error caching favorites:', error);
  }
};

export const getCachedFavorites = async (): Promise<number[]> => {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_CACHE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting cached favorites:', error);
  }
  return [];
};

// Cart (offline support)
const CART_STORAGE_KEY = '@cart_data';

export interface CartItem {
  offerId: number;
  quantity: number;
  addedAt: number;
}

export const saveCart = async (items: CartItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

export const getCart = async (): Promise<CartItem[]> => {
  try {
    const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting cart:', error);
  }
  return [];
};

export const clearCart = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

// User preferences
const USER_PREFS_KEY = '@user_preferences';

export interface UserPreferences {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  newOffersNearby: boolean;
  orderUpdates: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
}

const defaultPreferences: UserPreferences = {
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: true,
  newOffersNearby: true,
  orderUpdates: true,
  marketingEmails: false,
  language: 'en',
  currency: 'USD',
};

export const saveUserPreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
  try {
    const current = await getUserPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(USER_PREFS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(USER_PREFS_KEY);
    if (stored) {
      return { ...defaultPreferences, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error getting user preferences:', error);
  }
  return defaultPreferences;
};

// Onboarding
const ONBOARDING_COMPLETE_KEY = '@onboarding_complete';

export const setOnboardingComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding complete:', error);
  }
};

export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
  }
  return false;
};
