import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MerchantDTO } from '../types/merchant';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1555939594-58d7cb561482?w=400&h=200&fit=crop';

interface RestaurantCardProps {
  restaurant: MerchantDTO;
  onPress?: () => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const imageUri = (!imageError && restaurant.coverImageUrl) ? restaurant.coverImageUrl : FALLBACK_IMAGE;

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
          <Text style={styles.rating}>⭐ {restaurant.averageRating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({restaurant.totalReviews})</Text>
        </View>
        {restaurant.distance !== undefined && (
          <Text style={styles.distance}>{restaurant.distance.toFixed(1)} km away</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
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
});

export default RestaurantCard;
