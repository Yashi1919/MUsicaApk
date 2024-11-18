import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignUpScreen from './src/auth/SignUpScreen';
import LoginScreen from './src/auth/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import RoomScreen from './src/screens/RoomScreen';
import SplashScreen from './src/screens/SplashScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

const Stack = createStackNavigator();
const navigationRef = React.createRef();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  const onAuthStateChanged = (user) => {
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

    // Show the instructions as an alert if they haven't been completed
    const checkInstructionsCompletion = async () => {
      try {
        const value = await AsyncStorage.getItem('instructionsCompleted');
        if (value === null) {
          showInstructionsAlert(); // Show alert if instructions not completed
        }
      } catch (error) {
        console.error('Failed to check instruction completion:', error);
      }
    };

    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    checkInstructionsCompletion();

    return () => {
      clearTimeout(timer);
      subscriber(); // Unsubscribe on unmount
    };
  }, []);

  const showInstructionsAlert = () => {
    Alert.alert(
      'Important Instructions',
      '1. Please lock your app in recent apps to ensure proper functionality.\n' +
      '2. Ensure your internet connection is stable.\n' +
      '3. Keep the app running in the background for the best experience.',
      [
        {
          text: 'Completed',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('instructionsCompleted', 'true');
            } catch (error) {
              console.error('Error saving instruction completion:', error);
            }
          },
          style: 'default',
        },
      ],
      { cancelable: false } // Make sure the alert cannot be dismissed without action
    );
  };

  if (initializing) return null;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={showSplash ? 'SplashScreen' : user ? 'MainScreen' : 'LoginScreen'}
        screenOptions={{
          headerShown: false,
        }}
      >
        {showSplash ? (
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
        ) : user ? (
          <>
            <Stack.Screen
              name="MainScreen"
              component={MainScreen}
              options={{
                title: 'Home',
                headerLeft: null, // Hide the back button on MainScreen
              }}
              initialParams={{ userId: user?.uid }} // Pass the userId as an initial parameter
            />
            <Stack.Screen
              name="RoomScreen"
              component={RoomScreen}
              options={{
                title: 'Room',
                headerShown: false, // Hide the header for RoomScreen
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ title: 'Login' }} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ title: 'Sign Up' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
