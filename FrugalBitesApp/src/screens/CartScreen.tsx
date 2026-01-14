import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

interface CartScreenProps {
  onClose: () => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onClose }) => {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to your cart first!');
      return;
    }
    Alert.alert(
      'Order Placed!',
      `Your order for ${getTotal().toFixed(2)} RON has been placed. Pick up your items at the scheduled time.`,
      [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            onClose();
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: { offer: any; quantity: number } }) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.offer.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.offer.foodName}</Text>
        <Text style={styles.itemMerchant}>{item.offer.merchantName}</Text>
        <Text style={styles.itemPrice}>{item.offer.discountedPrice.toFixed(2)} RON</Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.offer.offerId, item.quantity - 1)}
        >
          <Ionicons name="remove" size={18} color="#333" />
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.offer.offerId, item.quantity + 1)}
        >
          <Ionicons name="add" size={18} color="#333" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.offer.offerId)}
      >
        <Ionicons name="trash-outline" size={20} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add some delicious offers!</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.offer.offerId}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>{getTotal().toFixed(2)} RON</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemMerchant: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartScreen;
