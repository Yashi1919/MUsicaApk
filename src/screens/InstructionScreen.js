import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const InstructionScreen = () => {
  const navigation = useNavigation();

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('instructionsCompleted', 'true');
      // Use 'reset' instead of 'replace' to ensure a clean navigation stack
      navigation.navigate({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Error setting instructions as completed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Important Instructions</Text>
      <Text style={styles.text}>
        1. Please lock your app in recent apps to ensure proper functionality.{'\n'}
        2. Ensure your internet connection is stable.{'\n'}
        3. Keep the app running in the background for the best experience.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleComplete}>
        <Text style={styles.buttonText}>Completed</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#7e57c2',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333333',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#7e57c2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InstructionScreen;
