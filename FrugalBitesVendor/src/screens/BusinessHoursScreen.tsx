import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { CloseButton } from '../components';

interface TimeSlot {
  open: string;
  close: string;
}

interface BusinessHours {
  monday: TimeSlot | null;
  tuesday: TimeSlot | null;
  wednesday: TimeSlot | null;
  thursday: TimeSlot | null;
  friday: TimeSlot | null;
  saturday: TimeSlot | null;
  sunday: TimeSlot | null;
}

interface BusinessHoursScreenProps {
  merchantId: number;
  initialHours: BusinessHours;
  onSave: (hours: BusinessHours) => void;
  onClose: () => void;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30', '00:00',
];

const defaultHours: BusinessHours = {
  monday: { open: '09:00', close: '21:00' },
  tuesday: { open: '09:00', close: '21:00' },
  wednesday: { open: '09:00', close: '21:00' },
  thursday: { open: '09:00', close: '21:00' },
  friday: { open: '09:00', close: '22:00' },
  saturday: { open: '10:00', close: '22:00' },
  sunday: null,
};

export const BusinessHoursScreen: React.FC<BusinessHoursScreenProps> = ({
  merchantId,
  initialHours,
  onSave,
  onClose,
}) => {
  const [hours, setHours] = useState<BusinessHours>(initialHours || defaultHours);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const toggleDayEnabled = (day: keyof BusinessHours) => {
    if (hours[day]) {
      setHours({ ...hours, [day]: null });
    } else {
      setHours({ ...hours, [day]: { open: '09:00', close: '21:00' } });
    }
  };

  const updateTime = (day: keyof BusinessHours, type: 'open' | 'close', time: string) => {
    const current = hours[day];
    if (current) {
      setHours({
        ...hours,
        [day]: { ...current, [type]: time },
      });
    }
  };

  const copyToAll = (sourceDay: keyof BusinessHours) => {
    const sourceHours = hours[sourceDay];
    if (!sourceHours) return;

    Alert.alert(
      'Copy Hours',
      `Copy ${DAYS.find(d => d.key === sourceDay)?.label}'s hours to all days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            const newHours = { ...hours };
            DAYS.forEach(({ key }) => {
              newHours[key] = { ...sourceHours };
            });
            setHours(newHours);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.put(`/merchants/${merchantId}/business-hours`, { businessHours: hours });
      onSave(hours);
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save business hours');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <CloseButton onPress={onClose} size={28} color="#1F2937" />
        <Text style={styles.headerTitle}>Business Hours</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Set your pickup availability times for each day
        </Text>

        {DAYS.map(({ key, label }) => (
          <View key={key} style={styles.dayCard}>
            <TouchableOpacity
              style={styles.dayHeader}
              onPress={() => setExpandedDay(expandedDay === key ? null : key)}
            >
              <View style={styles.dayHeaderLeft}>
                <Switch
                  value={hours[key] !== null}
                  onValueChange={() => toggleDayEnabled(key)}
                  trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                  thumbColor={hours[key] ? '#10B981' : '#9CA3AF'}
                />
                <Text style={[styles.dayLabel, !hours[key] && styles.dayLabelDisabled]}>
                  {label}
                </Text>
              </View>
              {hours[key] && (
                <View style={styles.dayHeaderRight}>
                  <Text style={styles.timePreview}>
                    {hours[key]!.open} - {hours[key]!.close}
                  </Text>
                  <Ionicons
                    name={expandedDay === key ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6B7280"
                  />
                </View>
              )}
            </TouchableOpacity>

            {hours[key] && expandedDay === key && (
              <View style={styles.timeSelector}>
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Opens at</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timeScrollView}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <TouchableOpacity
                        key={`open-${time}`}
                        style={[
                          styles.timeOption,
                          hours[key]!.open === time && styles.timeOptionSelected,
                        ]}
                        onPress={() => updateTime(key, 'open', time)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            hours[key]!.open === time && styles.timeOptionTextSelected,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>Closes at</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timeScrollView}
                  >
                    {TIME_OPTIONS.map((time) => (
                      <TouchableOpacity
                        key={`close-${time}`}
                        style={[
                          styles.timeOption,
                          hours[key]!.close === time && styles.timeOptionSelected,
                        ]}
                        onPress={() => updateTime(key, 'close', time)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            hours[key]!.close === time && styles.timeOptionTextSelected,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => copyToAll(key)}
                >
                  <Ionicons name="copy-outline" size={16} color="#3B82F6" />
                  <Text style={styles.copyButtonText}>Copy to all days</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dayLabelDisabled: {
    color: '#9CA3AF',
  },
  timePreview: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeSelector: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  timeRow: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeScrollView: {
    flexGrow: 0,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  timeOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  copyButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default BusinessHoursScreen;
