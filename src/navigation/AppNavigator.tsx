import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CreateRideScreen } from '../screens/CreateRideScreen';
import { FindMatchesScreen } from '../screens/FindMatchesScreen';
import { MyMatchesScreen } from '../screens/MyMatchesScreen';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateRide" component={CreateRideScreen} />
            <Stack.Screen name="FindMatches" component={FindMatchesScreen} />
            <Stack.Screen name="MyMatches" component={MyMatchesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
