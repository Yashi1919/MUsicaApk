import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RoomCreationScreen from './RoomCreationScreen';
import RoomJoinScreen from './RoomJoinScreen';
import ActiveRooms from './ActiveRoom';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import auth from '@react-native-firebase/auth';
import ProfileComponent from './ProfileComponent';
const Tab = createBottomTabNavigator();
import { useNavigation } from '@react-navigation/native';
import NormalMusicPlayer from '../services/NormalMusicPlayer';

const MainScreen = () => {
  const navigation=useNavigation()

  const logout = () => {
    auth()
      .signOut()
      .then(() => {
        console.log('User signed out successfully.');
        navigation.navigate({
          index: 0,
          routes: [{ name: 'LoginScreen' }], // Ensure this navigates to the login screen
        });
      })
      .catch(error => {
        console.log('Failed to log out:');
      });
  };

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'NormalPlayer') {
            iconName = focused ? 'music-note' : 'music-note';
          } else if (route.name === 'Create/Join') {
            iconName = focused ? 'group-add' : 'group-add';
          } else if (route.name === 'ActiveRooms') {
            iconName = focused ? 'check-circle' : 'check-circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7e57c2',
        tabBarInactiveTintColor: '#000000',
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: '#7e57c2', // Style the header background
        },
        headerTintColor: '#fff', // Style the header text color
      })}
    >
      <Tab.Screen name="ActiveRooms" component={ActiveRooms} />
      <Tab.Screen name="Create/Join" component={RoomCreationScreen} />
      <Tab.Screen name="NormalPlayer" component={NormalMusicPlayer} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#7e57c2', // Purple color for the "Logout" button
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Space between the button and the screen edge
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MainScreen;
