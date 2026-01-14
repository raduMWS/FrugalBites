import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [isVIP, setIsVIP] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const mockActiveOrders = [
    {
      id: '1',
      restaurant: 'Pizza Roma',
      item: 'Margherita Pizza',
      price: 20,
      status: 'Ready for pickup',
      pickupTime: '14:00 - 15:00',
    },
  ];

  const mockPastOrders = [
    {
      id: '2',
      restaurant: 'Sushi Palace',
      item: 'Salmon Sushi Roll',
      price: 30,
      status: 'Completed',
      date: '13 Jan 2026',
    },
    {
      id: '3',
      restaurant: 'Burger House',
      item: 'Classic Cheeseburger',
      price: 24,
      status: 'Completed',
      date: '12 Jan 2026',
    },
  ];

  const handleVIPSubscription = () => {
    Alert.alert(
      'VIP Subscription',
      isVIP 
        ? 'Are you sure you want to cancel your VIP subscription?' 
        : 'Subscribe to VIP for exclusive deals and priority access!\n\nPrice: 29 RON/month',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: isVIP ? 'Unsubscribe' : 'Subscribe', 
          onPress: () => setIsVIP(!isVIP),
          style: isVIP ? 'destructive' : 'default'
        },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Orders',
      items: [
        {
          icon: 'receipt-outline',
          title: 'My Orders',
          subtitle: 'View active and past orders',
          onPress: () => setOrdersModalVisible(true),
        },
      ],
    },
    {
      title: 'Membership',
      items: [
        {
          icon: 'diamond-outline',
          title: 'VIP Subscription',
          subtitle: isVIP ? 'Active - Expires Feb 14, 2026' : 'Get exclusive deals',
          onPress: handleVIPSubscription,
          rightElement: (
            <View style={[styles.vipBadge, isVIP && styles.vipBadgeActive]}>
              <Text style={[styles.vipBadgeText, isVIP && styles.vipBadgeTextActive]}>
                {isVIP ? 'VIP' : 'Join'}
              </Text>
            </View>
          ),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Push Notifications',
          subtitle: 'Get notified about new deals',
          onPress: () => setNotificationsEnabled(!notificationsEnabled),
          rightElement: (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e0e0e0', true: '#86efac' }}
              thumbColor={notificationsEnabled ? '#16a34a' : '#f4f3f4'}
            />
          ),
        },
        {
          icon: 'location-outline',
          title: 'Location Settings',
          subtitle: 'Manage location preferences',
          onPress: () => Alert.alert('Location Settings', 'Configure your location preferences'),
        },
        {
          icon: 'card-outline',
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          onPress: () => Alert.alert('Payment Methods', 'Add or remove payment methods'),
        },
      ],
    },
    {
      title: 'Help & Info',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help Center',
          subtitle: 'FAQs and support',
          onPress: () => Alert.alert('Help Center', 'How can we help you today?'),
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          onPress: () => Alert.alert('Terms of Service', 'View our terms and conditions'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Privacy Policy',
          onPress: () => Alert.alert('Privacy Policy', 'View our privacy policy'),
        },
        {
          icon: 'information-circle-outline',
          title: 'About FrugalBites',
          subtitle: 'Version 1.0.0',
          onPress: () => Alert.alert('About', 'FrugalBites v1.0.0\nSave food, save money!'),
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
    <TouchableOpacity
      key={index}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={item.onPress}
    >
      <View style={[styles.menuIconContainer, item.color && { backgroundColor: item.color }]}>
        <Ionicons name={item.icon} size={20} color={item.color ? 'white' : '#16a34a'} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.rightElement || <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
            {isVIP && (
              <View style={styles.vipIndicator}>
                <Ionicons name="diamond" size={12} color="white" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {isVIP && (
            <View style={styles.vipStatus}>
              <Ionicons name="diamond" size={14} color="#f59e0b" />
              <Text style={styles.vipStatusText}>VIP Member</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>156</Text>
            <Text style={styles.statLabel}>RON Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.2kg</Text>
            <Text style={styles.statLabel}>Food Saved</Text>
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, index) =>
                renderMenuItem(item, index, index === section.items.length - 1)
              )}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Orders Modal */}
      <Modal
        visible={ordersModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setOrdersModalVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>My Orders</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'active' && styles.tabActive]}
              onPress={() => setActiveTab('active')}
            >
              <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'past' && styles.tabActive]}
              onPress={() => setActiveTab('past')}
            >
              <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
                Past Orders
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.ordersContent}>
            {activeTab === 'active' ? (
              mockActiveOrders.length > 0 ? (
                mockActiveOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderRestaurant}>{order.restaurant}</Text>
                      <View style={styles.orderStatusBadge}>
                        <Text style={styles.orderStatusText}>{order.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderItem}>{order.item}</Text>
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderPrice}>{order.price} RON</Text>
                      <Text style={styles.orderTime}>Pickup: {order.pickupTime}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyOrders}>
                  <Ionicons name="receipt-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No active orders</Text>
                </View>
              )
            ) : (
              mockPastOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderRestaurant}>{order.restaurant}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <Text style={styles.orderItem}>{order.item}</Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderPrice}>{order.price} RON</Text>
                    <TouchableOpacity style={styles.reorderButton}>
                      <Text style={styles.reorderText}>Reorder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  vipIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  vipStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vipStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: 'white',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  vipBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vipBadgeActive: {
    backgroundColor: '#fbbf24',
  },
  vipBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  vipBadgeTextActive: {
    color: '#78350f',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
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
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#16a34a',
  },
  ordersContent: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderRestaurant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderItem: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
  },
  reorderButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default ProfileScreen;
