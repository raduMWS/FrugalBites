import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { PromoBanner } from '../types/merchant';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=200&fit=crop';

interface PromoBannerProps {
  banner: PromoBanner;
  onPress?: () => void;
}

const PromoBannerComponent: React.FC<PromoBannerProps> = ({ banner, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const imageUri = (!imageError && banner.imageUrl) ? banner.imageUrl : FALLBACK_IMAGE;

  return (
    <TouchableOpacity style={styles.banner} onPress={onPress}>
      <Image 
        source={{ uri: imageUri }} 
        style={styles.image} 
        onError={() => setImageError(true)}
      />
      <View style={styles.overlay}>
        <Text style={styles.discount}>{banner.discount}% OFF</Text>
        <Text style={styles.title}>{banner.title}</Text>
        {banner.subtitle && (
          <Text style={styles.subtitle}>{banner.subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    height: 150,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  discount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fbbf24',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#f0f0f0',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default PromoBannerComponent;
