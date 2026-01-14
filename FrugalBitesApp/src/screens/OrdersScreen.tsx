import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/api';
import { OrderDTO, getOrderStatusLabel, getOrderStatusColor } from '../types/order';
import { logger } from '../services/logger';

const ordersLogger = logger.withContext('OrdersScreen');

interface OrdersScreenProps {
  onClose: () => void;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const queryClient = useQueryClient();

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getMyOrders(),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      ordersLogger.info('Order cancelled successfully');
    },
    onError: (error: any) => {
      ordersLogger.error('Failed to cancel order', { error: error.message });
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
    },
  });

  const activeOrders = orders?.filter(
    (o) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.orderStatus)
  ) || [];

  const pastOrders = orders?.filter(
    (o) => ['PICKED_UP', 'CANCELLED', 'EXPIRED'].includes(o.orderStatus)
  ) || [];

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleCancelOrder = (order: OrderDTO) => {
    if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'CONFIRMED') {
      Alert.alert('Cannot Cancel', 'This order can no longer be cancelled.');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(order.orderId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }: { item: OrderDTO }) => {
    const statusColor = getOrderStatusColor(item.orderStatus);
    const statusLabel = getOrderStatusLabel(item.orderStatus);
    const canCancel = item.orderStatus === 'PENDING' || item.orderStatus === 'CONFIRMED';

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Image
            source={{
              uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop',
            }}
            style={styles.orderImage}
          />
          <View style={styles.orderInfo}>
            <Text style={styles.orderName} numberOfLines={1}>
              {item.foodName}
            </Text>
            <Text style={styles.merchantName}>{item.merchantName}</Text>
            <Text style={styles.orderDate}>
              {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.orderPrice}>{item.totalPrice.toFixed(2)} RON</Text>
            <Text style={styles.quantityText}>x{item.quantity}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(item)}
              disabled={cancelMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.pickupTime && item.orderStatus !== 'PICKED_UP' && item.orderStatus !== 'CANCELLED' && (
          <View style={styles.pickupInfo}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.pickupText}>
              Pickup: {formatTime(item.pickupTime)}
            </Text>
          </View>
        )}

        {item.merchantAddress && (
          <View style={styles.addressInfo}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.merchantAddress}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === 'active' ? 'receipt-outline' : 'time-outline'}
        size={80}
        color="#ccc"
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'active' ? 'No Active Orders' : 'No Past Orders'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'active'
          ? 'Your active orders will appear here'
          : 'Your completed orders will appear here'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16a34a" />
          }
        />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#16a34a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  merchantName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  quantityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  pickupText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default OrdersScreen;
