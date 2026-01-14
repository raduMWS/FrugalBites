import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { OfferDTO } from '../types/offer';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';

interface PremiumDealCardProps {
  offer: OfferDTO;
  onPress?: () => void;
}

const PremiumDealCard: React.FC<PremiumDealCardProps> = ({ offer, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const formatPrice = (price: number) => `${price.toFixed(0)} RON`;

  const imageUri = (!imageError && offer.imageUrl) ? offer.imageUrl : FALLBACK_IMAGE;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          onError={() => setImageError(true)}
        />
        <View style={styles.premiumBadge}>
          <Text style={styles.badgeText}>👑 VIP</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.foodName} numberOfLines={2}>{offer.foodName}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.discountedPrice}>{formatPrice(offer.discountedPrice)}</Text>
          <Text style={styles.originalPrice}>{formatPrice(offer.originalPrice)}</Text>
        </View>
        <Text style={styles.merchant}>{offer.merchantName}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 200,
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
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350f',
  },
  content: {
    padding: 10,
  },
  foodName: {
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  merchant: {
    fontSize: 12,
    color: '#666',
  },
});

export default PremiumDealCard;
