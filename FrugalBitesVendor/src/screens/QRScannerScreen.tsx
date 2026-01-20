import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { CloseButton } from '../components';

interface QRScannerScreenProps {
  onClose: () => void;
  onScanSuccess: (orderId: number) => void;
}

interface ScanResult {
  success: boolean;
  orderId?: number;
  orderNumber?: string;
  customerName?: string;
  items?: string[];
  total?: number;
  error?: string;
}

export const QRScannerScreen: React.FC<QRScannerScreenProps> = ({
  onClose,
  onScanSuccess,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);
    Vibration.vibrate(100);

    try {
      // Parse QR code data
      // Expected format: orderId:timestamp:signature
      const [orderId, timestamp, signature] = data.split(':');

      if (!orderId || !timestamp || !signature) {
        throw new Error('Invalid QR code format');
      }

      // Verify with backend
      const response = await api.post('/orders/verify-pickup', {
        orderId: parseInt(orderId),
        timestamp,
        signature,
      });

      setScanResult({
        success: true,
        orderId: response.data.orderId,
        orderNumber: response.data.orderNumber,
        customerName: response.data.customerName,
        items: response.data.items,
        total: response.data.total,
      });

      setShowResult(true);
    } catch (error: any) {
      setScanResult({
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify order',
      });
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!scanResult?.orderId) return;

    setIsProcessing(true);
    try {
      await api.patch(`/orders/${scanResult.orderId}/status`, {
        status: 'PICKED_UP',
      });

      onScanSuccess(scanResult.orderId);
      setShowResult(false);
      onClose();
    } catch (error: any) {
      setScanResult({
        success: false,
        error: error.response?.data?.message || 'Failed to confirm pickup',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScanResult(null);
    setShowResult(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan customer QR codes for order pickup verification.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Header */}
        <View style={styles.header}>
          <CloseButton onPress={onClose} size={28} color="#fff" style={styles.headerButton} />
          <Text style={styles.headerTitle}>Scan Order QR</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Ionicons
              name={flashOn ? 'flash' : 'flash-off'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Scan Frame */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.footer}>
          <Text style={styles.instructions}>
            Point camera at customer's QR code to verify pickup
          </Text>
        </View>

        {/* Processing Overlay */}
        {isProcessing && !showResult && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Verifying order...</Text>
          </View>
        )}
      </CameraView>

      {/* Result Modal */}
      <Modal
        visible={showResult}
        transparent
        animationType="slide"
        onRequestClose={handleScanAgain}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultCard}>
            {scanResult?.success ? (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
                <Text style={styles.resultTitle}>Order Verified!</Text>
                <Text style={styles.orderNumber}>#{scanResult.orderNumber}</Text>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer</Text>
                    <Text style={styles.detailValue}>{scanResult.customerName}</Text>
                  </View>
                  {scanResult.items && (
                    <View style={styles.itemsList}>
                      <Text style={styles.detailLabel}>Items</Text>
                      {scanResult.items.map((item, index) => (
                        <Text key={index} style={styles.itemText}>
                          • {item}
                        </Text>
                      ))}
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      ${scanResult.total?.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmPickup}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.errorIcon}>
                  <Ionicons name="close-circle" size={64} color="#EF4444" />
                </View>
                <Text style={styles.resultTitle}>Verification Failed</Text>
                <Text style={styles.errorText}>{scanResult?.error}</Text>
              </>
            )}

            <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain}>
              <Ionicons name="scan" size={20} color="#3B82F6" />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#3B82F6',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  instructions: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    margin: 24,
    alignItems: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  errorIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  itemsList: {
    paddingVertical: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    gap: 8,
  },
  scanAgainText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerScreen;
