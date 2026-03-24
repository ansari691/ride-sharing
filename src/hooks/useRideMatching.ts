import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { Alert } from 'react-native';

export interface RideRequest {
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
  gender_preference: "same_gender" | "any";
  status: string;
  notes: string | null;
  total_cost: number | null;
  distance: number | null;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    rating: number | null;
  };
}

interface RideMatch {
  id: string;
  ride_request_id: string;
  matched_ride_id: string;
  requester_id: string;
  status: string;
  message: string | null;
  created_at: string;
  ride_request?: RideRequest;
  matched_ride?: RideRequest;
}

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateMatchScore = (
  ride1: RideRequest,
  ride2: RideRequest
): { score: number; pickupDistance: number; destDistance: number; timeDiff: number } => {
  const pickupDistance = calculateDistance(
    ride1.pickup_lat,
    ride1.pickup_lng,
    ride2.pickup_lat,
    ride2.pickup_lng
  );

  const destDistance = calculateDistance(
    ride1.destination_lat,
    ride1.destination_lng,
    ride2.destination_lat,
    ride2.destination_lng
  );

  const time1 = new Date(ride1.departure_time).getTime();
  const time2 = new Date(ride2.departure_time).getTime();
  const timeDiff = Math.abs(time1 - time2) / (1000 * 60);

  let score = pickupDistance * 2 + destDistance * 2 + timeDiff * 0.1;

  if (ride1.is_driver !== ride2.is_driver) {
    score *= 0.5;
  }

  return { score, pickupDistance, destDistance, timeDiff };
};

export const useRideMatching = () => {
  const { user } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState<
    (RideRequest & { matchScore: number; pickupDistance: number; destDistance: number; timeDiff: number })[]
  >([]);
  const [myMatches, setMyMatches] = useState<RideMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const findPotentialMatches = useCallback(
    async (myRide: RideRequest, maxDistance: number = 10, maxTimeDiff: number = 60) => {
      if (!user) return [];

      const { data: rides, error } = await supabase
        .from("ride_requests")
        .select("*")
        .neq("user_id", user.id)
        .eq("status", "pending")
        .gte("departure_time", new Date().toISOString());

      if (error) {
        console.error("Error fetching rides:", error);
        return [];
      }

      const userIds = [...new Set((rides || []).map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url, rating")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const matches = (rides || [])
        .map((ride) => {
          const { score, pickupDistance, destDistance, timeDiff } = calculateMatchScore(
            myRide,
            ride as RideRequest
          );
          const profile = profileMap.get(ride.user_id);
          return { 
            ...ride, 
            matchScore: score, 
            pickupDistance, 
            destDistance, 
            timeDiff,
            profiles: profile 
          };
        })
        .filter(
          (ride) =>
            ride.pickupDistance <= maxDistance &&
            ride.destDistance <= maxDistance &&
            ride.timeDiff <= maxTimeDiff
        )
        .sort((a, b) => a.matchScore - b.matchScore);

      return matches;
    },
    [user]
  );

  const fetchMyMatches = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("ride_matches")
      .select("*")
      .or(`requester_id.eq.${user.id}`);

    if (error) {
      console.error("Error fetching matches:", error);
      return;
    }

    setMyMatches(data || []);
  }, [user]);

  const requestMatch = async (
    myRideId: string,
    targetRideId: string,
    message?: string
  ) => {
    if (!user) {
      Alert.alert("Error", "Please sign in to request a match");
      return false;
    }

    try {
      const { error } = await supabase.from("ride_matches").insert({
        ride_request_id: myRideId,
        matched_ride_id: targetRideId,
        requester_id: user.id,
        message: message || null,
      });

      if (error) {
        if (error.code === "23505") {
            Alert.alert("Error", "Match request already exists");
        } else {
          throw error;
        }
        return false;
      }

      Alert.alert("Success", "Match request sent!");
      await fetchMyMatches();
      return true;
    } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to send match request");
      return false;
    }
  };

  const respondToMatch = async (
    matchId: string,
    response: "accepted" | "declined"
  ) => {
    try {
      const { error } = await supabase
        .from("ride_matches")
        .update({ status: response })
        .eq("id", matchId);

      if (error) throw error;

      Alert.alert("Success", response === "accepted"
      ? "Match accepted! You can now coordinate with your ride partner."
      : "Match declined.");
      
      await fetchMyMatches();
      return true;
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to respond to match");
      return false;
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("ride-matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_matches",
        },
        () => {
          fetchMyMatches();
        }
      )
      .subscribe();

    fetchMyMatches().finally(() => setLoading(false));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMyMatches]);

  return {
    potentialMatches,
    myMatches,
    loading,
    findPotentialMatches,
    requestMatch,
    respondToMatch,
    fetchMyMatches,
  };
};
