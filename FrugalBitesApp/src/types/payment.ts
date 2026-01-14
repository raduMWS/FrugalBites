// Payment-related types for Stripe integration

export interface PaymentConfig {
  publishableKey: string;
}

export interface CreatePaymentIntentRequest {
  orderId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface PaymentConfirmationResponse {
  success: boolean;
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  message: string;
}

export interface RefundRequest {
  orderId: string;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  message: string;
}

export type PaymentStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';

export interface PaymentState {
  status: PaymentStatus;
  clientSecret: string | null;
  paymentIntentId: string | null;
  error: string | null;
}
