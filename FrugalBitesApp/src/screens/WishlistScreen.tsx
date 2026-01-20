import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WishlistScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddAllToCart = () => {
    wishlist.forEach(item => {
      const offer = {
        offerId: item.offerId,
        merchantId: '00000000-0000-0000-0000-000000000000',
        foodName: item.foodName,
        description: item.foodName,
        category: 'OTHER' as any,
        originalPrice: item.originalPrice,
        discountedPrice: item.discountedPrice,
        discountPercentage: 0,
        quantity: 1,
        quantityUnit: 'UNIT' as any,
        imageUrl: item.imageUrl,
        pickupStartTime: new Date().toISOString(),
        pickupEndTime: new Date().toISOString(),
        dietary: 'NONE' as any,
        isAvailable: true,
        createdAt: new Date().toISOString(),
        merchantName: item.merchantName,
      } as any;
      addToCart(offer);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Saved for later</Text>
          <Text style={styles.subtitle}>{wishlist.length} items</Text>
        </View>
        <TouchableOpacity style={styles.addAllButton} onPress={handleAddAllToCart}>
          <Text style={styles.addAllText}>Add all to cart</Text>
        </TouchableOpacity>
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No saved offers yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on offers you love
          </Text>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.wishlistItem}
              onPress={() => navigation.navigate('OfferDetail', { offerId: item.offerId })}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.foodName}
                </Text>
                <Text style={styles.merchantName}>{item.merchantName}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.discountedPrice}>RON {item.discountedPrice.toFixed(0)}</Text>
                  <Text style={styles.originalPrice}>RON {item.originalPrice.toFixed(0)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item.offerId)}
              >
                <Ionicons name="heart" size={24} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.plusButton} onPress={() => {
                const offer = {
                  offerId: item.offerId,
                  merchantId: '00000000-0000-0000-0000-000000000000',
                  foodName: item.foodName,
                  description: item.foodName,
                  category: 'OTHER' as any,
                  originalPrice: item.originalPrice,
                  discountedPrice: item.discountedPrice,
                  discountPercentage: 0,
                  quantity: 1,
                  quantityUnit: 'UNIT' as any,
                  imageUrl: item.imageUrl,
                  pickupStartTime: new Date().toISOString(),
                  pickupEndTime: new Date().toISOString(),
                  dietary: 'NONE' as any,
                  isAvailable: true,
                  createdAt: new Date().toISOString(),
                  merchantName: item.merchantName,
                } as any;
                addToCart(offer);
              }}>
                <Ionicons name="add-circle-outline" size={28} color="#16a34a" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.offerId}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addAllButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addAllText: {
    color: 'white',
    fontWeight: '600',
  },
  plusButton: {
    padding: 6,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  wishlistItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    gap: 12,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    gap: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  merchantName: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  removeButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
});

export default WishlistScreen;
