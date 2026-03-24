import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, Modal } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { calculateCostSplit } from '../lib/costCalculations';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Container } from '../components/ui/Container';
import { Plus, MapPin, Clock, Users, AlertTriangle, X } from 'lucide-react-native';

interface RideRequest {
  id: string;
  user_id: string;
  pickup_address: string;
  destination_address: string;
  departure_time: string;
  is_driver: boolean;
  seats_needed: number;
  seats_available: number | null;
  gender_preference: 'same_gender' | 'any';
  status: string;
  created_at: string;
  total_cost: number | null;
  distance: number | null;
}

export function MyRidesScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [showSOSModal, setShowSOSModal] = useState(false);

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

  const handleCallPolice = () => {
    const phoneUrl = 'tel:100';
    Linking.openURL(phoneUrl)
      .catch(() => {
        Alert.alert('Error', 'Unable to make phone calls. Please ensure your device has phone calling capability.');
      });
    setShowSOSModal(false);
  };

  const handleCallAmbulance = () => {
    const phoneUrl = 'tel:102';
    Linking.openURL(phoneUrl)
      .catch(() => {
        Alert.alert('Error', 'Unable to make phone calls. Please ensure your device has phone calling capability.');
      });
    setShowSOSModal(false);
  };

  const handleSendSMS = () => {
    // Fetch emergency contacts from database
    const fetchAndSendSMS = async () => {
      try {
        const { data: contacts, error } = await supabase
          .from('emergency_contacts')
          .select('phone')
          .eq('user_id', user?.id);

        if (error || !contacts || contacts.length === 0) {
          Alert.alert('Error', 'No emergency contacts found. Please add emergency contacts in your profile first.');
          return;
        }

        const emergencyNumbers = contacts.map(c => c.phone);
        const emergencyNumbersString = emergencyNumbers.join(';');
        const message = 'SOS! I need help. This is an emergency message from the Share-A-Ride app.';
        
        // Android uses different URL format for SMS - semicolon separates multiple recipients
        const smsUrl = `sms:${emergencyNumbersString}?body=${encodeURIComponent(message)}`;
        const fallbackUrl = `sms:${emergencyNumbersString}`;
        
        Linking.openURL(smsUrl)
          .catch(() => {
            // Fallback without message body
            Linking.openURL(fallbackUrl)
              .catch(() => {
                Alert.alert('Error', 'Unable to send SMS. Please ensure your device has an SMS app installed.');
              });
          });
        setShowSOSModal(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch emergency contacts');
      }
    };

    fetchAndSendSMS();
  };

  const handleSOS = () => {
    setShowSOSModal(true);
  };

  const renderRideCard = (ride: RideRequest) => {
    // Calculate cost per person if ride is a driver offer with cost
    let costBreakdown = null;
    if (ride.is_driver && ride.total_cost && ride.seats_available) {
      costBreakdown = calculateCostSplit(ride.total_cost, ride.seats_available, false);
    }

    return (
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

          <Text className="text-xs text-gray-500 mb-3">
            Gender Preference: {ride.gender_preference === 'same_gender' ? 'Same Gender' : 'Any Gender'}
          </Text>

          {/* Cost Information */}
          {costBreakdown && (
            <View className="bg-blue-50 rounded-lg p-3 mb-3">
              <Text className="text-sm text-gray-700">Cost/Seat: <Text className="font-semibold text-blue-600">{costBreakdown.formattedPerPersonCost}</Text>{ride.distance ? <> • Distance: <Text className="font-semibold text-blue-600">{ride.distance} km</Text></> : null}</Text>
            </View>
          )}

          {/* SOS Button for Active Rides */}
          {ride.status === "in_progress" && (
              <Button 
                  title="🆘 SOS" 
                  className="w-full bg-red-600"
                  onPress={handleSOS}
              />
          )}

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
  };

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
        
        <View className="absolute bottom-6 right-6 flex-col items-center gap-3">
          <TouchableOpacity 
              className="w-14 h-14 bg-red-600 rounded-full items-center justify-center shadow-lg"
              onPress={handleSOS}
          >
              <AlertTriangle color="white" size={24} />
          </TouchableOpacity>
          <TouchableOpacity 
              className="w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
              onPress={() => navigation.navigate('CreateRide')}
          >
              <Plus color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* SOS Modal */}
        <Modal
          visible={showSOSModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSOSModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-lg p-6 w-5/6 max-w-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-red-600">🆘 Emergency SOS</Text>
                <TouchableOpacity onPress={() => setShowSOSModal(false)}>
                  <X color="gray" size={24} />
                </TouchableOpacity>
              </View>

              <Text className="text-gray-700 mb-6 text-center">Choose an action:</Text>

              <TouchableOpacity
                className="bg-red-600 rounded-lg p-4 mb-3"
                onPress={handleCallPolice}
              >
                <Text className="text-white font-bold text-center">📞 Call Police (100)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-orange-600 rounded-lg p-4 mb-3"
                onPress={handleCallAmbulance}
              >
                <Text className="text-white font-bold text-center">🚑 Call Ambulance (102)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-blue-600 rounded-lg p-4 mb-3"
                onPress={handleSendSMS}
              >
                <Text className="text-white font-bold text-center">💬 Send SMS to Contacts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-400 rounded-lg p-4"
                onPress={() => setShowSOSModal(false)}
              >
                <Text className="text-white font-bold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    </Container>
  );
}
