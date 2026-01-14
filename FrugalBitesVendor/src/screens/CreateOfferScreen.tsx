import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { offerService } from '../services/api';

const CATEGORIES = [
  { id: 'PREPARED_MEALS', label: 'Meals', icon: 'restaurant' },
  { id: 'BAKERY', label: 'Bakery', icon: 'cafe' },
  { id: 'GROCERIES', label: 'Groceries', icon: 'basket' },
  { id: 'DRINKS', label: 'Drinks', icon: 'beer' },
  { id: 'OTHER', label: 'Other', icon: 'grid' },
];

const CreateOfferScreen: React.FC = () => {
  const navigation = useNavigation();
  const [image, setImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('meals');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [pickupStart, setPickupStart] = useState('17:00');
  const [pickupEnd, setPickupEnd] = useState('19:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a name for your offer');
      return;
    }
    if (!originalPrice || !discountedPrice) {
      Alert.alert('Missing Information', 'Please enter both prices');
      return;
    }
    if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
      Alert.alert('Invalid Price', 'Discounted price must be less than original price');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse pickup times - create datetime for today
      const now = new Date();
      const [startHour, startMin] = pickupStart.split(':').map(Number);
      const [endHour, endMin] = pickupEnd.split(':').map(Number);
      
      const pickupStartTime = new Date(now);
      pickupStartTime.setHours(startHour, startMin, 0, 0);
      
      const pickupEndTime = new Date(now);
      pickupEndTime.setHours(endHour, endMin, 0, 0);

      await offerService.createOffer({
        foodName: name.trim(),
        description: description.trim() || undefined,
        category: category,
        originalPrice: parseFloat(originalPrice),
        discountedPrice: parseFloat(discountedPrice),
        quantity: parseInt(quantity) || 1,
        quantityUnit: 'PIECE',
        imageUrl: image || undefined,
        pickupStartTime: pickupStartTime.toISOString(),
        pickupEndTime: pickupEndTime.toISOString(),
      });

      Alert.alert('Success!', 'Your offer has been created', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Create offer error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const discount = originalPrice && discountedPrice
    ? Math.round((1 - parseFloat(discountedPrice) / parseFloat(originalPrice)) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Offer</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.selectedImage} />
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="white" />
                  <Text style={styles.imageOverlayText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#9ca3af" />
                <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                <Text style={styles.imagePlaceholderHint}>Recommended: 16:9 ratio</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Offer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Surprise Bag, Pastry Box"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe what customers might receive..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      category === cat.id && styles.categoryItemActive,
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={20}
                      color={category === cat.id ? '#16a34a' : '#6b7280'}
                    />
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.id && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Prices */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pricing *</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Original Price</Text>
                  <View style={styles.currencyInput}>
                    <Text style={styles.currency}>€</Text>
                    <TextInput
                      style={styles.priceField}
                      placeholder="0.00"
                      value={originalPrice}
                      onChangeText={setOriginalPrice}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Discounted Price</Text>
                  <View style={styles.currencyInput}>
                    <Text style={styles.currency}>€</Text>
                    <TextInput
                      style={styles.priceField}
                      placeholder="0.00"
                      value={discountedPrice}
                      onChangeText={setDiscountedPrice}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% off</Text>
                </View>
              )}
            </View>

            {/* Quantity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Available Quantity *</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}
                >
                  <Ionicons name="remove" size={24} color="#16a34a" />
                </TouchableOpacity>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={(text) => setQuantity(text.replace(/[^0-9]/g, '') || '1')}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(String(parseInt(quantity) + 1))}
                >
                  <Ionicons name="add" size={24} color="#16a34a" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Pickup Time */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pickup Window *</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>From</Text>
                  <TextInput
                    style={styles.timeField}
                    value={pickupStart}
                    onChangeText={setPickupStart}
                    placeholder="17:00"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <Ionicons name="arrow-forward" size={20} color="#9ca3af" style={{ marginTop: 24 }} />
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>To</Text>
                  <TextInput
                    style={styles.timeField}
                    value={pickupEnd}
                    onChangeText={setPickupEnd}
                    placeholder="19:00"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Creating...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="white" />
                <Text style={styles.submitButtonText}>Create Offer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  imagePicker: {
    height: 200,
    backgroundColor: '#e5e7eb',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  imagePlaceholderHint: {
    fontSize: 13,
    color: '#9ca3af',
  },
  form: {
    padding: 16,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryItemActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryLabelActive: {
    color: '#16a34a',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currency: {
    fontSize: 18,
    color: '#6b7280',
    marginRight: 4,
  },
  priceField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  discountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  quantityInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    minWidth: 60,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  timeField: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateOfferScreen;
