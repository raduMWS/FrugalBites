import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentService } from '../services/api';
import { PaymentStatus } from '../types/payment';
import { logger } from '../services/logger';

const paymentLogger = logger.withContext('Payment');

interface PaymentSheetProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  orderId,
  amount,
  onSuccess,
  onCancel,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializePayment();
  }, [orderId]);

  const initializePayment = async () => {
    setStatus('loading');
    setError(null);

    try {
      paymentLogger.info('Initializing payment for order', { orderId, amount });

      // Create PaymentIntent on the backend
      const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent(orderId);

      if (!clientSecret) {
        throw new Error('Failed to get payment client secret');
      }

      paymentLogger.debug('PaymentIntent created', { paymentIntentId });

      // Initialize the Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'FrugalBites',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: '',
        },
      });

      if (initError) {
        paymentLogger.error('Payment sheet init error', { error: initError.message });
        setError(initError.message);
        setStatus('error');
        return;
      }

      setStatus('idle');
      paymentLogger.info('Payment sheet initialized successfully');
    } catch (err: any) {
      paymentLogger.error('Payment initialization failed', { error: err.message });
      setError(err.message || 'Failed to initialize payment');
      setStatus('error');
    }
  };

  const handlePayPress = async () => {
    setStatus('processing');

    try {
      paymentLogger.info('Opening payment sheet');

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          paymentLogger.info('Payment cancelled by user');
          setStatus('idle');
          return;
        }

        paymentLogger.error('Payment sheet error', { error: presentError.message });
        setError(presentError.message);
        setStatus('error');
        return;
      }

      // Payment successful on Stripe's side, confirm with our backend
      paymentLogger.info('Payment completed, confirming with backend');
      setStatus('success');

      // The webhook will update the order status, but we can also poll or show success
      Alert.alert(
        'Payment Successful',
        'Your order has been confirmed! You can pick up your food at the scheduled time.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (err: any) {
      paymentLogger.error('Payment processing failed', { error: err.message });
      setError(err.message || 'Payment processing failed');
      setStatus('error');
    }
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.amountContainer}>
        <Text style={styles.label}>Total Amount</Text>
        <Text style={styles.amount}>{formatAmount(amount)}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={initializePayment} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={status === 'processing'}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.payButton,
            (status === 'processing' || status === 'error') && styles.buttonDisabled,
          ]}
          onPress={handlePayPress}
          disabled={status === 'processing' || status === 'error'}
        >
          {status === 'processing' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay Now</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.secureText}>
        🔒 Payments secured by Stripe
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  payButton: {
    backgroundColor: '#22c55e',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  secureText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default PaymentSheet;
