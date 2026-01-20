import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { offerService } from '../services/api';
import { RootStackParamList } from '../App';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { CircularBackButton } from '../components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'OfferDetail'>;

const OfferDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { offerId } = route.params;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => offerService.getOffer(offerId),
  });

  const isFavorite = offer ? isInWishlist(offer.offerId) : false;

  const handleToggleFavorite = () => {
    if (offer) {
      if (isFavorite) {
        removeFromWishlist(offer.offerId);
      } else {
        addToWishlist({
          offerId: offer.offerId,
          foodName: offer.foodName,
          merchantName: offer.merchantName || 'Restaurant',
          imageUrl: offer.imageUrl || '',
          discountedPrice: offer.discountedPrice,
          originalPrice: offer.originalPrice,
        });
      }
    }
  };

  const handleAddToCart = () => {
    if (offer) {
      for (let i = 0; i < quantity; i++) {
        addToCart(offer);
      }
      navigation.goBack();
    }
  };

  const handleOpenMaps = () => {
    // Open merchant detail screen instead since we don't have address
    if (offer?.merchantId) {
      navigation.navigate('RestaurantDetail', {
        merchantId: offer.merchantId,
      });
    }
  };

  if (isLoading || !offer) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const pickupStart = new Date(offer.pickupStartTime);
  const pickupEnd = new Date(offer.pickupEndTime);
  const isToday = pickupStart.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: offer.imageUrl }} style={styles.heroImage} />
          
          {/* Back Button */}
          <CircularBackButton style={styles.backButton} />

          {/* Save for later */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? "#16a34a" : "#1f2937"}
            />
            <Text style={styles.saveButtonText}>Save for later</Text>
          </TouchableOpacity>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="bag-outline" size={24} color="#1f2937" />
          </TouchableOpacity>

          {/* Stock Badge */}
          {offer.quantity <= 5 && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>{offer.quantity} left</Text>
            </View>
          )}

          {/* Merchant Name Badge */}
          <View style={styles.merchantBadge}>
            <Text style={styles.merchantBadgeText}>{offer.merchantName}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{offer.foodName}</Text>

          {/* Pickup Time */}
          <View style={styles.pickupRow}>
            <Text style={styles.pickupLabel}>Pick up:</Text>
            <Text style={styles.pickupTime}>
              {isToday ? 'Today' : pickupStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' '}
              {pickupStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
              {' - '}
              {pickupEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>RON {offer.originalPrice.toFixed(0)}</Text>
              <Text style={styles.discountedPrice}>RON {offer.discountedPrice.toFixed(0)}</Text>
            </View>
          </View>

          {/* Address */}
          <TouchableOpacity style={styles.addressRow} onPress={handleOpenMaps}>
            <Ionicons name="location" size={20} color="#16a34a" />
            <Text style={styles.addressText}>{offer.merchantName}</Text>
            <Ionicons name="open-outline" size={18} color="#6b7280" />
          </TouchableOpacity>

          {/* What you could get */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What you could get</Text>
            <Text style={styles.description}>{offer.description}</Text>
            <TouchableOpacity>
              <Text style={styles.readMore}>Read more</Text>
            </TouchableOpacity>
          </View>

          {/* Rating Placeholder */}
          <View style={styles.ratingSection}>
            <Ionicons name="star-outline" size={64} color="#d1d5db" />
            <Text style={styles.ratingPlaceholder}>
              Ratings show after 5 reviews. Be one of the first!
            </Text>
          </View>

          {/* View Store Button */}
          {offer.merchantId && (
            <TouchableOpacity
              style={styles.viewStoreButton}
              onPress={() => {
                navigation.navigate('RestaurantDetail', {
                  merchantId: offer.merchantId,
                });
              }}
            >
              <Text style={styles.viewStoreText}>View store (2 available products)</Text>
            </TouchableOpacity>
          )}

          {/* Ingredients and allergens */}
          <TouchableOpacity style={styles.ingredientsRow}>
            <Ionicons name="leaf" size={20} color="#16a34a" />
            <Text style={styles.ingredientsText}>Ingredients and allergens</Text>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.quantitySelector}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Ionicons name="remove" size={24} color="#16a34a" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity(Math.min(offer.quantity, quantity + 1))}
          >
            <Ionicons name="add" size={24} color="#16a34a" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            offer.quantity === 0 && styles.addToCartButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={offer.quantity === 0}
        >
          <Text style={styles.addToCartText}>Add to cart</Text>
          <Text style={styles.addToCartPrice}>RON {(offer.discountedPrice * quantity).toFixed(0)}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    position: 'absolute',
    top: 60,
    left: '50%',
    transform: [{ translateX: -75 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  cartButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stockText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  merchantBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  merchantBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  pickupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  pickupLabel: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
    marginRight: 8,
  },
  pickupTime: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: 'bold',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  originalPrice: {
    fontSize: 16,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 8,
  },
  readMore: {
    fontSize: 15,
    color: '#16a34a',
    fontWeight: '600',
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  ratingPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  viewStoreButton: {
    backgroundColor: '#dcfce7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  viewStoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  ingredientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  ingredientsText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 16,
  },
  quantityButton: {
    padding: 12,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  addToCartPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default OfferDetailScreen;
