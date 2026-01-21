import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { OfferDTO } from '../types/offer';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';

interface FoodBundleCardProps {
  offer: OfferDTO;
  onPress?: () => void;
}

const FoodBundleCard: React.FC<FoodBundleCardProps> = ({ offer, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const formatPrice = (price: number | undefined | null) => {
    if (typeof price !== 'number' || isNaN(price)) return '-';
    return `${price.toFixed(0)} RON`;
  };

  const imageUri = (!imageError && offer.imageUrl) ? offer.imageUrl : FALLBACK_IMAGE;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          onError={() => setImageError(true)}
        />
        <View style={styles.bundleBadge}>
          <Text style={styles.badgeText}>Bundle</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.foodName} numberOfLines={2}>{offer.foodName}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.discountedPrice}>{formatPrice(offer.discountedPrice)}</Text>
          <Text style={styles.originalPrice}>{formatPrice(offer.originalPrice)}</Text>
        </View>
        <Text style={styles.quantity}>Qty: {offer.quantity}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 180,
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
    position: 'relative',
    height: 110,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 36,
  },
  bundleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 10,
  },
  foodName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  discountedPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  originalPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantity: {
    fontSize: 11,
    color: '#666',
  },
});

export default FoodBundleCard;
