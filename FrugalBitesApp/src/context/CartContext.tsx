import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OfferDTO } from '../types/offer';

interface CartItem {
  offer: OfferDTO;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (offer: OfferDTO) => void;
  removeFromCart: (offerId: string) => void;
  updateQuantity: (offerId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (offer: OfferDTO) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.offer.offerId === offer.offerId);
      if (existing) {
        return prev.map((item) =>
          item.offer.offerId === offer.offerId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { offer, quantity: 1 }];
    });
  };

  const removeFromCart = (offerId: string) => {
    setItems((prev) => prev.filter((item) => item.offer.offerId !== offerId));
  };

  const updateQuantity = (offerId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(offerId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.offer.offerId === offerId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotal = () => {
    return items.reduce(
      (total, item) => total + item.offer.discountedPrice * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
