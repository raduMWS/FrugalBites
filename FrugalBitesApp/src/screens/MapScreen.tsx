import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { offerService, merchantService } from '../services/api';
import { MerchantDTO } from '../types/merchant';
import { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Default location (Bucharest center)
const DEFAULT_LOCATION = {
  lat: 44.4268,
  lng: 26.1025,
};

const MapScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantDTO | null>(null);
  const [mapReady, setMapReady] = useState(false);
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
        const newLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setUserLocation(newLocation);
        
        // Center map on user location
        if (mapRef.current && mapReady) {
          mapRef.current.animateToRegion({
            latitude: newLocation.lat,
            longitude: newLocation.lng,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }, 500);
        }
      } else {
        // Use default location if permission denied
        setUserLocation(DEFAULT_LOCATION);
      }
    } catch (err) {
      console.warn(err);
      setUserLocation(DEFAULT_LOCATION);
    }
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 500);
    }
  };

  const handleMarkerPress = (merchant: MerchantDTO) => {
    setSelectedMerchant(merchant);
    
    // Center map on selected merchant
    if (mapRef.current && merchant.latitude && merchant.longitude) {
      mapRef.current.animateToRegion({
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 300);
    }
  };

  const onMapReady = () => {
    setMapReady(true);
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

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: userLocation?.lat || DEFAULT_LOCATION.lat,
          longitude: userLocation?.lng || DEFAULT_LOCATION.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onMapReady={onMapReady}
        onPress={() => setSelectedMerchant(null)}
      >
        {/* Merchant Markers */}
        {merchants?.map((merchant) => {
          if (!merchant.latitude || !merchant.longitude) return null;
          
          const merchantOfferCount = offers?.filter(o => o.merchantId === merchant.merchantId).length || 0;
          const isSelected = selectedMerchant?.merchantId === merchant.merchantId;
          
          return (
            <Marker
              key={merchant.merchantId}
              coordinate={{
                latitude: merchant.latitude,
                longitude: merchant.longitude,
              }}
              onPress={() => handleMarkerPress(merchant)}
            >
              <View style={[
                styles.markerContainer,
                isSelected && styles.markerContainerSelected
              ]}>
                <View style={[
                  styles.markerBadge,
                  isSelected && styles.markerBadgeSelected
                ]}>
                  <Text style={styles.markerBadgeText}>{merchantOfferCount}</Text>
                </View>
                {merchant.logoUrl ? (
                  <Image source={{ uri: merchant.logoUrl }} style={styles.markerImage} />
                ) : (
                  <View style={styles.markerImagePlaceholder}>
                    <Ionicons name="restaurant" size={20} color="#16a34a" />
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Center on User Button */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Ionicons name="locate" size={24} color="#16a34a" />
      </TouchableOpacity>

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
            {selectedMerchant.logoUrl && (
              <Image 
                source={{ uri: selectedMerchant.logoUrl }} 
                style={styles.sheetLogo}
              />
            )}
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetName}>{selectedMerchant.businessName}</Text>
              <View style={styles.sheetMeta}>
                <Ionicons name="location" size={14} color="#16a34a" />
                <Text style={styles.sheetAddress}>
                  {selectedMerchant.city || 'Bucharest'}
                </Text>
              </View>
            </View>
          </View>

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
    backgroundColor: '#fff',
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
  map: {
    flex: 1,
    zIndex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainerSelected: {
    transform: [{ scale: 1.2 }],
  },
  markerBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#16a34a',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 2,
    borderColor: 'white',
  },
  markerBadgeSelected: {
    backgroundColor: '#dc2626',
  },
  markerBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  markerImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#16a34a',
  },
  markerImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0fdf4',
    borderWidth: 3,
    borderColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 5,
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
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
    backgroundColor: '#f59e0b',
  },
  filterPillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
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
    marginBottom: 20,
  },
  sheetLogo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  sheetInfo: {
    flex: 1,
    gap: 8,
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
