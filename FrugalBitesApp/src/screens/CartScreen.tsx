import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
// Dummy cart context for testing
const useCart = () => ({
  items: [
    {
      offer: {
        offerId: '11111111-1111-1111-1111-111111111112',
        foodName: 'Vegetable Tempura',
        price: 29.99,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
      },
      quantity: 2,
    },
    {
      offer: {
        offerId: '22222222-2222-2222-2222-222222222222',
        foodName: 'Classic Cheeseburger',
        price: 22.99,
        imageUrl: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=400',
      },
      quantity: 1,
    },
  ],
  removeFromCart: (id: string) => {},
  updateQuantity: (id: string, qty: number) => {},
  getTotal: () => 29.99 * 2 + 22.99,
  clearCart: () => {},
});
import { orderService } from '../services/api';
import { logger } from '../services/logger';
import PaymentSheet from '../components/PaymentSheet';
import { CloseButton } from '../components';

const cartLogger = logger.withContext('Cart');

interface PendingPayment {
  orderId: string;
  amount: number;
}

const CartScreen: React.FC = () => {
  const navigation = useNavigation();
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Add some items to your cart first!');
      return;
    }

    setIsLoading(true);
    cartLogger.info('Starting checkout', { itemCount: items.length, total: getTotal() });

    try {
      // For now, create order for the first item (TODO: support multiple items per order)
      // In a production app, you might want to create a single order with multiple items
      const firstItem = items[0];
      const order = await orderService.createOrder({
        offerId: firstItem.offer.offerId,
        quantity: firstItem.quantity,
      });

      cartLogger.info('Order created, proceeding to payment', { orderId: order.orderId });

      // Convert price to cents for Stripe
      const amountInCents = Math.round(order.totalPrice * 100);

      setPendingPayment({
        orderId: order.orderId,
        amount: amountInCents,
      });
      setShowPayment(true);
    } catch (error: any) {
      cartLogger.error('Order creation failed', { error: error.message });
      
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to create order. Please try again.';
      Alert.alert('Order Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    cartLogger.info('Payment successful');
    setShowPayment(false);
    setPendingPayment(null);
    clearCart();
    Alert.alert('Success!', 'Your order has been placed successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handlePaymentCancel = async () => {
    cartLogger.info('Payment cancelled');
    setShowPayment(false);
    
    // Optionally cancel the order if payment is cancelled
    if (pendingPayment) {
      try {
        await orderService.cancelOrder(pendingPayment.orderId, { reason: 'Payment cancelled by user' });
        cartLogger.info('Pending order cancelled', { orderId: pendingPayment.orderId });
      } catch (error) {
        cartLogger.error('Failed to cancel pending order', { error });
      }
    }
    
    setPendingPayment(null);
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
        <CloseButton size={28} color="#333" />
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
            <TouchableOpacity 
              style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]} 
              onPress={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.checkoutText}>Checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPayment}
        animationType="slide"
        transparent={true}
        onRequestClose={handlePaymentCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {pendingPayment && (
              <PaymentSheet
                orderId={pendingPayment.orderId}
                amount={pendingPayment.amount}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            )}
          </View>
        </View>
      </Modal>
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
  checkoutButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  checkoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
});

export default CartScreen;
