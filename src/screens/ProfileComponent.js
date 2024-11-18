import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileComponent = ({ userId }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data when the component mounts
    const fetchUserData = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
          setUserInfo(userDoc.data());
        } else {
          console.log('No user data found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e57c2" />
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User information could not be retrieved.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profilePictureContainer}>
        {userInfo.photoURL ? (
          <Image source={{ uri: userInfo.photoURL }} style={styles.profilePicture} />
        ) : (
          <Icon name="account-box" size={100} color="#7e57c2" />
        )}
      </View>
      <Text style={styles.usernameText}>{userInfo.username}</Text>
      <Text style={styles.genderText}>Gender: {userInfo.gender}</Text>
      {/* Add other user information here if available */}
      <Text style={styles.infoText}>Current Room: {userInfo.currentRoom || 'Not in any room'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePictureContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  genderText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#777',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default ProfileComponent;
