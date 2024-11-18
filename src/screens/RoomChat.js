import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, TextInput, Text, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import moment from 'moment'; // For formatting timestamps

const RoomChat = ({ roomCode }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const user = auth().currentUser;

  const flatListRef = useRef(null); // Ref for the FlatList

  const messagesRef = firestore().collection('rooms').doc(roomCode).collection('messages');

  // Fetch messages in real-time
  useEffect(() => {
    const unsubscribe = messagesRef.orderBy('createdAt', 'asc').onSnapshot(snapshot => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);

      // Scroll to the last message when the messages are updated
      if (flatListRef.current && messagesData.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Function to send a new message
  const sendMessage = async () => {
    if (newMessage.trim().length > 0) {
      await messagesRef.add({
        text: newMessage,
        createdAt: firestore.FieldValue.serverTimestamp(),
        user: {
          uid: user.uid,
          email: user.email,
        },
      });
      setNewMessage(''); // Clear the input field
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef} // Attach the ref to FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const messageTime = item.createdAt ? moment(item.createdAt.toDate()).format('h:mm A') : '';
          return (
            <View
              style={[
                styles.message,
                item.user.uid === user.uid ? styles.myMessage : styles.otherMessage,
              ]}
            >
              <Text style={styles.sender}>
                {item.user.email === user.email ? 'Me' : item.user.email}
              </Text>
              <Text style={styles.text}>{item.text}</Text>
              <Text style={styles.time}>{messageTime}</Text>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })} // Scroll to bottom when new content is added
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#7e57c2"
        />
        <TouchableOpacity style={styles.send} onPress={sendMessage}>
          <Icon name="send" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  text: {
    color: '#ffffff', // Message text color
    fontSize: 15,
  },
  time: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  message: {
    marginVertical: 0,
    padding: 10,
    borderRadius: 30,
    maxWidth: '75%', // Limit the width of messages
    position: 'relative',
  },
  myMessage: {
    alignSelf: 'flex-end', // Align to the right
    backgroundColor: '#7e57c2', // Purple background for my messages
  },
  otherMessage: {
    alignSelf: 'flex-start', // Align to the left
    backgroundColor: '#a990d6', // Light gray background for other users' messages
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff', // Keep sender's name black for both sent and received messages
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderColor:'#7e57c2',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    padding: 10,
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    color: '#000000',
    fontWeight:'bold'
  },
  send: {
    backgroundColor: '#7e57c2', // Purple color
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RoomChat;
