import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import OrdersScreen from './OrdersScreen';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

const ProfileScreen: React.FC = () => {
  // Dummy user for testing
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    isVIP: true,
    phoneNumber: '+40-721-123-456',
    createdAt: '2025-12-01',
  };
  const logout = () => Alert.alert('Logout', 'Logged out (mock)');
  const [isVIP, setIsVIP] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ordersModalVisible, setOrdersModalVisible] = useState(false);

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
        <OrdersScreen onClose={() => setOrdersModalVisible(false)} />
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
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default ProfileScreen;
