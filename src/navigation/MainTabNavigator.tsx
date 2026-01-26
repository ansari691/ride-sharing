import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MyRidesScreen } from '../screens/MyRidesScreen';
import { AvailableRidesScreen } from '../screens/AvailableRidesScreen';
import { MyMatchesScreen } from '../screens/MyMatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Car, Search, Users, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB', // blue-600
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="MyRides"
        component={MyRidesScreen}
        options={{
          tabBarLabel: 'My Rides',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="AvailableRides"
        component={AvailableRidesScreen}
        options={{
          tabBarLabel: 'Available',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="MyMatches"
        component={MyMatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
