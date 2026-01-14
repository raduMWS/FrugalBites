import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WishlistItem {
  offerId: string;
  foodName: string;
  merchantName: string;
  imageUrl: string;
  discountedPrice: number;
  originalPrice: number;
  addedAt: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => Promise<void>;
  removeFromWishlist: (offerId: string) => Promise<void>;
  isInWishlist: (offerId: string) => boolean;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = '@frugalbites_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveWishlist();
    }
  }, [wishlist, isLoaded]);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveWishlist = async () => {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error('Failed to save wishlist:', error);
    }
  };

  const addToWishlist = async (item: Omit<WishlistItem, 'addedAt'>) => {
    const newItem: WishlistItem = {
      ...item,
      addedAt: new Date().toISOString(),
    };
    setWishlist(prev => [newItem, ...prev.filter(i => i.offerId !== item.offerId)]);
  };

  const removeFromWishlist = async (offerId: string) => {
    setWishlist(prev => prev.filter(item => item.offerId !== offerId));
  };

  const isInWishlist = (offerId: string): boolean => {
    return wishlist.some(item => item.offerId === offerId);
  };

  const clearWishlist = async () => {
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
