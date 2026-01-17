import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Switch, Platform, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Container } from '../components/ui/Container';
import { ArrowLeft, Calendar, Clock } from 'lucide-react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import DateTimePicker from '@react-native-community/datetimepicker';

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || "";

export function CreateRideScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pickup, setPickup] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{lat: number, lng: number} | null>(null);

  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState<{lat: number, lng: number} | null>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState<'date' | 'time'>('date');

  const [isDriver, setIsDriver] = useState(false);
  const [seatsNeeded, setSeatsNeeded] = useState("1");
  const [seatsAvailable, setSeatsAvailable] = useState("3");
  const [notes, setNotes] = useState("");

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const showMode = (currentMode: 'date' | 'time') => {
    setShowDatePicker(true);
    setMode(currentMode);
  };

  const handleSubmit = async () => {
    if (!pickup || !destination) {
      Alert.alert("Error", "Please enter both pickup and destination locations");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("ride_requests").insert({
        user_id: user?.id,
        pickup_address: pickup,
        pickup_lat: pickupCoords?.lat || 0,
        pickup_lng: pickupCoords?.lng || 0,
        destination_address: destination,
        destination_lat: destinationCoords?.lat || 0,
        destination_lng: destinationCoords?.lng || 0,
        departure_time: date.toISOString(),
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

  const autoCompleteStyles = {
    container: {
        flex: 0,
    },
    textInput: {
        height: 50,
        borderColor: '#D1D5DB', // gray-300
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 12,
        backgroundColor: 'white',
        fontSize: 16,
    },
    listView: {
        backgroundColor: 'white',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginTop: 4,
        zIndex: 5000,
        position: 'absolute' as 'absolute',
        top: 50,
        left: 0,
        right: 0,
    }
  };

  return (
    <Container>
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
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

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
          {/* Location Inputs */}
          <Card className="mb-4 overflow-visible z-50">
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
            </CardHeader>
            <CardContent className="z-50">
                <View className="mb-4 z-50">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Pickup Location</Text>
                    <GooglePlacesAutocomplete
                        placeholder='Enter pickup address...'
                        onPress={(data, details = null) => {
                            setPickup(data.description);
                            if (details) {
                                setPickupCoords({
                                    lat: details.geometry.location.lat,
                                    lng: details.geometry.location.lng
                                });
                            }
                        }}
                        query={{
                            key: GOOGLE_MAPS_KEY,
                            language: 'en',
                        }}
                        fetchDetails={true}
                        styles={autoCompleteStyles}
                        enablePoweredByContainer={false}
                        textInputProps={{
                            value: pickup,
                            onChangeText: setPickup
                        }}
                    />
                </View>
              
                <View className="mb-4 z-40">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Destination</Text>
                    <GooglePlacesAutocomplete
                        placeholder='Enter destination address...'
                        onPress={(data, details = null) => {
                            setDestination(data.description);
                            if (details) {
                                setDestinationCoords({
                                    lat: details.geometry.location.lat,
                                    lng: details.geometry.location.lng
                                });
                            }
                        }}
                        query={{
                            key: GOOGLE_MAPS_KEY,
                            language: 'en',
                        }}
                        fetchDetails={true}
                        styles={autoCompleteStyles}
                        enablePoweredByContainer={false}
                        textInputProps={{
                            value: destination,
                            onChangeText: setDestination
                        }}
                    />
                </View>

                <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Departure Time</Text>
                    <View className="flex-row space-x-2">
                        <TouchableOpacity
                            onPress={() => showMode('date')}
                            className="flex-1 flex-row items-center p-3 border border-gray-300 rounded-md bg-white"
                        >
                            <Calendar size={20} color="#6B7280" className="mr-2" />
                            <Text>{date.toLocaleDateString()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => showMode('time')}
                            className="flex-1 flex-row items-center p-3 border border-gray-300 rounded-md bg-white"
                        >
                            <Clock size={20} color="#6B7280" className="mr-2" />
                            <Text>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode={mode}
                            is24Hour={true}
                            onChange={onDateChange}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        />
                    )}

                    {Platform.OS === 'ios' && showDatePicker && (
                         <View className="flex-row justify-end mt-2">
                            <TouchableOpacity onPress={() => setShowDatePicker(false)} className="bg-blue-500 px-4 py-2 rounded-md">
                                <Text className="text-white">Done</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </CardContent>
          </Card>

          {/* Ride Type */}
          <Card className="mb-6 -z-10">
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
        </KeyboardAvoidingView>
    </Container>
  );
}
