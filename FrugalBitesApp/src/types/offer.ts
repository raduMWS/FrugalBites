export enum OfferCategory {
  BAKERY = 'BAKERY',
  RESTAURANT = 'RESTAURANT',
  PREPARED_MEALS = 'PREPARED_MEALS',
  GROCERIES = 'GROCERIES',
  BEVERAGES = 'BEVERAGES',
  DESSERTS = 'DESSERTS',
  OTHER = 'OTHER'
}

export enum QuantityUnit {
  PORTION = 'PORTION',
  GRAM = 'GRAM',
  LITER = 'LITER',
  PACK = 'PACK',
  PIECE = 'PIECE'
}

export enum DietaryType {
  NONE = 'NONE',
  VEGAN = 'VEGAN',
  VEGETARIAN = 'VEGETARIAN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  DAIRY_FREE = 'DAIRY_FREE'
}

export interface OfferDTO {
  offerId: string;
  merchantId: string;
  foodName: string;
  description?: string;
  category: OfferCategory;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  quantity: number;
  quantityUnit: QuantityUnit;
  imageUrl?: string;
  pickupStartTime: string;
  pickupEndTime: string;
  allergens?: any;
  dietary: DietaryType;
  expirationDate?: string;
  isAvailable: boolean;
  createdAt: string;
  merchantName: string;
  merchantLogoUrl?: string;
  merchantRating?: number;
  distanceKm?: number;
}