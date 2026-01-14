import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../App';
import { colors } from '../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FloatingCartButtonProps {
  bottom?: number;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ bottom = 100 }) => {
  const navigation = useNavigation<NavigationProp>();
  const { getItemCount, getTotal } = useCart();
  
  // Get current route name safely
  const getCurrentRouteName = (): string => {
    try {
      const state = navigation.getState();
      if (state && state.routes && state.routes.length > 0) {
        return state.routes[state.index]?.name || '';
      }
    } catch {
      // Navigation not ready yet
    }
    return '';
  };
  
  const currentRouteName = getCurrentRouteName();
  const itemCount = getItemCount();
  const total = getTotal();
  
  // Don't show if cart is empty or if already on Cart screen
  if (itemCount === 0 || currentRouteName === 'Cart') {
    return null;
  }
  
  return (
    <TouchableOpacity
      style={[styles.container, { bottom }]}
      onPress={() => navigation.navigate('Cart')}
      activeOpacity={0.9}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="cart" size={22} color="white" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          </View>
          <Text style={styles.itemsText}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
        
        <View style={styles.rightSection}>
          <Text style={styles.totalText}>RON {total.toFixed(2)}</Text>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.secondary[500],
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  itemsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FloatingCartButton;
