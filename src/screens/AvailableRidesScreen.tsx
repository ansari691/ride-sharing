import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/Card';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { MapPin, Clock, Users, Search, Filter } from 'lucide-react-native';
import { TextInput } from 'react-native';

interface RideRequest {
  id: string;
  user_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_address: string;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  is_driver: boolean;
  seats_needed: number;
  seats_available: number | null;
  status: string;
  created_at: string;
}

export function AvailableRidesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [filteredRides, setFilteredRides] = useState<RideRequest[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'driver' | 'passenger'>('all');

  useEffect(() => {
    const fetchRides = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("ride_requests")
        .select("id, user_id, pickup_address, pickup_lat, pickup_lng, destination_address, destination_lat, destination_lng, departure_time, is_driver, seats_needed, seats_available, status, created_at")
        .neq("user_id", user.id)
        .eq("status", "pending")
        .order("departure_time", { ascending: true });

      if (!error && data) {
        setRides(data as RideRequest[]);
        setFilteredRides(data as RideRequest[]);
      }
      setLoadingRides(false);
    };

    if (user && isFocused) {
      fetchRides();
    }
  }, [user, isFocused]);

  useEffect(() => {
    let result = rides;

    // Apply text search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.pickup_address.toLowerCase().includes(lowerQuery) ||
        r.destination_address.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply role filter
    if (filterRole !== 'all') {
      const isDriver = filterRole === 'driver';
      result = result.filter(r => r.is_driver === isDriver);
    }

    setFilteredRides(result);
  }, [searchQuery, filterRole, rides]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderRideCard = (ride: RideRequest) => (
    <Card key={ride.id} className="mb-4">
      <CardContent>
        <View className="flex-row justify-between mb-2">
            <View className={`px-2 py-1 rounded-md ${ride.is_driver ? 'bg-blue-100' : 'bg-gray-200'}`}>
                <Text className={`${ride.is_driver ? 'text-blue-800' : 'text-gray-800'} text-xs font-bold`}>
                    {ride.is_driver ? "Offering Ride" : "Looking for Ride"}
                </Text>
            </View>
        </View>

        <View className="mb-3 space-y-1">
            <View className="flex-row items-center">
                <MapPin size={16} color="#2563EB" />
                <Text className="ml-2 text-sm text-gray-800" numberOfLines={1}>{ride.pickup_address}</Text>
            </View>
            <View className="flex-row items-center">
                <MapPin size={16} color="#F59E0B" />
                <Text className="ml-2 text-sm text-gray-800" numberOfLines={1}>{ride.destination_address}</Text>
            </View>
        </View>

        <View className="flex-row justify-between mb-3">
            <View className="flex-row items-center">
                <Clock size={16} color="gray" />
                <Text className="ml-1 text-xs text-gray-500">{formatDate(ride.departure_time)}</Text>
            </View>
            <View className="flex-row items-center">
                <Users size={16} color="gray" />
                <Text className="ml-1 text-xs text-gray-500">
                     {ride.is_driver ? `${ride.seats_available} seats` : `${ride.seats_needed} needed`}
                </Text>
            </View>
        </View>

        <Button
            title={ride.is_driver ? "Request to Join" : "Offer Ride"}
            onPress={() => {
                navigation.navigate('CreateRide', {
                    initialPickup: {
                        place_name: ride.pickup_address,
                        center: [ride.pickup_lng, ride.pickup_lat]
                    },
                    initialDestination: {
                        place_name: ride.destination_address,
                        center: [ride.destination_lng, ride.destination_lat]
                    },
                    initialDate: ride.departure_time,
                    initialIsDriver: !ride.is_driver,
                    targetRideId: ride.id
                });
            }}
        />
      </CardContent>
    </Card>
  );

  return (
    <Container>
        <Text className="text-2xl font-bold text-blue-600 mb-4">Available Rides</Text>

        <View className="mb-4">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
                <Search size={20} color="gray" />
                <TextInput
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 ml-2 text-base text-gray-900"
                    placeholderTextColor="gray"
                />
            </View>

            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => setFilterRole('all')}
                    className={`px-3 py-1 rounded-full border ${filterRole === 'all' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                >
                    <Text className={`${filterRole === 'all' ? 'text-white' : 'text-gray-700'} text-xs`}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setFilterRole('driver')}
                    className={`px-3 py-1 rounded-full border ${filterRole === 'driver' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                >
                    <Text className={`${filterRole === 'driver' ? 'text-white' : 'text-gray-700'} text-xs`}>Drivers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setFilterRole('passenger')}
                    className={`px-3 py-1 rounded-full border ${filterRole === 'passenger' ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
                >
                    <Text className={`${filterRole === 'passenger' ? 'text-white' : 'text-gray-700'} text-xs`}>Passengers</Text>
                </TouchableOpacity>
            </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
            {loadingRides ? (
                 <Text className="text-gray-500 text-center py-4">Loading...</Text>
            ) : filteredRides.length === 0 ? (
                 <Text className="text-gray-500 text-center py-4">No rides found matching your criteria.</Text>
            ) : (
                <View className="mb-20">
                    {filteredRides.map(ride => renderRideCard(ride))}
                </View>
            )}
        </ScrollView>
    </Container>
  );
}
