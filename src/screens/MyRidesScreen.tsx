import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Container } from '../components/ui/Container';
import { Plus, MapPin, Clock, Users } from 'lucide-react-native';

interface RideRequest {
  id: string;
  user_id: string;
  pickup_address: string;
  destination_address: string;
  departure_time: string;
  is_driver: boolean;
  seats_needed: number;
  seats_available: number | null;
  status: string;
  created_at: string;
}

export function MyRidesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("departure_time", { ascending: true });

      if (!error && data) {
        setRides(data as RideRequest[]);
      }
      setLoadingRides(false);
    };

    if (user && isFocused) {
      fetchRides();
    }
  }, [user, isFocused]);

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
             <View className="px-2 py-1 rounded-md border border-gray-300">
                <Text className="text-xs text-gray-600 capitalize">{ride.status}</Text>
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

        {ride.status === "pending" && (
            <Button 
                title="Find Matches" 
                variant="outline" 
                className="w-full"
                onPress={() => navigation.navigate('FindMatches', { rideId: ride.id })}
            />
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container>
        <Text className="text-2xl font-bold text-blue-600 mb-6">My Rides</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
            {loadingRides ? (
                 <Text className="text-gray-500 text-center py-4">Loading...</Text>
            ) : rides.length === 0 ? (
                <View className="items-center py-12">
                     <Text className="text-gray-500 text-center py-4">No rides created yet.</Text>
                     <Button
                        title="Create your first ride"
                        onPress={() => navigation.navigate('CreateRide')}
                    />
                </View>
            ) : (
                <View className="mb-20">
                    {rides.map(ride => renderRideCard(ride))}
                </View>
            )}
        </ScrollView>
        
        <TouchableOpacity 
            className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
            onPress={() => navigation.navigate('CreateRide')}
        >
            <Plus color="white" size={24} />
        </TouchableOpacity>
    </Container>
  );
}
