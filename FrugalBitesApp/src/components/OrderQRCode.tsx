import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

interface OrderQRCodeProps {
  qrCodeData: string;
  orderNumber: string;
  merchantName: string;
  pickupTime?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  onClose?: () => void;
}

export const OrderQRCode: React.FC<OrderQRCodeProps> = ({
  qrCodeData,
  orderNumber,
  merchantName,
  pickupTime,
  pickupStartTime,
  pickupEndTime,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>Show this QR code when picking up</Text>
        </View>

        <View style={styles.qrContainer}>
          <QRCode
            value={qrCodeData}
            size={200}
            backgroundColor="#fff"
            color="#1F2937"
          />
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order #</Text>
            <Text style={styles.detailValue}>{orderNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup from</Text>
            <Text style={styles.detailValue}>{merchantName}</Text>
          </View>
          {(pickupStartTime && pickupEndTime) ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup window</Text>
              <Text style={styles.detailValue}>{new Date(pickupStartTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(pickupEndTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          ) : pickupTime ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup time</Text>
              <Text style={styles.detailValue}>{pickupTime}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.instructions}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.instructionsText}>
            The vendor will scan this code to verify your order
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 24,
  },
  details: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});
