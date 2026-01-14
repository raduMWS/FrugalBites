import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { OfferDTO, OfferCategory, DietaryType } from '../types/offer';
import { AuthResponse, LoginRequest, SignUpRequest } from '../types/auth';
import { OrderDTO, CreateOrderRequest, CancelOrderRequest } from '../types/order';
import {
  PaymentConfig,
  PaymentIntentResponse,
  PaymentConfirmationResponse,
  RefundRequest,
  RefundResponse,
} from '../types/payment';
import { logger } from './logger';

// Create a contextual logger for API calls
const apiLogger = logger.withContext('API');

// Token management
let authToken: string | null = null;

const TOKEN_KEY = 'authToken';

const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from storage:', error);
    return null;
  }
};

const setStoredToken = async (token: string | null): Promise<void> => {
  try {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      authToken = token;
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      authToken = null;
    }
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

// Initialize token on app start
getStoredToken().then(token => {
  authToken = token;
});

// Configure base URL based on platform
const getBaseURL = () => {
  if (__DEV__) {
    // Your computer's local network IP - update this if your IP changes
    const LOCAL_IP = '192.168.1.53';
    
    // For physical devices, always use the network IP
    // For simulators/emulators, use localhost or special address
    // Since it's hard to reliably detect physical device vs simulator,
    // we'll just always use the network IP which works for both
    return `http://${LOCAL_IP}:3000/api`;
  } else {
    // In production, use your actual API URL
    return 'https://your-api-domain.com/api';
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for logging and auth token
api.interceptors.request.use(
  (config) => {
    apiLogger.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
    });
    // Add auth token if available
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => {
    apiLogger.error('Request failed', { error: error.message });
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    apiLogger.debug(`Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    apiLogger.error('Response error', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

export interface OffersFeedParams {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: OfferCategory;
  dietary?: DietaryType;
  minDiscount?: number;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const authData = response.data;
    // Store the token securely
    if (authData.token) {
      await setStoredToken(authData.token);
    }
    return authData;
  },

  async signup(data: SignUpRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', data);
    const authData = response.data;
    // Store the token securely
    if (authData.token) {
      await setStoredToken(authData.token);
    }
    return authData;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    // Clear the stored token
    await setStoredToken(null);
  },
};

export const offerService = {
  async getOffersFeed(params: OffersFeedParams): Promise<OfferDTO[]> {
    const response = await api.get('/offers/feed', { params });
    return response.data;
  },

  async getOffer(offerId: string): Promise<OfferDTO> {
    const response = await api.get(`/offers/${offerId}`);
    return response.data;
  },
};

export interface MerchantsFeedParams {
  lat?: number;
  lng?: number;
  radius?: number;
}

export const merchantService = {
  async getMerchants(params: MerchantsFeedParams): Promise<any[]> {
    const response = await api.get('/merchants', { params });
    return response.data;
  },

  async getMerchant(merchantId: string): Promise<any> {
    const response = await api.get(`/merchants/${merchantId}`);
    return response.data;
  },
};

// Orders Service
export const orderService = {
  async getMyOrders(): Promise<OrderDTO[]> {
    const response = await api.get('/orders');
    return response.data;
  },

  async getOrder(orderId: string): Promise<OrderDTO> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  async createOrder(request: CreateOrderRequest): Promise<OrderDTO> {
    const response = await api.post('/orders', request);
    return response.data;
  },

  async cancelOrder(orderId: string, request?: CancelOrderRequest): Promise<OrderDTO> {
    const response = await api.post(`/orders/${orderId}/cancel`, request || {});
    return response.data;
  },
};

// Payments Service
export const paymentService = {
  async getConfig(): Promise<PaymentConfig> {
    const response = await api.get('/payments/config');
    return response.data;
  },

  async createPaymentIntent(orderId: string): Promise<PaymentIntentResponse> {
    const response = await api.post('/payments/create-payment-intent', { orderId });
    return response.data;
  },

  async confirmPayment(paymentIntentId: string): Promise<PaymentConfirmationResponse> {
    const response = await api.post('/payments/confirm-payment', { paymentIntentId });
    return response.data;
  },

  async requestRefund(orderId: string, reason?: string): Promise<RefundResponse> {
    const request: RefundRequest = { orderId, reason };
    const response = await api.post('/payments/refund', request);
    return response.data;
  },
};

export default api;