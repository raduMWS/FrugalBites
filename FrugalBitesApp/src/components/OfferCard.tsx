import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OfferDTO } from '../types/offer';
import { RootStackParamList } from '../App';
import { useCart } from '../context/CartContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';

interface OfferCardProps {
  offer: OfferDTO;
  onPress?: () => void;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress }) => {
  const navigation = useNavigation<NavigationProp>();
  const { addToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const formatPrice = (price: number) => `RON ${price.toFixed(0)}`;
  const formatDistance = (distance?: number) => distance ? `${distance.toFixed(1)} km` : '';

  const imageUri = (!imageError && offer.imageUrl) ? offer.imageUrl : FALLBACK_IMAGE;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('OfferDetail', { offerId: offer.offerId });
    }
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    addToCart(offer);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: imageUri }} 
          style={styles.image} 
          onError={() => setImageError(true)}
        />

        {/* Discount Badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{offer.discountPercentage}%</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Merchant Info */}
        <View style={styles.merchantInfo}>
          {offer.merchantLogoUrl && (
            <Image source={{ uri: offer.merchantLogoUrl }} style={styles.merchantLogo} />
          )}
          <Text style={styles.merchantName}>{offer.merchantName}</Text>
          {offer.merchantRating && (
            <Text style={styles.rating}>⭐ {offer.merchantRating.toFixed(1)}</Text>
          )}
        </View>

        {/* Food Name */}
        <Text style={styles.foodName} numberOfLines={2}>{offer.foodName}</Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.discountedPrice}>{formatPrice(offer.discountedPrice)}</Text>
          <Text style={styles.originalPrice}>{formatPrice(offer.originalPrice)}</Text>
        </View>

        {/* Quantity */}
        <Text style={styles.quantity}>
          {offer.quantity} {String(offer.quantityUnit || 'unit').toLowerCase()}
        </Text>

        {/* Pickup Time & Distance */}
        <View style={styles.footer}>
          <Text style={styles.pickupTime}>
            Pickup: {new Date(offer.pickupEndTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          {offer.distanceKm && (
            <Text style={styles.distance}>{formatDistance(offer.distanceKm)}</Text>
          )}
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    margin: 4,
    overflow: 'hidden',
    maxWidth: '50%',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
    position: 'relative',
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchantLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  merchantName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  rating: {
    fontSize: 14,
    color: '#fbbf24',
  },
  foodName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  quantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickupTime: {
    fontSize: 12,
    color: '#666',
  },
  distance: {
    fontSize: 12,
    color: '#666',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});

export default OfferCard;