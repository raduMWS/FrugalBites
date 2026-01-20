import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ToastMessage {
  id: string;
  text: string;
}

interface ToastContextType {
  showToast: (text: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const anim = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((text: string, duration = 2500) => {
    const id = Math.random().toString(36).slice(2, 9);
    setMessages((m) => [...m, { id, text }]);

    // Animate in
    Animated.timing(anim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      // Animate out
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setMessages((m) => m.filter((x) => x.id !== id));
      });
    }, duration);
  }, [anim]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="box-none" style={styles.container}>
        {messages.map((m, idx) => (
          <Animated.View
            key={m.id}
            style={[
              styles.toast,
              { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
              { opacity: anim },
            ]}
          >
            <Text style={styles.text}>{m.text}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    minWidth: 120,
  },
  text: {
    color: 'white',
    fontSize: 13,
  },
});
