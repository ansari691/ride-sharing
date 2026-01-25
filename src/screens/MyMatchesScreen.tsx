import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useRideMatching } from '../hooks/useRideMatching';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Container } from '../components/ui/Container';
import { ArrowLeft, MapPin, Clock, Users, MessageSquare } from 'lucide-react-native';

interface MatchWithDetails {
  id: string;
  ride_request_id: string;
  matched_ride_id: string;
  requester_id: string;
  status: string;
  message: string | null;
  created_at: string;
  ride_request: any;
  matched_ride: any;
  requester_profile?: any;
  other_profile?: any;
}

export function MyMatchesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { respondToMatch } = useRideMatching();
  const [matches, setMatches] = useState<MatchWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'past'>('pending');

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user) return;

      const { data: userRides } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("user_id", user.id);

      if (!userRides || userRides.length === 0) {
        setLoading(false);
        return;
      }

      const rideIds = userRides.map((r) => r.id);

      const { data: matchesData, error } = await supabase
        .from("ride_matches")
        .select("*")
        .or(`ride_request_id.in.(${rideIds.join(",")}),matched_ride_id.in.(${rideIds.join(",")})`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching matches:", error);
        setLoading(false);
        return;
      }

      const matchesWithDetails = await Promise.all(
        (matchesData || []).map(async (match) => {
          const [rideRequest, matchedRide] = await Promise.all([
            supabase
              .from("ride_requests")
              .select("*")
              .eq("id", match.ride_request_id)
              .maybeSingle(),
            supabase
              .from("ride_requests")
              .select("*")
              .eq("id", match.matched_ride_id)
              .maybeSingle(),
          ]);

          const userIds = [rideRequest.data?.user_id, matchedRide.data?.user_id].filter(Boolean);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url, rating")
            .in("user_id", userIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

          return {
            ...match,
            ride_request: rideRequest.data ? { 
              ...rideRequest.data, 
              profiles: profileMap.get(rideRequest.data.user_id) 
            } : null,
            matched_ride: matchedRide.data ? { 
              ...matchedRide.data, 
              profiles: profileMap.get(matchedRide.data.user_id) 
            } : null,
          };
        })
      );

      setMatches(matchesWithDetails as MatchWithDetails[]);
      setLoading(false);
    };

    if (user) {
      fetchMatches();
      const channel = supabase
        .channel("my-matches")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ride_matches" },
          () => fetchMatches()
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const handleRespond = async (matchId: string, response: "accepted" | "declined") => {
    setResponding(matchId);
    await respondToMatch(matchId, response);
    setResponding(null);
  };

  const pendingMatches = matches.filter((m) => m.status === "pending");
  const acceptedMatches = matches.filter((m) => m.status === "accepted");
  const pastMatches = matches.filter((m) => m.status === "declined" || m.status === "cancelled");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const MatchCard = ({ match }: { match: MatchWithDetails }) => {
    const isRequester = match.requester_id === user?.id;
    const otherRide = isRequester ? match.matched_ride : match.ride_request;
    const canRespond = !isRequester && match.status === "pending";

    return (
      <Card className="mb-4">
        <CardContent>
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-2">
                <Users size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="font-medium">{otherRide?.profiles?.full_name || "User"}</Text>
                <Text className="text-xs text-gray-500">{isRequester ? "You requested" : "Requested to join"}</Text>
              </View>
            </View>
            <View className={`px-2 py-1 rounded-md bg-gray-100`}>
                <Text className="text-xs capitalize">{match.status}</Text>
            </View>
          </View>

          {otherRide && (
            <View className="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
              <View className="flex-row items-start">
                <MapPin size={16} color="#2563EB" />
                <Text className="ml-2 text-sm text-gray-800 flex-1">{otherRide.pickup_address}</Text>
              </View>
              <View className="flex-row items-start">
                <MapPin size={16} color="#F59E0B" />
                <Text className="ml-2 text-sm text-gray-800 flex-1">{otherRide.destination_address}</Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Clock size={16} color="gray" />
                <Text className="ml-2 text-xs text-gray-500">{formatDate(otherRide.departure_time)}</Text>
              </View>
            </View>
          )}

          {match.message && (
             <View className="mb-3 p-3 bg-blue-50 rounded-lg flex-row items-start">
                <MessageSquare size={16} color="#2563EB" className="mt-1" />
                <Text className="ml-2 text-sm text-gray-800 flex-1">{match.message}</Text>
             </View>
          )}

          {canRespond && (
            <View className="flex-row gap-2 mt-2">
                <Button 
                    title="Decline" 
                    variant="outline" 
                    className="flex-1" 
                    onPress={() => handleRespond(match.id, "declined")}
                    disabled={responding === match.id}
                />
                <Button 
                    title={responding === match.id ? "..." : "Accept"}
                    className="flex-1 bg-green-600"
                    onPress={() => handleRespond(match.id, "accepted")}
                    disabled={responding === match.id}
                />
            </View>
          )}

          {match.status === "accepted" && (
             <Button 
                title="Chat (Not Implemented)" 
                variant="outline" 
                className="w-full mt-2" 
                onPress={() => Alert.alert("Coming Soon", "Chat is not yet implemented.")}
             />
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container>
        <View className="flex-row items-center mb-6">
            <Text className="text-2xl font-bold text-blue-600">My Matches</Text>
        </View>

        <View className="flex-row mb-4 bg-gray-100 p-1 rounded-lg">
            {(['pending', 'accepted', 'past'] as const).map((tab) => (
                <TouchableOpacity 
                    key={tab}
                    className={`flex-1 py-2 rounded-md items-center ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text className={`font-medium capitalize ${activeTab === tab ? 'text-blue-600' : 'text-gray-500'}`}>
                        {tab}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
            {activeTab === 'pending' && (
                pendingMatches.length === 0 ? <Text className="text-center text-gray-500 py-8">No pending requests</Text> :
                pendingMatches.map(match => <MatchCard key={match.id} match={match} />)
            )}
            {activeTab === 'accepted' && (
                acceptedMatches.length === 0 ? <Text className="text-center text-gray-500 py-8">No accepted matches</Text> :
                acceptedMatches.map(match => <MatchCard key={match.id} match={match} />)
            )}
            {activeTab === 'past' && (
                pastMatches.length === 0 ? <Text className="text-center text-gray-500 py-8">No past matches</Text> :
                pastMatches.map(match => <MatchCard key={match.id} match={match} />)
            )}
        </ScrollView>
    </Container>
  );
}
