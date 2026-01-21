export enum UserType {
  CONSUMER = 'CONSUMER',
  MERCHANT = 'MERCHANT',
}

export enum SubscriptionStatus {
  FREE = 'FREE',
  VIP = 'VIP',
}

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  subscriptionStatus: SubscriptionStatus;
  isEmailVerified: boolean;
  createdAt: string;
  isPremium: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: SubscriptionStatus;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}
