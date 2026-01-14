export interface MerchantDTO {
  merchantId: string;
  businessName: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  averageRating: number;
  totalReviews: number;
  distance?: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  discount: number;
  imageUrl: string;
  expiresAt: string;
}
