import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OfferDTO } from '../types/offer';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from './Toast';

interface Props {
  visible: boolean;
  offer: OfferDTO | null;
  onClose: () => void;
}

const OfferQuickView: React.FC<Props> = ({ visible, offer, onClose }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const [qty, setQty] = useState<number>(1);

  if (!offer) return null;

  const inc = () => setQty((q) => q + 1);
  const dec = () => setQty((q) => Math.max(0, q - 1));

  const handleAddToCart = () => {
    const offerToAdd = { ...offer } as any;
    for (let i = 0; i < qty; i++) {
      addToCart(offerToAdd);
    }
    showToast(`${qty} added to cart`);
    onClose();
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(offer.offerId)) {
      removeFromWishlist(offer.offerId);
      showToast('Removed from wishlist');
    } else {
      addToWishlist({
        offerId: offer.offerId,
        foodName: offer.foodName,
        merchantName: offer.merchantName,
        imageUrl: offer.imageUrl || '',
        discountedPrice: offer.discountedPrice,
        originalPrice: offer.originalPrice,
      });
      showToast('Saved for later');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{offer.foodName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color="#374151" />
            </TouchableOpacity>
          </View>

          {offer.imageUrl ? (
            <Image source={{ uri: offer.imageUrl }} style={styles.image} />
          ) : null}

          <Text style={styles.desc}>{offer.description || 'No description'}</Text>

          <View style={styles.row}>
            <Text style={styles.price}>RON {offer.discountedPrice.toFixed(0)}</Text>
            <TouchableOpacity onPress={handleWishlistToggle} style={styles.heartBtn}>
              <Ionicons name={isInWishlist(offer.offerId) ? 'heart' : 'heart-outline'} size={22} color={isInWishlist(offer.offerId) ? '#ef4444' : '#374151'} />
            </TouchableOpacity>
          </View>

          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={dec}>
              <Ionicons name="remove" size={18} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.qtyTxt}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={inc}>
              <Ionicons name="add" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAddToCart}>
              <Text style={styles.addBtnText}>Add to cart</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '85%'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  image: { width: '100%', height: 160, borderRadius: 12, marginVertical: 12 },
  desc: { color: '#6B7280', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 20, fontWeight: '700', color: '#16a34a' },
  heartBtn: { padding: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  qtyBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  qtyTxt: { marginHorizontal: 12, fontSize: 16, minWidth: 20, textAlign: 'center' },
  addBtn: { marginLeft: 16, backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: '700' },
});

export default OfferQuickView;
