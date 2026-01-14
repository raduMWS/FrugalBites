export interface OrderDTO {
  orderId: string;
  offerId: string;
  merchantId: string;
  foodName: string;
  merchantName: string;
  merchantAddress: string;
  imageUrl?: string;
  quantity: number;
  totalPrice: number;
  discountAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  pickupTime?: string;
  pickupConfirmedAt?: string;
  customerNotes?: string;
  createdAt: string;
}

export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentStatus = 
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED';

export interface CreateOrderRequest {
  offerId: string;
  quantity: number;
  pickupTime?: string;
  customerNotes?: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

// Helper to get human-readable status
export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PREPARING: 'Preparing',
    READY: 'Ready for Pickup',
    PICKED_UP: 'Picked Up',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return labels[status] || status;
};

export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    PENDING: '#f59e0b',     // amber
    CONFIRMED: '#3b82f6',   // blue
    PREPARING: '#8b5cf6',   // purple
    READY: '#10b981',       // green
    PICKED_UP: '#6b7280',   // gray
    CANCELLED: '#ef4444',   // red
    EXPIRED: '#6b7280',     // gray
  };
  return colors[status] || '#6b7280';
};
