import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/hooks/useAuth';
import { AppNavigator } from './src/navigation/AppNavigator';
import MapboxGL from '@rnmapbox/maps';
import { EXPO_PUBLIC_MAPBOX_TOKEN } from '@env';

MapboxGL.setAccessToken(EXPO_PUBLIC_MAPBOX_TOKEN);

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
