import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import firestore from '@react-native-firebase/firestore';

const PlaybackListener = ({ roomCode }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('rooms')
      .doc(roomCode)
      .onSnapshot(docSnapshot => {
        const roomData = docSnapshot.data();
        setCurrentSong(roomData.currentSong);
        setIsPlaying(roomData.isPlaying);
      });

    return () => unsubscribe();
  }, [roomCode]);

  return (
    <View>
      {isPlaying ? (
        <Text>Now playing: {currentSong}</Text>
      ) : (
        <Text>No music is currently playing</Text>
      )}
    </View>
  );
};

export default PlaybackListener;
