import React from 'react';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamically export the appropriate MapScreen
const MapScreen = isExpoGo
  ? require('./MapScreenFallback').default
  : require('./MapScreenNative').default;

export default MapScreen;
