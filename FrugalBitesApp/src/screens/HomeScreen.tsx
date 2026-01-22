import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import OfferCard from '../components/OfferCard';
import PremiumDealCard from '../components/PremiumDealCard';
import FoodBundleCard from '../components/FoodBundleCard';
import RestaurantCard from '../components/RestaurantCard';
import PromoBannerComponent from '../components/PromoBanner';
import TopHeader from '../components/TopHeader';
import { offerService, merchantService } from '../services/api';
import { OfferDTO } from '../types/offer';
import { MerchantDTO, PromoBanner } from '../types/merchant';
import { RootStackParamList, TabParamList } from '../App';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Request location permission and get user's location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          getCurrentLocation();
        } else {
          Alert.alert('Location Permission Denied', 'Please enable location services in settings to see offers near you.');
        }
      } catch (err) {
        console.warn(err);
      }
    };

    const getCurrentLocation = async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert('Error', 'Unable to get your location. Please enable location services.');
      }
    };

    requestLocationPermission();
  }, []);

  // Fetch offers
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ['offers', userLocation],
    queryFn: () => offerService.getOffersFeed({
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: 10,
    }),
    enabled: !!userLocation,
  });

  // Fetch merchants/restaurants
  const { data: merchants } = useQuery({
    queryKey: ['merchants', userLocation],
    queryFn: () => merchantService.getMerchants({
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: 10,
    }),
    enabled: !!userLocation,
  });

  // Only show premium deals to premium users
  const showPremiumDeals = user?.isPremium;

  // Categorize offers by type
  // Demo data for Premium Deals
  const premiumDeals = (offers?.filter(o => o.discountPercentage >= 40).slice(0, 5) ?? []).concat([
    {
      offerId: 'demo-premium-1',
      title: 'VIP Sushi Combo',
      discountPercentage: 50,
      quantity: 1,
      merchantId: 'demo-merchant-1',
      merchantName: 'Sushi Palace',
      merchantRating: 4.8,
      merchantLogoUrl: '',
      distanceKm: 1.2,
      price: 19.99,
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
    },
    {
      offerId: 'demo-premium-2',
      title: 'VIP Pizza Feast',
      discountPercentage: 45,
      quantity: 1,
      merchantId: 'demo-merchant-2',
      merchantName: 'Pizza Roma',
      merchantRating: 4.5,
      merchantLogoUrl: '',
      distanceKm: 2.1,
      price: 14.99,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    },
  ]);

  // Demo data for Food Bundles
  const foodBundles = [
    {
      offerId: '11111111-1111-1111-1111-111111111112',
      title: 'Vegetable Tempura',
      discountPercentage: 30,
      quantity: 4,
      merchantId: 'merchant-1',
      merchantName: 'Veggie House',
      merchantRating: 4.3,
      merchantLogoUrl: '',
      distanceKm: 3.5,
      price: 29.99,
      imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400',
    },
    {
      offerId: '22222222-2222-2222-2222-222222222222',
      title: 'Classic Cheeseburger',
      discountPercentage: 35,
      quantity: 2,
      merchantId: 'merchant-2',
      merchantName: 'Burger Roma',
      merchantRating: 4.5,
      merchantLogoUrl: '',
      distanceKm: 2.1,
      price: 22.99,
      imageUrl: 'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=400',
    },
    {
      offerId: '33333333-3333-3333-3333-333333333333',
      title: 'Veggie Burger',
      discountPercentage: 25,
      quantity: 3,
      merchantId: 'merchant-3',
      merchantName: 'Green Eats',
      merchantRating: 4.7,
      merchantLogoUrl: '',
      distanceKm: 1.8,
      price: 19.99,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    },
    {
      offerId: '44444444-4444-4444-4444-444444444444',
      title: 'Beef Pho',
      discountPercentage: 20,
      quantity: 2,
      merchantId: 'merchant-4',
      merchantName: 'Pho House',
      merchantRating: 4.6,
      merchantLogoUrl: '',
      distanceKm: 2.5,
      price: 24.99,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    },
    {
      offerId: '55555555-5555-5555-5555-555555555555',
      title: 'Vegetarian Pho',
      discountPercentage: 15,
      quantity: 2,
      merchantId: 'merchant-5',
      merchantName: 'Pho Chay',
      merchantRating: 4.8,
      merchantLogoUrl: '',
      distanceKm: 2.0,
      price: 21.99,
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    },
  ];

  // Dummy restaurant list
  const restaurantList: MerchantDTO[] = [
    {
      merchantId: 'merchant-1',
      businessName: 'Veggie House',
      averageRating: 4.3,
      totalReviews: 120,
      logoUrl: '',
      coverImageUrl: '',
      latitude: 44.43,
      longitude: 26.10,
      city: 'Bucharest',
      description: 'Best vegetarian food in town',
      distance: 3.5,
    },
    {
      merchantId: 'merchant-2',
      businessName: 'Burger Roma',
      averageRating: 4.5,
      totalReviews: 98,
      logoUrl: '',
      coverImageUrl: '',
      latitude: 44.44,
      longitude: 26.11,
      city: 'Bucharest',
      description: 'Juicy burgers and more',
      distance: 2.1,
    },
    {
      merchantId: 'merchant-3',
      businessName: 'Green Eats',
      averageRating: 4.7,
      totalReviews: 150,
      logoUrl: '',
      coverImageUrl: '',
      latitude: 44.45,
      longitude: 26.12,
      city: 'Bucharest',
      description: 'Healthy and tasty',
      distance: 1.8,
    },
    {
      merchantId: 'merchant-4',
      businessName: 'Pho House',
      averageRating: 4.6,
      totalReviews: 110,
      logoUrl: '',
      coverImageUrl: '',
      latitude: 44.46,
      longitude: 26.13,
      city: 'Bucharest',
      description: 'Authentic Vietnamese Pho',
      distance: 2.5,
    },
    {
      merchantId: 'merchant-5',
      businessName: 'Pho Chay',
      averageRating: 4.8,
      totalReviews: 90,
      logoUrl: '',
      coverImageUrl: '',
      latitude: 44.47,
      longitude: 26.14,
      city: 'Bucharest',
      description: 'Vegetarian Pho specialist',
      distance: 2.0,
    },
  ];

  // Dummy offers for All Offers section
  const offers = foodBundles.map(bundle => ({
    offerId: bundle.offerId,
    merchantId: bundle.merchantId,
    foodName: bundle.title,
    description: bundle.title + ' description',
    category: 'RESTAURANT',
    originalPrice: bundle.price * 1.2,
    discountedPrice: bundle.price,
    discountPercentage: bundle.discountPercentage,
    quantity: bundle.quantity,
    quantityUnit: 'PACK',
    imageUrl: bundle.imageUrl,
    pickupStartTime: new Date().toISOString(),
    pickupEndTime: new Date(Date.now() + 3600000).toISOString(),
    allergens: [],
    dietary: 'VEGETARIAN',
    expirationDate: new Date(Date.now() + 86400000).toISOString(),
    isAvailable: true,
    createdAt: new Date().toISOString(),
    merchantName: restaurantList.find(m => m.merchantId === bundle.merchantId)?.businessName || '',
    merchantLogoUrl: '',
    merchantRating: restaurantList.find(m => m.merchantId === bundle.merchantId)?.averageRating,
    distanceKm: restaurantList.find(m => m.merchantId === bundle.merchantId)?.distance,
  }));
  const restaurantList: MerchantDTO[] = merchants || [];

  const promoBanners: PromoBanner[] = [
    {
      id: '1',
      title: 'Weekend Special',
      subtitle: 'All restaurants',
      discount: 40,
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561482?w=600&h=200&fit=crop',
      expiresAt: '2026-01-17',
    },
    {
      id: '2',
      title: 'First Order Bonus',
      subtitle: 'New users get extra discount',
      discount: 50,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=200&fit=crop',
      expiresAt: '2026-01-20',
    },
  ];

  if (isLoading && !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading offers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
      <TopHeader 
        location="Your location"
        distance="5km"
        onLocationPress={() => Alert.alert('Location', 'Change your location')}
        onBagPress={() => navigation.navigate('Cart')}
        onProfilePress={() => navigation.navigate('Profile' as any)}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
      {/* Location Warning */}
      {!userLocation && (
        <View style={styles.locationWarning}>
          <Text style={styles.warningText}>
            📍 Enable location services to see offers near you
          </Text>
        </View>
      )}

      {/* Premium Deals Section */}
      {showPremiumDeals && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👑 Premium Deals</Text>
          <Text style={styles.sectionSubtitle}>Exclusive for VIP members</Text>
          {premiumDeals.length > 0 ? (
            <FlatList
              data={premiumDeals}
              renderItem={({ item }) => (
                <PremiumDealCard
                  offer={item}
                  onPress={() => navigation.navigate('OfferDetail', { offerId: item.offerId })}
                />
              )}
              keyExtractor={(item) => item.offerId}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true}
              contentContainerStyle={styles.horizontalList}
              snapToInterval={212}
              snapToAlignment="start"
              decelerationRate="fast"
            />
          ) : (
            <Text style={styles.noItemsText}>No premium deals available</Text>
          )}
        </View>
      )}

      {/* Food Bundles Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🍱 Food Bundles</Text>
        <Text style={styles.sectionSubtitle}>Great value combos</Text>
        {foodBundles.length > 0 ? (
          <FlatList
            data={foodBundles}
            renderItem={({ item }) => (
              <FoodBundleCard
                offer={item}
                onPress={() => navigation.navigate('OfferDetail', { offerId: item.offerId })}
              />
            )}
            keyExtractor={(item) => item.offerId}
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={192}
            snapToAlignment="start"
            decelerationRate="fast"
          />
        ) : (
          <Text style={styles.noItemsText}>No bundles available</Text>
        )}
      </View>

      {/* Restaurants Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏪 Restaurants Near You</Text>
        <Text style={styles.sectionSubtitle}>Find your favorite spot</Text>
        <FlatList
          data={restaurantList}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => {
                navigation.navigate('RestaurantDetail', {
                  merchantId: item.merchantId,
                  merchant: item,
                });
              }}
            />
          )}
          keyExtractor={(item) => item.merchantId}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          contentContainerStyle={styles.horizontalList}
          snapToInterval={172}
          snapToAlignment="start"
          decelerationRate="fast"
        />
      </View>

      {/* Promo Banners */}
      <View style={styles.bannersSection}>
        <Text style={styles.sectionTitle}>🎉 Special Offers</Text>
        {promoBanners.map((banner) => (
          <PromoBannerComponent
            key={banner.id}
            banner={banner}
            onPress={() => console.log('Banner pressed:', banner.id)}
          />
        ))}
      </View>

      {/* All Offers Section */}
      {offers && offers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 All Available Offers</Text>
          <FlatList
            data={offers}
            renderItem={({ item }) => (
              <OfferCard
                offer={item}
                onPress={() => {
                  if (item.merchantId) {
                    navigation.navigate('RestaurantDetail', {
                      merchantId: item.merchantId,
                      merchant: {
                        merchantId: item.merchantId,
                        businessName: item.merchantName,
                        averageRating: item.merchantRating || 0,
                        totalReviews: 0,
                        logoUrl: item.merchantLogoUrl,
                        distance: item.distanceKm,
                      } as MerchantDTO,
                    });
                  }
                }}
              />
            )}
            keyExtractor={(item) => item.offerId}
            numColumns={2}
            contentContainerStyle={styles.offersGrid}
            scrollEnabled={false}
          />
        </View>
      )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading offers</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  locationWarning: {
    backgroundColor: colors.warning.light,
    borderColor: colors.warning.main,
    borderWidth: 1,
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    color: colors.secondary[800],
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 0,
  },
  noItemsText: {
    fontSize: 14,
    color: colors.text.tertiary,
    paddingVertical: 20,
    textAlign: 'center',
  },
  bannersSection: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
    marginTop: 8,
  },
  offersGrid: {
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorContainer: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.error.main,
  },
});

export default HomeScreen;