import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  // Categorize offers by type
  const premiumDeals = offers?.filter(o => o.discountPercentage >= 40).slice(0, 5) || [];
  const foodBundles = offers?.filter(o => o.quantity > 1).slice(0, 5) || [];
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopHeader 
        location="Your location"
        distance="5km"
        onLocationPress={() => Alert.alert('Location', 'Change your location')}
        onBagPress={() => navigation.navigate('Cart')}
        onProfilePress={() => navigation.navigate('Profile' as any)}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Location Warning */}
      {!userLocation && (
        <View style={styles.locationWarning}>
          <Text style={styles.warningText}>
            📍 Enable location services to see offers near you
          </Text>
        </View>
      )}

      {/* Premium Deals Section */}
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
    paddingBottom: 100,
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