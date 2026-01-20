import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, Image, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { StackScreenProps } from '@react-navigation/stack';
import OfferCard from '../components/OfferCard';
import { offerService } from '../services/api';
import { OfferDTO } from '../types/offer';
import { MerchantDTO } from '../types/merchant';

type RootStackParamList = {
  Home: undefined;
  RestaurantDetail: { merchantId: string; merchant?: MerchantDTO };
};

type Props = StackScreenProps<RootStackParamList, 'RestaurantDetail'>;

const RestaurantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { merchantId, merchant } = route.params;

  // Fetch offers for this restaurant from API
  const { data: allOffers, isLoading, error } = useQuery({
    queryKey: ['restaurantOffers', merchantId],
    queryFn: async () => {
      // Fetch all offers and filter by merchantId
      const response = await offerService.getOffersFeed({
        lat: merchant?.latitude,
        lng: merchant?.longitude,
        radius: 50, // Large radius to ensure we get the merchant's offers
      });
      return response;
    },
  });

  // Filter offers for this specific merchant
  const offers = allOffers?.filter(offer => offer.merchantId === merchantId) || [];

  const renderOffer = ({ item }: { item: OfferDTO }) => (
    <OfferCard
      offer={item}
      onPress={() => {
        console.log('Offer pressed:', item.offerId);
      }}
    />
  );

  // Show loading or placeholder if merchant data isn't available
  if (!merchant) {
    return (
      <View style={styles.container}>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Restaurant Header */}
      <View style={styles.header}>
        {merchant.coverImageUrl ? (
          <Image source={{ uri: merchant.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.placeholderText}>🏪</Text>
          </View>
        )}
      </View>

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{merchant.businessName || 'Restaurant'}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {merchant.averageRating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.reviews}>({merchant.totalReviews || 0} reviews)</Text>
        </View>
        {merchant.description && (
          <Text style={styles.description}>{merchant.description}</Text>
        )}
        {merchant.distance && (
          <Text style={styles.distance}>📍 {merchant.distance.toFixed(1)} km away</Text>
        )}
      </View>

      {/* Offers Section */}
      <View style={styles.offersSection}>
        <Text style={styles.sectionTitle}>Active Offers</Text>
        
        {isLoading && (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Loading offers...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Error loading offers</Text>
          </View>
        )}

        {offers && offers.length > 0 ? (
          <FlatList
            data={offers}
            renderItem={renderOffer}
            keyExtractor={(item) => item.offerId}
            numColumns={2}
            contentContainerStyle={styles.offersGrid}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No offers available at this restaurant</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 200,
    backgroundColor: '#f3f4f6',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  distance: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  offersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  offersGrid: {
    paddingHorizontal: 0,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default RestaurantDetailScreen;
