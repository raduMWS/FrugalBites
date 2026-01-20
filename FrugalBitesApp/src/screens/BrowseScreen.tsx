import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { offerService, merchantService } from '../services/api';
import OfferCard from '../components/OfferCard';
import RestaurantCard from '../components/RestaurantCard';
import { MerchantDTO } from '../types/merchant';
import { RootStackParamList } from '../App';
import { OfferCategory, DietaryType } from '../types/offer';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BrowseScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'offers' | 'restaurants'>('offers');

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['browseOffers', userLocation],
    queryFn: () => offerService.getOffersFeed({
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: 20,
    }),
    enabled: !!userLocation,
  });

  const { data: merchants, isLoading: merchantsLoading } = useQuery({
    queryKey: ['browseMerchants', userLocation],
    queryFn: () => merchantService.getMerchants({
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: 20,
    }),
    enabled: !!userLocation,
  });

  const categories = [
    { id: 'all', label: 'All', icon: 'apps', apiValue: null },
    { id: 'food', label: 'Food', icon: 'restaurant', apiValue: [1, 2] }, // RESTAURANT, PREPARED_MEALS
    { id: 'bakery', label: 'Bakery', icon: 'cafe', apiValue: [0] }, // BAKERY
    { id: 'grocery', label: 'Grocery', icon: 'cart', apiValue: [3] }, // GROCERIES
    { id: 'vegan', label: 'Vegan', icon: 'leaf', apiValue: null }, // Special case - uses dietary field
  ];

  // Filter offers based on search and category
  const filteredOffers = offers?.filter(offer => {
    const matchesSearch = offer.foodName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         offer.merchantName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const selectedCat = categories.find(c => c.id === selectedCategory);
    let matchesCategory = selectedCategory === 'all';
    
    if (selectedCategory === 'vegan') {
      // Check dietary field for vegan (handle both string enum and number from API)
      matchesCategory = offer.dietary === DietaryType.VEGAN || offer.dietary === ('VEGAN' as DietaryType);
    } else if (selectedCat?.apiValue) {
      // Category is returned as a number from the API
      matchesCategory = selectedCat.apiValue.includes(offer.category as unknown as number);
    }
    
    return matchesSearch && matchesCategory;
  }) || [];

  const filteredMerchants = merchants?.filter(merchant => 
    merchant.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food or restaurants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'offers' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('offers')}
        >
          <Text style={[styles.viewModeText, viewMode === 'offers' && styles.viewModeTextActive]}>
            Offers ({filteredOffers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'restaurants' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('restaurants')}
        >
          <Text style={[styles.viewModeText, viewMode === 'restaurants' && styles.viewModeTextActive]}>
            Restaurants ({filteredMerchants.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      {viewMode === 'offers' && (
        <View style={styles.categoriesWrapper}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={16}
                color={selectedCategory === category.id ? 'white' : '#16a34a'}
              />
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      {offersLoading || merchantsLoading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : viewMode === 'offers' ? (
        <FlatList
          key="offers-grid"
          data={filteredOffers}
          renderItem={({ item }) => (
            <OfferCard
              offer={item}
              onPress={() => navigation.navigate('OfferDetail', { offerId: item.offerId })}
            />
          )}
          keyExtractor={(item) => item.offerId}
          numColumns={2}
          contentContainerStyle={styles.offersGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No offers found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="restaurants-list"
          data={filteredMerchants}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              variant="full"
              onPress={() => {
                navigation.navigate('RestaurantDetail', {
                  merchantId: item.merchantId,
                  merchant: item,
                });
              }}
            />
          )}
          keyExtractor={(item) => item.merchantId}
          contentContainerStyle={styles.restaurantsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No restaurants found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#16a34a',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  viewModeTextActive: {
    color: 'white',
  },
  categoriesWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: 'white',
  },
  categoryChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#16a34a',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16a34a',
  },
  categoryTextActive: {
    color: 'white',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  offersGrid: {
    padding: 16,
    paddingBottom: 100,
  },
  restaurantsList: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BrowseScreen;
