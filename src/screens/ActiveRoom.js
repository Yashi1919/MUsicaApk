import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';

const ActiveRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [renameRoomId, setRenameRoomId] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const navigation = useNavigation();
  const currentUser = auth().currentUser;

  // Fetch active rooms from Firestore where status is 'active' and the user is a member
  const fetchActiveRooms = async () => {
    try {
      const roomsSnapshot = await firestore()
        .collection('rooms')
        .where('status', '==', 'active')
        .get();

      // Filter rooms where the user is a member
      const activeRooms = roomsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(room => room.members.some(member => member.uid === currentUser.uid));

      setRooms(activeRooms);
    } catch (error) {
      console.error('Error fetching active rooms:', error);
      Alert.alert('Error', 'Failed to fetch active rooms.');
    }
  };

  // Use useFocusEffect to reload the component when it gains focus
  useFocusEffect(
    useCallback(() => {
      fetchActiveRooms();
    }, [])
  );

  // Function to rename a room
  const renameRoom = async (roomId) => {
    if (newRoomName.trim() === '') {
      Alert.alert('Error', 'Room name cannot be empty.');
      return;
    }

    try {
      const roomRef = firestore().collection('rooms').doc(roomId);
      await roomRef.update({
        roomName: newRoomName,
      });
      Alert.alert('Success', 'Room renamed successfully.');
      setRenameRoomId(null);
      setNewRoomName('');
      fetchActiveRooms(); // Refresh rooms after renaming
    } catch (error) {
      console.error('Error renaming room:', error);
      Alert.alert('Error', 'Failed to rename the room.');
    }
  };

  // Render room details and navigate to RoomScreen on press
  const renderRoom = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('RoomScreen', { roomCode: item.roomCode })}>
      <View style={styles.roomContainer}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>
            {item.roomName ? item.roomName : item.roomCode}
          </Text>
          <Icon name="edit" size={20} color="#7e57c2" onPress={() => setRenameRoomId(item.id)} />
        </View>

        <Text style={styles.memberTitle}>Members:</Text>
        <FlatList
          data={item.members}
          keyExtractor={(member) => member.uid}
          renderItem={({ item: member }) => <Text style={styles.memberText}>{member.email}</Text>}
        />

        {renameRoomId === item.id && (
          <View style={styles.renameContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter new room name"
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholderTextColor="#7e57c2"
            />
            <TouchableOpacity style={styles.renameButton} onPress={() => renameRoom(item.id)}>
              <Text style={styles.renameButtonText}>Rename</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Display a message if the user is not a member of any active room
  if (rooms.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noRoomsText}>You are not currently a member of any active rooms.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
      />
    </View>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#7e57c2',
  },
  noRoomsText: {
    fontSize: 16,
    color: '#333',
  },
  roomContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7e57c2',
  },
  memberTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#7e57c2',
  },
  memberText: {
    fontSize: 14,
    color: '#333',
  },
  renameContainer: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    color: '#000',
  },
  renameButton: {
    backgroundColor: '#7e57c2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  renameButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ActiveRooms;
