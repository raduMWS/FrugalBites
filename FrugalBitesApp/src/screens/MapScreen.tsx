import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { offerService, merchantService } from '../services/api';
import { MerchantDTO } from '../types/merchant';
import { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Default location (Bucharest center)
const DEFAULT_LOCATION = {
  lat: 44.4268,
  lng: 26.1025,
};

const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantDTO | null>(null);
  const [filters, setFilters] = useState({
    hideSoldOut: true,
    bonapp: true,
    deal: true,
  });
  const [radius, setRadius] = useState(5);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } else {
        setUserLocation(DEFAULT_LOCATION);
      }
    } catch (err) {
      console.warn(err);
      setUserLocation(DEFAULT_LOCATION);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const { data: merchants } = useQuery({
    queryKey: ['mapMerchants', userLocation, radius],
    queryFn: () => merchantService.getMerchants({
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: radius,
    }),
    enabled: !!userLocation,
  });

  const { data: offers } = useQuery({
    queryKey: ['mapOffers', userLocation, radius],
    queryFn: () => offerService.getOffersFeed({
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: radius,
    }),
    enabled: !!userLocation,
  });

  const merchantOffers = offers?.filter(o => o.merchantId === selectedMerchant?.merchantId) || [];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <SafeAreaView style={styles.topHeader} edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.locationButton} onPress={requestLocation}>
            <Ionicons name="location" size={16} color="#16a34a" />
            <Text style={styles.locationText}>Your location</Text>
            <Text style={styles.radiusText}>+ {radius}km</Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#333" />
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {Object.values(filters).filter(Boolean).length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPills}>
          {filters.hideSoldOut && (
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setFilters({ ...filters, hideSoldOut: false })}
            >
              <Text style={styles.filterPillText}>Hide sold-out</Text>
              <Ionicons name="close-circle" size={16} color="white" />
            </TouchableOpacity>
          )}
          {filters.bonapp && (
            <TouchableOpacity
              style={styles.filterPill}
              onPress={() => setFilters({ ...filters, bonapp: false })}
            >
              <Text style={styles.filterPillText}>Bonapp</Text>
              <Ionicons name="close-circle" size={16} color="white" />
            </TouchableOpacity>
          )}
          {filters.deal && (
            <TouchableOpacity
              style={[styles.filterPill, styles.filterPillOrange]}
              onPress={() => setFilters({ ...filters, deal: false })}
            >
              <Text style={styles.filterPillText}>Deal</Text>
              <Ionicons name="close-circle" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Merchant List */}
      <FlatList
        data={merchants}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: merchant }) => {
          const merchantOfferCount = offers?.filter(o => o.merchantId === merchant.merchantId).length || 0;
          return (
            <TouchableOpacity
              style={styles.merchantCard}
              onPress={() => setSelectedMerchant(merchant)}
            >
              {merchant.logoUrl ? (
                <Image source={{ uri: merchant.logoUrl }} style={styles.merchantLogo} />
              ) : (
                <View style={[styles.merchantLogo, styles.merchantLogoPlaceholder]}>
                  <Ionicons name="restaurant" size={24} color="#16a34a" />
                </View>
              )}
              <View style={styles.merchantInfo}>
                <Text style={styles.merchantName}>{merchant.businessName}</Text>
                <Text style={styles.merchantAddress}>{merchant.city || 'Location'}</Text>
                <View style={styles.merchantMeta}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.merchantRating}>{merchant.averageRating?.toFixed(1) || 'N/A'}</Text>
                  <View style={styles.offerBadge}>
                    <Text style={styles.merchantOffers}>{merchantOfferCount} offers</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.merchantId}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No restaurants nearby</Text>
            <Text style={styles.emptySubtext}>Try expanding your search radius</Text>
          </View>
        }
      />

      {/* Bottom Sheet */}
      {selectedMerchant && (
        <View style={styles.bottomSheet}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedMerchant(null)}
          >
            <Ionicons name="close" size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.sheetHeader}>
            {selectedMerchant.logoUrl ? (
              <Image 
                source={{ uri: selectedMerchant.logoUrl }} 
                style={styles.sheetLogo}
              />
            ) : (
              <View style={[styles.sheetLogo, styles.merchantLogoPlaceholder]}>
                <Ionicons name="restaurant" size={32} color="#16a34a" />
              </View>
            )}
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetName}>{selectedMerchant.businessName}</Text>
              <View style={styles.sheetMeta}>
                <Ionicons name="location" size={14} color="#16a34a" />
                <Text style={styles.sheetAddress}>
                  {selectedMerchant.city || 'Location'}
                </Text>
              </View>
              <View style={styles.sheetMeta}>
                <Ionicons name="star" size={14} color="#fbbf24" />
                <Text style={styles.sheetRating}>
                  {selectedMerchant.averageRating?.toFixed(1) || 'N/A'} ({selectedMerchant.totalReviews || 0} reviews)
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewRestaurantButton}
            onPress={() => {
              navigation.navigate('RestaurantDetail', {
                merchantId: selectedMerchant.merchantId,
                merchant: selectedMerchant,
              });
              setSelectedMerchant(null);
            }}
          >
            <Text style={styles.viewRestaurantText}>View Restaurant</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.offersTitle}>Available Offers</Text>
          
          <FlatList
            data={merchantOffers}
            renderItem={({ item: offer }) => (
              <TouchableOpacity
                style={styles.offerItem}
                onPress={() => {
                  navigation.navigate('RestaurantDetail', {
                    merchantId: selectedMerchant.merchantId,
                    merchant: selectedMerchant,
                  });
                }}
              >
                {offer.imageUrl && (
                  <Image source={{ uri: offer.imageUrl }} style={styles.offerImage} />
                )}
                <View style={styles.offerInfo}>
                  <Text style={styles.offerName}>{offer.foodName}</Text>
                  <View style={styles.offerPricing}>
                    <Text style={styles.offerPrice}>RON {offer.discountedPrice.toFixed(0)}</Text>
                    <Text style={styles.offerOriginalPrice}>RON {offer.originalPrice.toFixed(0)}</Text>
                  </View>
                  <Text style={styles.offerTime}>
                    Today {new Date(offer.pickupStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(offer.pickupEndTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Text>
                </View>
                <TouchableOpacity style={styles.addButton}>
                  <Ionicons name="add" size={24} color="#16a34a" />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.offerId}
            ListEmptyComponent={
              <View style={styles.noOffers}>
                <Text style={styles.noOffersText}>No active offers</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topHeader: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  radiusText: {
    fontSize: 12,
    color: '#666',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#16a34a',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterPills: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterPillOrange: {
    backgroundColor: '#f97316',
  },
  filterPillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  merchantLogo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  merchantLogoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  merchantAddress: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  merchantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  merchantRating: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    marginRight: 8,
  },
  offerBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  merchantOffers: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  sheetLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  sheetInfo: {
    flex: 1,
    gap: 6,
  },
  sheetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sheetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetAddress: {
    fontSize: 14,
    color: '#6b7280',
  },
  sheetRating: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewRestaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  viewRestaurantText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  offerItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  offerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  offerInfo: {
    flex: 1,
    gap: 4,
  },
  offerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  offerPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  offerOriginalPrice: {
    fontSize: 13,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  offerTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  noOffers: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noOffersText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default MapScreen;
