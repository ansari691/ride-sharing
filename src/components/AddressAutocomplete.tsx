import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Input } from './ui/Input';
import { searchAddress, MapboxPlace } from '../lib/mapbox';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface AddressAutocompleteProps {
  label: string;
  placeholder?: string;
  onSelect: (place: MapboxPlace) => void;
  defaultValue?: string;
  containerClassName?: string;
}

export function AddressAutocomplete({ label, placeholder, onSelect, defaultValue = "", containerClassName }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<MapboxPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2 && showSuggestions) {
        setLoading(true);
        const results = await searchAddress(query);
        setSuggestions(results);
        setLoading(false);
      } else if (query.length <= 2) {
          setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, showSuggestions]);

  const handleSelect = (place: MapboxPlace) => {
    setQuery(place.place_name);
    setShowSuggestions(false);
    onSelect(place);
  };

  const handleChangeText = (text: string) => {
      setQuery(text);
      setShowSuggestions(true);
  }

  return (
    <StyledView className={`relative ${containerClassName}`}>
      <Input
        label={label}
        placeholder={placeholder}
        value={query}
        onChangeText={handleChangeText}
        onFocus={() => setShowSuggestions(true)}
      />

      {loading && (
          <StyledView className="absolute right-4 top-10">
              <ActivityIndicator size="small" color="#000" />
          </StyledView>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <StyledView className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg" style={{ zIndex: 1000, elevation: 5, maxHeight: 200 }}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={true}
            renderItem={({ item }) => (
              <StyledTouchableOpacity
                className="p-3 border-b border-gray-100 active:bg-gray-50"
                onPress={() => handleSelect(item)}
              >
                <StyledText className="font-medium text-sm text-gray-900" numberOfLines={1}>{item.place_name.split(',')[0]}</StyledText>
                <StyledText className="text-xs text-gray-500" numberOfLines={1}>{item.place_name}</StyledText>
              </StyledTouchableOpacity>
            )}
          />
        </StyledView>
      )}
    </StyledView>
  );
}
