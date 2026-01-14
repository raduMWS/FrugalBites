import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MerchantDTO } from '../types/merchant';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555939594-58d7cb561482?w=400&h=200&fit=crop';

interface RestaurantCardProps {
  restaurant: MerchantDTO;
  onPress?: () => void;
  variant?: 'compact' | 'full';
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress, variant = 'compact' }) => {
  const [imageError, setImageError] = useState(false);

  const imageUri = (!imageError && restaurant.coverImageUrl) ? restaurant.coverImageUrl : FALLBACK_IMAGE;

  if (variant === 'full') {
    return (
      <TouchableOpacity style={styles.fullCard} onPress={onPress} activeOpacity={0.7}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.fullImage} 
          onError={() => setImageError(true)}
        />
        <View style={styles.fullContent}>
          <Text style={styles.fullName} numberOfLines={1}>{restaurant.businessName}</Text>
          <View style={styles.fullMeta}>
            <View style={styles.ratingRow}>
              <Text style={styles.fullRating}>⭐ {restaurant.averageRating?.toFixed(1) || 'N/A'}</Text>
              <Text style={styles.fullReviews}>({restaurant.totalReviews || 0})</Text>
            </View>
            {restaurant.distance !== undefined && restaurant.distance > 0 && (
              <Text style={styles.fullDistance}>{restaurant.distance.toFixed(1)} km</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          onError={() => setImageError(true)}
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{restaurant.businessName}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {restaurant.averageRating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.reviews}>({restaurant.totalReviews || 0})</Text>
        </View>
        {restaurant.distance !== undefined && restaurant.distance > 0 && (
          <Text style={styles.distance}>{restaurant.distance.toFixed(1)} km away</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Compact variant (for horizontal scroll)
  card: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  rating: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  reviews: {
    fontSize: 11,
    color: '#999',
  },
  distance: {
    fontSize: 11,
    color: '#666',
  },
  // Full variant (for vertical list)
  fullCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  fullImage: {
    width: '100%',
    height: 160,
  },
  fullContent: {
    padding: 14,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  fullMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullRating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  fullReviews: {
    fontSize: 13,
    color: '#9ca3af',
    marginLeft: 4,
  },
  fullDistance: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default RestaurantCard;
