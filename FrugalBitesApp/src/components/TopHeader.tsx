import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

interface TopHeaderProps {
  location?: string;
  distance?: string;
  onLocationPress?: () => void;
  onBagPress?: () => void;
  onProfilePress?: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({
  location = 'Your location',
  distance = '5km',
  onLocationPress,
  onBagPress,
  onProfilePress,
}) => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.locationContainer} onPress={onLocationPress}>
        <Ionicons name="location" size={18} color="#16a34a" />
        <Text style={styles.locationText}>{location}</Text>
        <Text style={styles.distanceText}>+ {distance}</Text>
        <Ionicons name="chevron-down" size={16} color="#333" />
      </TouchableOpacity>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onBagPress}>
          <Ionicons name="bag-outline" size={24} color="#333" />
          {itemCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onProfilePress}>
          <Ionicons name="person-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default TopHeader;
