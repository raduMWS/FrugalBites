import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { OrderQRCode, BackButton } from '../components';
import { ordersService } from '../services/api';

type RootStackParamList = {
  MainTabs: undefined;
  OrderDetails: { orderId: string };
};

type OrderDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetails'>;
type OrderDetailsRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;

interface OrderDetailsScreenProps {
  navigation: OrderDetailsNavigationProp;
  route: OrderDetailsRouteProp;
}

interface OrderItem {
  name: string;
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
}

interface OrderData {
  id: string;
  orderNumber: string;
  merchantName: string;
  merchantAddress: string;
  merchantPhone?: string;
  status: 'PENDING' | 'CONFIRMED' | 'READY' | 'PICKED_UP' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  serviceFee?: number;
  total: number;
  pickupTime?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  createdAt: string;
  qrCode?: string;
}

const STATUS_CONFIG = {
  PENDING: { color: '#F59E0B', icon: 'time-outline', label: 'Pending' },
  CONFIRMED: { color: '#3B82F6', icon: 'checkmark-circle-outline', label: 'Confirmed' },
  READY: { color: '#10B981', icon: 'bag-check-outline', label: 'Ready for Pickup' },
  PICKED_UP: { color: '#6B7280', icon: 'checkmark-done', label: 'Picked Up' },
  CANCELLED: { color: '#EF4444', icon: 'close-circle-outline', label: 'Cancelled' },
};

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { orderId } = route.params;
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [showQRCode, setShowQRCode] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const orderData = await ordersService.getOrder(orderId);
      setOrder({
        id: orderData.orderId,
        orderNumber: orderData.orderId.substring(0, 8).toUpperCase(),
        merchantName: orderData.merchantName || 'Unknown Merchant',
        merchantAddress: orderData.merchantAddress || '',
        status: orderData.orderStatus as OrderData['status'],
        paymentStatus: orderData.paymentStatus as OrderData['paymentStatus'],
        items: [{
          name: orderData.foodName || 'Food Item',
          quantity: orderData.quantity || 1,
          originalPrice: orderData.totalPrice,
          discountedPrice: orderData.totalPrice,
        }],
        subtotal: orderData.totalPrice,
        discount: 0,
        total: orderData.totalPrice,
        pickupTime: orderData.pickupTime,
        createdAt: orderData.createdAt,
        qrCode: orderData.qrCode,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email us at support@frugalbites.com or call +1-800-FRUGAL',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Order not found'}</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const showQRButton = order.status === 'CONFIRMED' || order.status === 'READY';

  const handleShareReceipt = async () => {
    try {
      const receiptText = generateReceiptText();
      await Share.share({
        message: receiptText,
        title: `FrugalBites Order #${order.orderNumber}`,
      });
    } catch (err) {
      console.error('Error sharing receipt:', err);
    }
  };

  const generateReceiptText = (): string => {
    let text = `🧾 FrugalBites Receipt\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Order #${order.orderNumber}\n`;
    text += `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
    text += `📍 ${order.merchantName}\n`;
    text += `${order.merchantAddress}\n\n`;
    text += `Items:\n`;
    
    order.items.forEach(item => {
      text += `• ${item.quantity}x ${item.name}\n`;
      text += `  $${item.discountedPrice.toFixed(2)} (was $${item.originalPrice.toFixed(2)})\n`;
    });
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Subtotal: $${order.subtotal.toFixed(2)}\n`;
    text += `Discount: -$${order.discount.toFixed(2)}\n`;
    if (order.serviceFee) {
      text += `Service Fee: $${order.serviceFee.toFixed(2)}\n`;
    }
    text += `Total: $${order.total.toFixed(2)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `🌱 Thank you for saving food!`;
    
    return text;
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // API call to cancel order
            console.log('Cancel order:', order.id);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <BackButton color={colors.text} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
        <TouchableOpacity onPress={handleShareReceipt}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statusIcon, { backgroundColor: `${statusConfig.color}20` }]}>
            <Ionicons name={statusConfig.icon as any} size={32} color={statusConfig.color} />
          </View>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={[styles.orderNumber, { color: colors.textSecondary }]}>
            Order #{order.orderNumber}
          </Text>
          
          {showQRButton && order.qrCode && (
            <TouchableOpacity
              style={[styles.qrButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowQRCode(true)}
            >
              <Ionicons name="qr-code" size={20} color="#fff" />
              <Text style={styles.qrButtonText}>Show QR Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Pickup Info */}
{(order.pickupStartTime && order.pickupEndTime) ? (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Window</Text>
            </View>
            <Text style={[styles.pickupTime, { color: colors.text }]}>
              {new Date(order.pickupStartTime!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {' '}
              {new Date(order.pickupStartTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {new Date(order.pickupEndTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ) : order.pickupTime ? (
          <View style={[styles.section, { backgroundColor: colors.surface }]}> 
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Time</Text>
            </View>
            <Text style={[styles.pickupTime, { color: colors.text }]}>
              {new Date(order.pickupTime).toLocaleString()}
            </Text>
          </View>
        ) : null }

        {/* Merchant Info */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pickup Location</Text>
          </View>
          <Text style={[styles.merchantName, { color: colors.text }]}>
            {order.merchantName}
          </Text>
          <Text style={[styles.merchantAddress, { color: colors.textSecondary }]}>
            {order.merchantAddress}
          </Text>
          {order.merchantPhone && (
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={[styles.callButtonText, { color: colors.primary }]}>
                {order.merchantPhone}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          </View>
          
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
                  {item.quantity}x
                </Text>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.itemPrices}>
                <Text style={[styles.originalPrice, { color: colors.textTertiary }]}>
                  ${item.originalPrice.toFixed(2)}
                </Text>
                <Text style={[styles.discountedPrice, { color: colors.text }]}>
                  ${item.discountedPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>
              ${order.subtotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: '#10B981' }]}>Discount</Text>
            <Text style={[styles.totalValue, { color: '#10B981' }]}>
              -${order.discount.toFixed(2)}
            </Text>
          </View>
          {order.serviceFee !== undefined && order.serviceFee > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
                Service Fee
              </Text>
              <Text style={[styles.totalValue, { color: colors.text }]}>
                ${order.serviceFee.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.grandTotalValue, { color: colors.text }]}>
              ${order.total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.error }]}
              onPress={handleCancelOrder}
            >
              <Text style={[styles.cancelButtonText, { color: colors.error }]}>
                Cancel Order
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: colors.surfaceSecondary }]}
            onPress={handleContactSupport}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
            <Text style={[styles.supportButtonText, { color: colors.text }]}>
              Contact Support
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QR Code Modal */}
      {order.qrCode && (
        <Modal
          visible={showQRCode}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQRCode(false)}
        >
          <OrderQRCode
            qrCodeData={order.qrCode}
            orderNumber={order.orderNumber}
            merchantName={order.merchantName}
            pickupTime={order.pickupTime}
            pickupStartTime={order.pickupStartTime}
            pickupEndTime={order.pickupEndTime}
            onClose={() => setShowQRCode(false)}
          />
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    marginBottom: 16,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickupTime: {
    fontSize: 16,
    fontWeight: '500',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  merchantAddress: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
    width: 24,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemPrices: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    gap: 12,
  },
  cancelButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OrderDetailsScreen;
