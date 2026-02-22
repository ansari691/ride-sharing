import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RadioButtonGroup } from '../components/ui/RadioButton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Container } from '../components/ui/Container';
import { Car } from 'lucide-react-native';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    let error;

    if (isLogin) {
      const res = await signIn(email, password);
      error = res.error;
    } else {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (!name) {
        Alert.alert('Error', 'Please enter your name');
        setIsLoading(false);
        return;
      }
       if (!gender) {
        Alert.alert('Error', 'Please select your gender');
        setIsLoading(false);
        return;
      }
       if (!phone) {
        Alert.alert('Error', 'Please enter your phone number');
        setIsLoading(false);
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
        Alert.alert('Error', 'Phone number must be 10 digits');
        setIsLoading(false);
        return;
      }
      const res = await signUp(email, password, name, gender, phone);
      error = res.error;
    }

    setIsLoading(false);

    if (error) {
      Alert.alert('Authentication Failed', error.message);
    } else {
        if (!isLogin) {
            //  Alert.alert('Success', 'Account created!');
             setIsLogin(true);
        }
    }
  };

  return (
    <Container>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View className="items-center mb-8">
        <View className="h-16 w-16 bg-blue-600 rounded-2xl items-center justify-center mb-4">
          <Car size={32} color="white" />
        </View>
        <Text className="text-3xl font-bold text-gray-900">Cab Connect</Text>
        <Text className="text-gray-500 mt-2 text-center">Share rides, save together</Text>
      </View>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">{isLogin ? 'Welcome Back' : 'Create Account'}</CardTitle>
        </CardHeader>
        <CardContent>
          <View className="flex-row mb-6 bg-gray-100 p-1 rounded-lg">
            <Button 
                title="Login" 
                variant={isLogin ? 'primary' : 'ghost'} 
                className="flex-1 rounded-md" 
                onPress={() => setIsLogin(true)} 
            />
            <Button 
                title="Sign Up" 
                variant={!isLogin ? 'primary' : 'ghost'} 
                className="flex-1 rounded-md" 
                onPress={() => setIsLogin(false)} 
            />
          </View>

          {!isLogin && (
            <>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                containerClassName="mb-4"
              />
               <RadioButtonGroup
                label="Gender"
                value={gender}
                options={[
                    { label: 'Male', value: 'male' },
                    { label: 'Female', value: 'female' },
                ]}
                onValueChange={setGender}
                containerClassName="mb-4"
              />
               <Input
                label="Phone Number"
                placeholder="1234567890"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                containerClassName="mb-4"
              />
            </>
          )}

          <Input 
            label="Email" 
            placeholder="you@example.com" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            containerClassName="mb-4"
          />

          <Input 
            label="Password" 
            placeholder="••••••••" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            containerClassName="mb-4"
          />

          {!isLogin && (
            <Input 
              label="Confirm Password" 
              placeholder="••••••••" 
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              containerClassName="mb-4"
            />
          )}

          <Button 
            title={isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Create Account')} 
            onPress={handleAuth}
            disabled={isLoading}
            className="mt-2"
          />
        </CardContent>
      </Card>
      </ScrollView>
    </Container>
  );
}
