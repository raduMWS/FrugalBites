import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; style?: ViewStyle }> = ({
  lines = 1,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        width={index === lines - 1 ? '70%' : '100%'}
        height={16}
        style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
      />
    ))}
  </View>
);

export const SkeletonAvatar: React.FC<{ size?: number; style?: ViewStyle }> = ({
  size = 48,
  style,
}) => <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;

export const SkeletonImage: React.FC<{
  width?: DimensionValue;
  height?: DimensionValue;
  style?: ViewStyle;
}> = ({ width = '100%', height = 150, style }) => (
  <Skeleton width={width} height={height} borderRadius={12} style={style} />
);

// Offer Card Skeleton
export const OfferCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.offerCard}>
    <Skeleton width="100%" height={120} borderRadius={12} />
    <View style={skeletonStyles.offerContent}>
      <Skeleton width="80%" height={18} />
      <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
      <View style={skeletonStyles.priceRow}>
        <Skeleton width={80} height={24} />
        <Skeleton width={60} height={24} />
      </View>
    </View>
  </View>
);

// Merchant Card Skeleton
export const MerchantCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.merchantCard}>
    <SkeletonAvatar size={60} />
    <View style={skeletonStyles.merchantContent}>
      <Skeleton width="70%" height={18} />
      <Skeleton width="50%" height={14} style={{ marginTop: 6 }} />
      <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
    </View>
  </View>
);

// Order Card Skeleton
export const OrderCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.orderCard}>
    <View style={skeletonStyles.orderHeader}>
      <SkeletonAvatar size={48} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={70} height={24} borderRadius={12} />
    </View>
    <View style={skeletonStyles.orderFooter}>
      <Skeleton width={100} height={14} />
      <Skeleton width={80} height={14} />
    </View>
  </View>
);

// List Skeleton
export const ListSkeleton: React.FC<{
  count?: number;
  ItemSkeleton?: React.FC;
}> = ({ count = 3, ItemSkeleton = OfferCardSkeleton }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <ItemSkeleton key={index} />
    ))}
  </View>
);

// Home Screen Skeleton
export const HomeScreenSkeleton: React.FC = () => (
  <View style={skeletonStyles.homeScreen}>
    {/* Header */}
    <View style={skeletonStyles.header}>
      <View>
        <Skeleton width={150} height={24} />
        <Skeleton width={200} height={16} style={{ marginTop: 8 }} />
      </View>
      <SkeletonAvatar size={40} />
    </View>

    {/* Search */}
    <Skeleton width="100%" height={48} borderRadius={24} style={{ marginTop: 16 }} />

    {/* Categories */}
    <View style={skeletonStyles.categories}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={skeletonStyles.categoryItem}>
          <Skeleton width={60} height={60} borderRadius={30} />
          <Skeleton width={50} height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>

    {/* Section Title */}
    <Skeleton width={150} height={20} style={{ marginTop: 24 }} />

    {/* Offer Cards */}
    <View style={{ marginTop: 16 }}>
      <ListSkeleton count={2} ItemSkeleton={OfferCardSkeleton} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
});

const skeletonStyles = StyleSheet.create({
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerContent: {
    padding: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  merchantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  merchantContent: {
    flex: 1,
    marginLeft: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  homeScreen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  categoryItem: {
    alignItems: 'center',
  },
});
