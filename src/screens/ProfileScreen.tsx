import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RadioButtonGroup } from '../components/ui/RadioButton';
import { Container } from '../components/ui/Container';
import { LogOut, User as UserIcon, Camera } from 'lucide-react-native';

interface ProfileData {
  id: string; // usually same as user_id or uuid
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  gender: string | null;
  phone: string | null;
  rating: number | null;
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit State
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    phone: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist in table but user is logged in, might be a sync issue or first time
        // We can fallback to user metadata
        console.log('Error fetching profile or no profile found:', error);
        setProfile({
            id: 'temp',
            user_id: user.id,
            full_name: user.user_metadata.full_name || '',
            avatar_url: null,
            gender: user.user_metadata.gender || '',
            phone: user.user_metadata.phone || '',
            rating: null
        });
        setFormData({
            full_name: user.user_metadata.full_name || '',
            gender: user.user_metadata.gender || '',
            phone: user.user_metadata.phone || '',
        });
      } else {
        setProfile(data);
        setFormData({
            full_name: data.full_name || '',
            gender: data.gender || '',
            phone: data.phone || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!formData.full_name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    setSaving(true);

    try {
        const updates = {
            full_name: formData.full_name,
            gender: formData.gender,
            phone: formData.phone,
            updated_at: new Date(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', user.id);

        if (error) {
            throw error;
        }

        // Also update auth metadata for consistency if needed, but profiles table is main
        await supabase.auth.updateUser({
            data: {
                full_name: formData.full_name,
                gender: formData.gender,
                phone: formData.phone
            }
        });

        setProfile(prev => prev ? { ...prev, ...updates } : null);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');

    } catch (error: any) {
        Alert.alert('Error', error.message);
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
    return (
        <Container>
            <View className="flex-1 items-center justify-center">
                <Text>Loading profile...</Text>
            </View>
        </Container>
    );
  }

  return (
    <Container>
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-blue-600">Profile</Text>
        <TouchableOpacity onPress={() => signOut()}>
           <LogOut size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8">
            <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4 overflow-hidden relative">
                {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} className="w-full h-full" />
                ) : (
                    <UserIcon size={48} color="gray" />
                )}
                {/* Placeholder for avatar upload */}
                {isEditing && (
                    <View className="absolute bottom-0 w-full bg-black/50 h-8 items-center justify-center">
                        <Camera size={16} color="white" />
                    </View>
                )}
            </View>
            {!isEditing && (
                <>
                    <Text className="text-xl font-bold text-gray-900">{profile?.full_name}</Text>
                    {profile?.rating && (
                        <Text className="text-sm text-gray-500">Rating: {profile.rating} / 5.0</Text>
                    )}
                </>
            )}
        </View>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">Personal Info</Text>
                {!isEditing && (
                    <Button
                        title="Edit"
                        variant="ghost"
                        onPress={() => setIsEditing(true)}
                        className="h-8 py-0"
                    />
                )}
            </View>

            {isEditing ? (
                <View className="space-y-4">
                    <Input
                        label="Full Name"
                        value={formData.full_name}
                        onChangeText={(text) => setFormData({...formData, full_name: text})}
                    />
                    <RadioButtonGroup
                        label="Gender"
                        value={formData.gender}
                        options={[
                            { label: 'Male', value: 'male' },
                            { label: 'Female', value: 'female' },
                        ]}
                        onValueChange={(value) => setFormData({...formData, gender: value})}
                    />
                    <Input
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(text) => setFormData({...formData, phone: text})}
                        placeholder="1234567890"
                        keyboardType="phone-pad"
                    />
                    <View className="flex-row gap-4 mt-4">
                        <Button
                            title="Cancel"
                            variant="outline"
                            className="flex-1"
                            onPress={() => {
                                setIsEditing(false);
                                setFormData({
                                    full_name: profile?.full_name || '',
                                    gender: profile?.gender || '',
                                    phone: profile?.phone || '',
                                });
                            }}
                        />
                        <Button
                            title={saving ? "Saving..." : "Save Changes"}
                            className="flex-1"
                            onPress={handleSave}
                            disabled={saving}
                        />
                    </View>
                </View>
            ) : (
                <View className="space-y-4">
                    <View>
                        <Text className="text-sm text-gray-500 mb-1">Full Name</Text>
                        <Text className="text-base text-gray-900">{profile?.full_name || 'Not set'}</Text>
                    </View>
                    <View className="h-[1px] bg-gray-100" />
                    <View>
                        <Text className="text-sm text-gray-500 mb-1">Gender</Text>
                        <Text className="text-base text-gray-900 capitalize">{profile?.gender || 'Not set'}</Text>
                    </View>
                    <View className="h-[1px] bg-gray-100" />
                    <View>
                        <Text className="text-sm text-gray-500 mb-1">Phone Number</Text>
                        <Text className="text-base text-gray-900">{profile?.phone || 'Not set'}</Text>
                    </View>
                    <View className="h-[1px] bg-gray-100" />
                     <View>
                        <Text className="text-sm text-gray-500 mb-1">Email</Text>
                        <Text className="text-base text-gray-900">{user?.email}</Text>
                    </View>
                </View>
            )}
        </View>

        <View className="mb-20">
             <Button
                title="Sign Out"
                variant="outline"
                className="w-full border-red-200"
                textClassName="text-red-600"
                onPress={() => signOut()}
            />
        </View>
      </ScrollView>
    </Container>
  );
}
