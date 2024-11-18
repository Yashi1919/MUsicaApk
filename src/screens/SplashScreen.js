import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('./musica.png')} // Replace with your logo path
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#342b37', // Background color of the splash screen
  },
  logo: {
    width: 150, // Adjust width of your logo
    height: 150, // Adjust height of your logo
    resizeMode: 'contain',
  },
});

export default SplashScreen;
