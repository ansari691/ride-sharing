import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Container } from '../components/ui/Container';
import { ArrowLeft } from 'lucide-react-native';
import MapboxGL from '@rnmapbox/maps';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { getRoute, MapboxPlace, MapboxRoute } from '../lib/mapbox';

export function CreateRideScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pickupPlace, setPickupPlace] = useState<MapboxPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<MapboxPlace | null>(null);
  const [route, setRoute] = useState<MapboxRoute | null>(null);

  const [departureTime, setDepartureTime] = useState("");
  const [isDriver, setIsDriver] = useState(false);
  const [seatsNeeded, setSeatsNeeded] = useState("1");
  const [seatsAvailable, setSeatsAvailable] = useState("3");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchRoute = async () => {
      if (pickupPlace && destinationPlace) {
        const routeData = await getRoute(pickupPlace.center, destinationPlace.center);
        setRoute(routeData);
      } else {
        setRoute(null);
      }
    };
    fetchRoute();
  }, [pickupPlace, destinationPlace]);

  const handleSubmit = async () => {
    if (!pickupPlace || !destinationPlace) {
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
        pickup_address: pickupPlace.place_name,
        pickup_lat: pickupPlace.center[1], // lat is index 1
        pickup_lng: pickupPlace.center[0], // lng is index 0
        destination_address: destinationPlace.place_name,
        destination_lat: destinationPlace.center[1],
        destination_lng: destinationPlace.center[0],
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

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Location Inputs */}
          <Card className="mb-4 z-50">
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
            </CardHeader>
            <CardContent>
                <AddressAutocomplete
                  label="Pickup Location"
                  placeholder="Enter pickup address..."
                  onSelect={setPickupPlace}
                  containerClassName="mb-4 z-50"
                />
              
                <AddressAutocomplete
                  label="Destination"
                  placeholder="Enter destination address..."
                  onSelect={setDestinationPlace}
                  containerClassName="mb-4 z-40"
                />

                <Input
                  label="Departure Time (YYYY-MM-DD HH:MM)"
                  placeholder="2023-12-25 10:00"
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  containerClassName="z-30"
                />
            </CardContent>
          </Card>

           {/* Map Preview */}
           {pickupPlace && destinationPlace && route && (
            <Card className="mb-4 h-64 overflow-hidden z-20">
              <MapboxGL.MapView style={{ flex: 1 }}>
                <MapboxGL.Camera
                  bounds={{
                    ne: [
                      Math.max(pickupPlace.center[0], destinationPlace.center[0]),
                      Math.max(pickupPlace.center[1], destinationPlace.center[1]),
                    ],
                    sw: [
                      Math.min(pickupPlace.center[0], destinationPlace.center[0]),
                      Math.min(pickupPlace.center[1], destinationPlace.center[1]),
                    ],
                    paddingBottom: 50,
                    paddingTop: 50,
                    paddingLeft: 50,
                    paddingRight: 50,
                  }}
                  animationDuration={2000}
                />

                {/* Pickup Marker */}
                <MapboxGL.PointAnnotation
                  id="pickup"
                  coordinate={pickupPlace.center}
                >
                   <View style={{
                      height: 20,
                      width: 20,
                      backgroundColor: 'green',
                      borderRadius: 10,
                      borderColor: 'white',
                      borderWidth: 2
                    }} />
                </MapboxGL.PointAnnotation>

                {/* Destination Marker */}
                <MapboxGL.PointAnnotation
                  id="destination"
                  coordinate={destinationPlace.center}
                >
                   <View style={{
                      height: 20,
                      width: 20,
                      backgroundColor: 'red',
                      borderRadius: 10,
                      borderColor: 'white',
                      borderWidth: 2
                    }} />
                </MapboxGL.PointAnnotation>

                {/* Route Line */}
                <MapboxGL.ShapeSource id="routeSource" shape={route.geometry}>
                  <MapboxGL.LineLayer
                    id="routeFill"
                    style={{
                      lineColor: '#3b82f6',
                      lineWidth: 5,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </MapboxGL.ShapeSource>
              </MapboxGL.MapView>
            </Card>
          )}

          {/* Ride Type */}
          <Card className="mb-6 z-10">
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
