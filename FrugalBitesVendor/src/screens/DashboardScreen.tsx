import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { analyticsService, orderService } from '../services/api';

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();

  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['vendorAnalytics'],
    queryFn: analyticsService.getAnalytics,
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['vendorOrders'],
    queryFn: orderService.getMyOrders,
  });

  const pendingOrders = orders?.filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED') || [];

  const onRefresh = () => {
    refetchAnalytics();
    refetchOrders();
  };

  // Use real data or show zeros if loading
  const stats = analytics || {
    totalOrders: 0,
    totalRevenue: 0,
    totalFoodSaved: 0,
    averageRating: 0,
    todayOrders: 0,
    todayRevenue: 0,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={analyticsLoading || ordersLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.businessName}>{user?.businessName || 'Restaurant'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
            {pendingOrders.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{pendingOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Ionicons name="receipt-outline" size={24} color="#16a34a" />
              <Text style={styles.statValue}>{stats.todayOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBlue]}>
              <Ionicons name="cash-outline" size={24} color="#2563eb" />
              <Text style={styles.statValue}>RON {stats.todayRevenue?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* All Time Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Time</Text>
          <View style={styles.allTimeGrid}>
            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeValue}>{stats.totalOrders}</Text>
              <Text style={styles.allTimeLabel}>Total Orders</Text>
            </View>
            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeValue}>RON {stats.totalRevenue?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.allTimeLabel}>Revenue</Text>
            </View>
            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeValue}>{stats.totalFoodSaved || 0}</Text>
              <Text style={styles.allTimeLabel}>Items Saved</Text>
            </View>
            <View style={styles.allTimeCard}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.allTimeValue}>{stats.averageRating?.toFixed(1) || '0.0'}</Text>
              </View>
              <Text style={styles.allTimeLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Pending Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Orders</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {pendingOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyOrdersText}>No pending orders</Text>
            </View>
          ) : (
            pendingOrders.slice(0, 3).map((order) => (
              <View key={order.orderId} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName}>{order.offerName}</Text>
                  <Text style={styles.orderCustomer}>{order.customerName}</Text>
                  <Text style={styles.orderTime}>
                    Pickup: {new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.orderActions}>
                  <Text style={styles.orderPrice}>RON {order.totalPrice}</Text>
                  <View style={[styles.orderStatus, order.status === 'confirmed' && styles.orderStatusConfirmed]}>
                    <Text style={styles.orderStatusText}>{order.status}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle" size={32} color="#16a34a" />
              <Text style={styles.actionText}>Add Offer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="list" size={32} color="#2563eb" />
              <Text style={styles.actionText}>View Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="bar-chart" size={32} color="#7c3aed" />
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statCardGreen: {
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  statCardBlue: {
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  allTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allTimeCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  allTimeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  allTimeLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyOrders: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyOrdersText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  orderTime: {
    fontSize: 13,
    color: '#16a34a',
    marginTop: 4,
  },
  orderActions: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderStatus: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  orderStatusConfirmed: {
    backgroundColor: '#dbeafe',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default DashboardScreen;
