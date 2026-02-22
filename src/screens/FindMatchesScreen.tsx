import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useRideMatching, RideRequest } from '../hooks/useRideMatching';
import { supabase } from '../lib/supabase';
import { calculateCostSplit } from '../lib/costCalculations';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Container } from '../components/ui/Container';
import { ArrowLeft, MapPin, Clock, Users } from 'lucide-react-native';

export function FindMatchesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { rideId } = route.params || {};
  const { user } = useAuth();
  const { findPotentialMatches, requestMatch } = useRideMatching();

  const [myRide, setMyRide] = useState<RideRequest | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
  const [matchMessage, setMatchMessage] = useState("");
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const fetchRideAndMatches = async () => {
      if (!rideId || !user) return;

      const { data: ride, error } = await supabase
        .from("ride_requests")
        .select("*")
        .eq("id", rideId)
        .maybeSingle();

      if (error || !ride) {
        Alert.alert("Error", "Ride not found");
        navigation.goBack();
        return;
      }

      // Type assertion or check if ride belongs to user
      if (ride.user_id !== user.id) {
        Alert.alert("Error", "You can only find matches for your own rides");
        navigation.goBack();
        return;
      }

      setMyRide(ride as RideRequest);

      // Find potential matches
      const potentialMatches = await findPotentialMatches(ride as RideRequest);
      setMatches(potentialMatches);
      setLoading(false);
    };

    if (user && rideId) {
      fetchRideAndMatches();
    }
  }, [rideId, user, findPotentialMatches, navigation]);

  const handleRequestMatch = async () => {
    if (!myRide || !selectedMatch) return;

    setRequesting(true);
    const success = await requestMatch(myRide.id, selectedMatch.id, matchMessage);
    setRequesting(false);

    if (success) {
      setSelectedMatch(null);
      setMatchMessage("");
      // Remove from list
      setMatches((prev) => prev.filter((m) => m.id !== selectedMatch.id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Container>
         <View className="flex-row items-center mb-6">
            <Button 
                title="" 
                variant="ghost" 
                className="mr-2 p-2"
                onPress={() => navigation.goBack()}
            >
                <ArrowLeft size={24} color="black" />
            </Button>
            <View>
                <Text className="text-xl font-bold">Find Matches</Text>
                <Text className="text-sm text-gray-500">{matches.length} potential matches found</Text>
            </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
            {myRide && (
              <Card className="mb-6 bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Your Ride</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#2563EB" />
                    <Text className="ml-2 text-sm text-gray-800">{myRide.pickup_address}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MapPin size={16} color="#F59E0B" />
                    <Text className="ml-2 text-sm text-gray-800">{myRide.destination_address}</Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Clock size={16} color="gray" />
                    <Text className="ml-2 text-xs text-gray-500">{formatDate(myRide.departure_time)}</Text>
                    <View className={`ml-4 px-2 py-0.5 rounded-md ${myRide.is_driver ? 'bg-blue-100' : 'bg-gray-200'}`}>
                         <Text className="text-xs">{myRide.is_driver ? "Driver" : "Passenger"}</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}

            {matches.length === 0 ? (
                <View className="items-center py-12">
                    <Users size={48} color="gray" />
                    <Text className="font-semibold mt-4 text-gray-900">No Matches Found</Text>
                    <Text className="text-sm text-gray-500 text-center mt-2 px-8">
                        No rides match your route and timing criteria. Try adjusting your departure time or check back later.
                    </Text>
                </View>
            ) : (
                matches.map((match) => {
                  // Calculate cost per person if match is offering a ride with cost
                  let costBreakdown = null;
                  if (match.is_driver && match.total_cost && match.seats_available) {
                    costBreakdown = calculateCostSplit(match.total_cost, match.seats_available, false);
                  }

                  return (
                    <Card key={match.id} className="mb-4">
                      <CardContent>
                        <View className="flex-row justify-between items-start mb-3">
                          <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-2">
                              <Users size={20} color="#2563EB" />
                            </View>
                            <View>
                              <Text className="font-medium">{match.profiles?.full_name || "User"}</Text>
                              {/* Rating could go here */}
                            </View>
                          </View>
                          <View className={`px-2 py-1 rounded-md ${match.is_driver ? 'bg-blue-100' : 'bg-gray-200'}`}>
                              <Text className="text-xs">{match.is_driver ? "Driver" : "Passenger"}</Text>
                          </View>
                        </View>

                        <View className="mb-3 space-y-2">
                          <View className="flex-row items-start">
                            <MapPin size={16} color="#2563EB" />
                            <Text className="ml-2 text-sm text-gray-800 flex-1">{match.pickup_address}</Text>
                          </View>
                          <View className="flex-row items-start">
                            <MapPin size={16} color="#F59E0B" />
                            <Text className="ml-2 text-sm text-gray-800 flex-1">{match.destination_address}</Text>
                          </View>
                        </View>

                        <View className="flex-row flex-wrap gap-2 mb-4">
                          <View className="bg-gray-100 px-2 py-1 rounded text-xs flex-row items-center">
                               <Clock size={12} color="gray" />
                               <Text className="text-xs ml-1">{formatDate(match.departure_time)}</Text>
                          </View>
                           <View className="bg-green-50 px-2 py-1 rounded">
                               <Text className="text-xs text-green-700">{match.pickupDistance.toFixed(1)} km away</Text>
                          </View>
                        </View>

                        {/* Cost Information */}
                        {costBreakdown && (
                          <View className="bg-blue-50 rounded-lg p-3 mb-4">
                            <View className="flex-row justify-between">
                              <Text className="text-sm text-gray-700">Cost per Person:</Text>
                              <Text className="text-sm font-semibold text-blue-600">{costBreakdown.formattedPerPersonCost}</Text>
                            </View>
                          </View>
                        )}

                        <Button
                          title="Request Match"
                          onPress={() => setSelectedMatch(match)}
                        />
                      </CardContent>
                    </Card>
                  );
                })
            )}
        </ScrollView>

        {/* Modal for Request Match */}
        <Modal
            animationType="slide"
            transparent={true}
            visible={!!selectedMatch}
            onRequestClose={() => setSelectedMatch(null)}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-white rounded-t-xl p-6">
                    <Text className="text-xl font-bold mb-4">Request Match</Text>
                    <Text className="text-gray-500 mb-4">
                        Send a match request to {selectedMatch?.profiles?.full_name || "this user"}.
                    </Text>
                    
                    <Input
                        placeholder="Add a message (optional)..."
                        value={matchMessage}
                        onChangeText={setMatchMessage}
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top' }}
                        containerClassName="mb-4"
                    />
                    
                    <View className="flex-row gap-4">
                        <Button 
                            title="Cancel" 
                            variant="outline" 
                            className="flex-1"
                            onPress={() => setSelectedMatch(null)}
                        />
                        <Button 
                            title={requesting ? "Sending..." : "Send Request"} 
                            className="flex-1"
                            disabled={requesting}
                            onPress={handleRequestMatch}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    </Container>
  );
}
