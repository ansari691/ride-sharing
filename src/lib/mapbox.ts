import { EXPO_PUBLIC_MAPBOX_TOKEN } from "@env";

const MAPBOX_API_URL = 'https://api.mapbox.com';

export interface MapboxPlace {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
  geometry: {
      type: string;
      coordinates: [number, number];
  }
}

export interface MapboxRoute {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  duration: number;
  distance: number;
}

export const searchAddress = async (query: string): Promise<MapboxPlace[]> => {
  if (!query) return [];

  try {
    const response = await fetch(
      `${MAPBOX_API_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${EXPO_PUBLIC_MAPBOX_TOKEN}&autocomplete=true&types=address,poi&bbox=73%2C19.2%2C73.15%2C19.35`
    );

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error searching address:', error);
    return [];
  }
};

export const getRoute = async (
  start: [number, number],
  end: [number, number]
): Promise<MapboxRoute | null> => {
  try {
    const coordinates = `${start[0]},${start[1]};${end[0]},${end[1]}`;
    const response = await fetch(
      `${MAPBOX_API_URL}/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&access_token=${EXPO_PUBLIC_MAPBOX_TOKEN}`
    );

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
};
