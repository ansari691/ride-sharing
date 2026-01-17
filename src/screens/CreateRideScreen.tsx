import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Container } from '../components/ui/Container';
import { ArrowLeft } from 'lucide-react-native';

export function CreateRideScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [isDriver, setIsDriver] = useState(false);
  const [seatsNeeded, setSeatsNeeded] = useState("1");
  const [seatsAvailable, setSeatsAvailable] = useState("3");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!pickup || !destination) {
      Alert.alert("Error", "Please enter both pickup and destination locations");
      return;
    }

    if (!departureTime) {
        Alert.alert("Error", "Please enter a departure time");
        return;
    }
    
    // Simple validation for date format could be added here
    let dateObj;
    try {
        dateObj = new Date(departureTime);
        if (isNaN(dateObj.getTime())) throw new Error("Invalid Date");
    } catch (e) {
        Alert.alert("Error", "Invalid date format. Use YYYY-MM-DD HH:MM");
        return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("ride_requests").insert({
        user_id: user?.id,
        pickup_address: pickup,
        pickup_lat: 0, // Placeholder
        pickup_lng: 0, // Placeholder
        destination_address: destination,
        destination_lat: 0, // Placeholder
        destination_lng: 0, // Placeholder
        departure_time: dateObj.toISOString(),
        is_driver: isDriver,
        seats_needed: isDriver ? 0 : parseInt(seatsNeeded),
        seats_available: isDriver ? parseInt(seatsAvailable) : null,
        notes: notes || null,
      });

      if (error) throw error;

      Alert.alert("Success", "Ride request created successfully!");
      navigation.navigate("Home");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create ride request");
    } finally {
      setIsSubmitting(false);
    }
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
            <Text className="text-xl font-bold">Create Ride Request</Text>
        </View>

      <ScrollView showsVerticalScrollIndicator={false}>
          {/* Location Inputs */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
            </CardHeader>
            <CardContent>
                <Input
                  label="Pickup Location"
                  placeholder="Enter pickup address..."
                  value={pickup}
                  onChangeText={setPickup}
                  containerClassName="mb-4"
                />
              
                <Input
                  label="Destination"
                  placeholder="Enter destination address..."
                  value={destination}
                  onChangeText={setDestination}
                  containerClassName="mb-4"
                />

                <Input
                  label="Departure Time (YYYY-MM-DD HH:MM)"
                  placeholder="2023-12-25 10:00"
                  value={departureTime}
                  onChangeText={setDepartureTime}
                />
            </CardContent>
          </Card>

          {/* Ride Type */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ride Details</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1 pr-4">
                  <Text className="font-medium">I'm offering a ride (Driver)</Text>
                  <Text className="text-sm text-gray-500">
                    Toggle on if you have a car
                  </Text>
                </View>
                <Switch
                  value={isDriver}
                  onValueChange={setIsDriver}
                  trackColor={{ false: "#767577", true: "#2563EB" }}
                />
              </View>

              {isDriver ? (
                  <Input
                    label="Seats Available"
                    keyboardType="numeric"
                    value={seatsAvailable}
                    onChangeText={setSeatsAvailable}
                    containerClassName="mb-4"
                  />
              ) : (
                  <Input
                    label="Seats Needed"
                    keyboardType="numeric"
                    value={seatsNeeded}
                    onChangeText={setSeatsNeeded}
                    containerClassName="mb-4"
                  />
              )}

                <Input
                    label="Additional Notes"
                    placeholder="Any special requests..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: 'top' }}
                />
            </CardContent>
          </Card>

          <Button
            title={isSubmitting ? "Creating..." : (isDriver ? "Offer Ride" : "Request Ride")}
            onPress={handleSubmit}
            disabled={isSubmitting}
            className="mb-8"
          />
        </ScrollView>
    </Container>
  );
}
