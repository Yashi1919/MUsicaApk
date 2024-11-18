import React, { useState } from 'react';
import { View, TextInput, Alert, Text, TouchableOpacity, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const RoomCreationScreen = ({ navigation }) => {
  const [roomCode, setRoomCode] = useState('');
  const [newRoomCode, setNewRoomCode] = useState(null);
  const user = auth().currentUser;

  const createRoom = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      await firestore().collection('rooms').doc(code).set({
        roomCode: code,
        leader: {
          uid: user.uid,
          email: user.email,
        },
        members: [
          {
            uid: user.uid,
            email: user.email,
          },
        ],
        musicFiles: [],
        currentlyPlaying: {
          currentSongIndex: 0,
          currentPosition: 0,
          isPaused: true,
          isPlaying: false,
          sliderValue: 0,
        },
        status: 'active',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      setNewRoomCode(code);

      // Save the active room to Firestore under the user's document
      await firestore().collection('users').doc(user.uid).set(
        {
          currentRoom: code,
        },
        { merge: true }
      );

      // Navigate to RoomScreen
      navigation.navigate('RoomScreen', { roomCode: code });
    } catch (error) {
      Alert.alert('Error', 'Failed to create room.');
      console.error('Error creating room:', error);
    }
  };

  const joinRoom = async () => {
    if (!roomCode) {
      Alert.alert('Error', 'Please enter a valid room code.');
      return;
    }

    const roomRef = firestore().collection('rooms').doc(roomCode.trim());

    try {
      const roomSnapshot = await roomRef.get();

      if (roomSnapshot.exists) {
        // Add user to the members array
        await roomRef.update({
          members: firestore.FieldValue.arrayUnion({
            uid: user.uid,
            email: user.email,
          }),
        });

        // Store the current room info in Firestore under the user's document
        await firestore().collection('users').doc(user.uid).set(
          {
            currentRoom: roomCode.trim(),
          },
          { merge: true }
        );

        // Navigate to the room screen
        navigation.navigate('RoomScreen', { roomCode: roomCode.trim() });
      } else {
        Alert.alert('Error', 'Room does not exist.');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join the room. Please check the room code.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={createRoom}>
        <Text style={styles.buttonText}>Create Room</Text>
      </TouchableOpacity>

      {newRoomCode ? <Text style={styles.roomCodeText}>Room Code: {newRoomCode}</Text> : null}

      <TextInput
        placeholder="Enter Room Code to Join"
        value={roomCode}
        onChangeText={setRoomCode}
        style={styles.input}
        placeholderTextColor="#7e57c2"
      />

      <TouchableOpacity style={styles.button} onPress={joinRoom}>
        <Text style={styles.buttonText}>Join Room</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f3f3f3',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#7e57c2',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#7e57c2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#7e57c2',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomCodeText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#7e57c2',
    textAlign: 'center',
  },
});

export default RoomCreationScreen;
