import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const RoomJoinScreen = ({ navigation }) => {
  const [roomCode, setRoomCode] = useState('');
  const user = auth().currentUser;

  const joinRoom = async () => {
    if (!roomCode) {
      Alert.alert("Error", "Please enter a valid room code.");
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
        await firestore().collection('users').doc(user.uid).set({
          currentRoom: roomCode.trim(),
        }, { merge: true });

        // Navigate to the room screen
        navigation.navigate('RoomScreen', { roomCode: roomCode.trim() });
      } else {
        Alert.alert("Error", "Room does not exist.");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      Alert.alert("Error", "Failed to join the room. Please check the room code.");
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Enter Room Code"
        value={roomCode}
        onChangeText={setRoomCode}
        style={{ borderWidth: 1, padding: 10, marginBottom: 20 }}
      />
      <Button title="Join Room" onPress={joinRoom} />
    </View>
  );
};

export default RoomJoinScreen;
