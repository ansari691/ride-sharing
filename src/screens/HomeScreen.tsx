import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Container } from '../components/ui/Container';
import { LogOut, Plus, MapPin, Clock, Users } from 'lucide-react-native';

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

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut } = useAuth();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);

  useEffect(() => {
    const fetchRides = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("ride_requests")
        .select("*")
        .order("departure_time", { ascending: true });

      if (!error && data) {
        setRides(data as RideRequest[]);
      }
      setLoadingRides(false);
    };

    if (user) {
      fetchRides();
    }
  }, [user]);

  const myRides = rides.filter((ride) => ride.user_id === user?.id);
  const availableRides = rides.filter((ride) => ride.user_id !== user?.id && ride.status === "pending");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderRideCard = (ride: RideRequest, isOwner: boolean) => (
    <Card key={ride.id} className="mb-4">
      <CardContent>
        <View className="flex-row justify-between mb-2">
            <View className={`px-2 py-1 rounded-md ${ride.is_driver ? 'bg-blue-100' : 'bg-gray-200'}`}>
                <Text className={`${ride.is_driver ? 'text-blue-800' : 'text-gray-800'} text-xs font-bold`}>
                    {ride.is_driver ? "Offering Ride" : "Looking for Ride"}
                </Text>
            </View>
            {isOwner && (
                 <View className="px-2 py-1 rounded-md border border-gray-300">
                    <Text className="text-xs text-gray-600 capitalize">{ride.status}</Text>
                 </View>
            )}
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

        {isOwner && ride.status === "pending" && (
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
        <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-blue-600">SeatShare</Text>
            <View className="flex-row gap-4">
                <TouchableOpacity onPress={() => navigation.navigate('MyMatches')}>
                    <Users size={24} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => signOut()}>
                    <LogOut size={24} color="black" />
                </TouchableOpacity>
            </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row gap-4 mb-6">
                <Button 
                    title="Offer a Ride" 
                    className="flex-1"
                    onPress={() => navigation.navigate('CreateRide')}
                />
                <Button 
                    title="Need a Ride" 
                    variant="secondary"
                    className="flex-1"
                    onPress={() => navigation.navigate('CreateRide')}
                />
            </View>

            <View className="mb-6">
                <Text className="text-lg font-bold mb-3">My Rides</Text>
                {myRides.length === 0 ? (
                    <Text className="text-gray-500 text-center py-4">No rides created yet.</Text>
                ) : (
                    myRides.map(ride => renderRideCard(ride, true))
                )}
            </View>

            <View className="mb-20">
                <Text className="text-lg font-bold mb-3">Available Rides</Text>
                {loadingRides ? (
                     <Text className="text-gray-500 text-center py-4">Loading...</Text>
                ) : availableRides.length === 0 ? (
                     <Text className="text-gray-500 text-center py-4">No available rides.</Text>
                ) : (
                    availableRides.map(ride => renderRideCard(ride, false))
                )}
            </View>
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
