import React, { useState, useEffect } from 'react';
import { View, Text, Alert, FlatList, Button, TouchableOpacity, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import MusicUpload from '../services/MusicUpload';
import MusicPlayer from '../services/MusicPlayer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RoomChat from './RoomChat';
import MemberList from './MembersList';
// Member List component


// Main RoomScreen component
const RoomScreen = ({ route, navigation }) => {
  const { roomCode } = route.params;
  const [members, setMembers] = useState([]);
  const [leader, setLeader] = useState(null);
  const [previousLeader, setPreviousLeader] = useState(null); // Track previous leader
  const [isLeader, setIsLeader] = useState(false);
  const [musicFiles, setMusicFiles] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const user = auth().currentUser;

  // Function to fetch room details when component loads or reloads
  const fetchRoomDetails = () => {
    const roomRef = firestore().collection('rooms').doc(roomCode);

    // Fetch room details
    const unsubscribe = roomRef.onSnapshot(async (docSnapshot) => {
      const roomData = docSnapshot.data();
      if (roomData) {
        setMembers(roomData.members); // Set the members in state
        setLeader(roomData.leader); // Set the leader
        setIsLeader(roomData.leader?.uid === user.uid); // Check if the current user is the leader
        setMusicFiles(roomData.musicFiles || []);
        setCurrentlyPlaying(roomData.currentlyPlaying || null);
        setIsPlaying(roomData.isPlaying || false);

        // If there are no members left, delete the room
        if (roomData.members.length === 0) {
          await deleteRoom();
        }
      }
    });

    return () => unsubscribe(); // Unsubscribe when the component unmounts
  };

  // Function to delete the room when there are zero members
  const deleteRoom = async () => {
    try {
      const roomRef = firestore().collection('rooms').doc(roomCode);
      await roomRef.delete();
      Alert.alert('Room Deleted', 'The room has been deleted because there are no members left.');
      navigation.navigate('MainScreen'); // Navigate back to the main screen
    } catch (error) {
      Alert.alert('Error', 'Failed to delete the room.');
    }
  };

  // UseEffect to fetch room details on component mount or reload
  useEffect(() => {
    fetchRoomDetails();
  }, [roomCode]);

  // Effect to detect leader changes and redirect to the Music Player tab
  useEffect(() => {
    if (leader && previousLeader && leader.uid !== previousLeader.uid) {
      console.log("Leader has changed. Redirecting to Music Player.");
      navigation.navigate('Music Player');
    }
    setPreviousLeader(leader); // Update the previous leader
  }, [leader, previousLeader, navigation]);

  // Transfer leadership function
  const transferLeadership = async (newLeader) => {
    if (isLeader) {
      try {
        const roomRef = firestore().collection('rooms').doc(roomCode);
        await roomRef.update({ leader: newLeader });
        Alert.alert('Leadership Transferred', `Leadership transferred to ${newLeader.email}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to transfer leadership.');
      }
    }
  };

  const leaveRoom = async () => {
    try {
      console.log('Attempting to leave the room...');
      const roomRef = firestore().collection('rooms').doc(roomCode);
  
      // Fetch the latest room data directly from Firestore
      const roomSnapshot = await roomRef.get();
      const roomData = roomSnapshot.data();
  
      if (roomData) {
        console.log('Room data fetched:', roomData);
        const updatedMembers = roomData.members.filter((member) => member.uid !== user.uid);
        console.log('Updated members after removing current user:', updatedMembers);
  
        // If the current user is the leader and there are other members, transfer leadership
        if (isLeader && updatedMembers.length > 0) {
          const nextMember = updatedMembers[0]; // Select the next member as the new leader
          console.log(`Transferring leadership to: ${nextMember.email} (UID: ${nextMember.uid})`);
          await roomRef.update({
            leader: {
              uid: nextMember.uid,
              email: nextMember.email,
            },
          });
          console.log('Leadership transferred successfully.');
        }
  
        // Update the members list in Firestore
        console.log(`Removing current user: ${user.email} (UID: ${user.uid})`);
        await roomRef.update({
          members: firestore.FieldValue.arrayRemove({
            uid: user.uid,
            email: user.email,
          }),
        });
        console.log('User removed from room members list.');
  
        // If the current user was the last member, delete the room
        if (updatedMembers.length === 0) {
          console.log('No members left in the room. Deleting room...');
          await deleteRoom();
        } else {
          console.log('Navigating back to the main screen.');
          navigation.navigate('MainScreen');
        }
      } else {
        console.error('Room data not found or room already deleted.');
      }
    } catch (error) {
      console.error('Error leaving the room:', error.message);
      Alert.alert('Error', error.message);
    }
  };
  

  const Tab = createBottomTabNavigator();

  return (
    <View style={styles.container}>
      {/* Display the room code at the top */}
      <View style={styles.roomCodeContainer}>
        <Text style={styles.roomCodeText}>Room Code: {roomCode}</Text>
      </View>

      <Tab.Navigator
      
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;

      if (route.name === 'Members') {
        iconName = 'people';
      } else if (route.name === 'Music Upload') {
        iconName = 'cloud-upload';
      } else if (route.name === 'Music Player') {
        iconName = 'musical-notes';
      } else if (route.name === 'Room Chat') {
        iconName = 'chat'; // You can use 'chat' or 'message'
      }

      return <Icon name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: '#7e57c2', // Set active tab color
    tabBarInactiveTintColor: 'black',  // Set inactive tab color
    tabBarShowLabel: false,           // Disable tab labels
    
    headerRight: () => (

      <TouchableOpacity onPress={leaveRoom} style={styles.leave}>
<Icon name="logout" size={20} color='#7e57c2'/>
      </TouchableOpacity>
    ),
    headerLeft: false,                // Disable the left header
  })}
>
  
        <Tab.Screen
          name="Members"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="people" color={color} size={size} />
            ),
          }}
        >
          {() => (
            <MemberList
              members={members}
              leader={leader}
              isLeader={isLeader}
              transferLeadership={transferLeadership}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Music Upload"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="cloud-upload" color={color} size={size} />
            ),
          }}
        >
          {() => <MusicUpload roomCode={roomCode} />}
        </Tab.Screen>

        <Tab.Screen
          name="Music Player"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="audiotrack" color={color} size={size} />
            ),
          }}
        >
          {() => (
            <MusicPlayer
              roomCode={roomCode}
              musicFiles={musicFiles}
              currentlyPlaying={currentlyPlaying}
              isPlaying={isPlaying}
              isLeader={isLeader}
              onComplete={() => setIsPlaying(false)}
            />
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Room Chat"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Icon name="messenger" color={color} size={size} />
            ),
          }}
        >
          {() => <RoomChat roomCode={roomCode} 
          
          />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
};

// Styling for the components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  roomCodeContainer: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  roomCodeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: "#7e57c2",
  },
  membersContainer: {
    padding: 20,
  },
  membersTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#7e57c2',
  },
  memberItem: {
    marginVertical: 10,
  },
  memberText: {
    fontSize: 16,
    color: '#333333',
  },
  leave:{
    paddingRight:20
  }
});

export default RoomScreen;

