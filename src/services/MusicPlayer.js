import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Alert, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Sound from 'react-native-sound';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const MusicPlayer = ({ roomCode }) => {
  const [sound, setSound] = useState(null);
  const [isPaused, setIsPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [musicFiles, setMusicFiles] = useState([]);
  const [isLeader, setIsLeader] = useState(false);
  const currentUser = auth().currentUser;
  const isLoadingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const roomRef = firestore().collection('rooms').doc(roomCode);

  useEffect(() => {
    setIsPaused(true);
    setPosition(0);
    setSliderValue(0);
    setIsPlaying(false)
    syncMusicState(0, true, false, 0, currentSongIndex);
  }, []);

  useEffect(() => {
    const unsubscribe = roomRef.onSnapshot((roomDoc) => {
      if (roomDoc.exists) {
        const roomData = roomDoc.data();
        setMusicFiles(roomData.musicFiles || []);
        const newLeaderId = roomData.leader?.uid || null;

        setIsLeader(currentUser?.uid === newLeaderId);

        // Update state based on Firestore data
        if (roomData.currentlyPlaying) {
          setIsPaused(roomData.currentlyPlaying.isPaused);
          setCurrentSongIndex(roomData.currentlyPlaying.currentSongIndex || 0);
          setPosition(roomData.currentlyPlaying.currentPosition || 0);
          setSliderValue(roomData.currentlyPlaying.currentPosition || 0);

          // Synchronize playback for members
          if (!isLeader && sound) {
            if (!roomData.currentlyPlaying.isPaused) {
              sound.setCurrentTime(roomData.currentlyPlaying.currentPosition);
              sound.play(playbackComplete);
            } else {
              sound.pause();
              sound.setCurrentTime(roomData.currentlyPlaying.currentPosition);
            }
          }
        }
      } else {
        Alert.alert('Error', 'Room not found');
      }
    });

    return () => unsubscribe();
  }, [roomCode, currentUser, sound]);

  const syncMusicState = async (newPosition, newIsPaused, newIsPlaying, newSliderValue, newSongIndex = currentSongIndex) => {
    if (isLeader) {
      await roomRef.update({
        'currentlyPlaying.currentPosition': newPosition,
        'currentlyPlaying.isPaused': newIsPaused,
        'currentlyPlaying.isPlaying': newIsPlaying,
        'currentlyPlaying.currentSongIndex': newSongIndex,
        'currentlyPlaying.sliderValue': newSliderValue,
      });
    }
  };

  const releaseSound = () => {
    if (sound) {
      sound.stop(() => {
        sound.release();
        setSound(null);
      });
    }
  };

  const loadSong = (url, startTime = 0) => {
    if (isLoadingRef.current) {
      console.log('Song is already loading, skipping...');
      return;
    }

    isLoadingRef.current = true;
    releaseSound();

    const newSound = new Sound(url, null, (error) => {
      if (error) {
        Alert.alert('Error', `Failed to load the music file. Error: ${error.message}`);
        console.log('Sound load error:', error);
        isLoadingRef.current = false;
        return;
      }

      setSound(newSound);
      setDuration(newSound.getDuration());
      setSliderValue(startTime);
      setPosition(startTime);
      isLoadingRef.current = false;

      if (!isPaused) {
        newSound.setCurrentTime(startTime);
        newSound.play(playbackComplete);
      }
    });
  };

  useEffect(() => {
    if (musicFiles.length > 0 && musicFiles[currentSongIndex]) {
      const currentSong = musicFiles[currentSongIndex];
      loadSong(currentSong.downloadURL, 0);
    }
  }, [currentSongIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sound && !isPaused) {
        sound.getCurrentTime((seconds) => {
          setPosition(seconds);
          setSliderValue(seconds);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sound, isPaused]);

  const playbackComplete = (success) => {
    if (success) {
      handleNextSong();
    } else {
      Alert.alert('Error', 'Playback failed.');
    }
  };

  const togglePlayPause = async () => {
    if (sound) {
      if (isPaused) {
        sound.setCurrentTime(sliderValue);
        sound.play(playbackComplete);
        await syncMusicState(sliderValue, false, true, sliderValue);
        setIsPaused(false);
      } else {
        sound.pause();
        sound.getCurrentTime(async (seconds) => {
          await syncMusicState(seconds, true, false, sliderValue);
          setPosition(seconds);
        });
        setIsPaused(true);
      }
    }
  };

  const handleNextSong = async () => {
    if (isLeader && currentSongIndex < musicFiles.length - 1) {
      const newIndex = currentSongIndex + 1;
      setCurrentSongIndex(newIndex);
      setPosition(0);
      setSliderValue(0);
      await syncMusicState(0, false, true, 0, newIndex);
    }
  };

  const handlePreviousSong = async () => {
    if (isLeader && currentSongIndex > 0) {
      const newIndex = currentSongIndex - 1;
      setCurrentSongIndex(newIndex);
      setPosition(0);
      setSliderValue(0);
      await syncMusicState(0, false, true, 0, newIndex);
    }
  };

  const handleSeek = async (value) => {
    if (sound) {
      sound.setCurrentTime(value);
      setPosition(value);
      setSliderValue(value);
      if (isLeader) {
        await syncMusicState(value, isPaused, true, value);
      }
    }
  };

  const handleSongSelection = async (index) => {
    if (isLeader && index !== currentSongIndex) {
      setCurrentSongIndex(index);
      setPosition(0);
      setSliderValue(0);
      await syncMusicState(0, false, true, 0, index);
    }
  };

  return (
    <View style={styles.container}>
      {musicFiles.length > 0 && (
        <View style={styles.songDetails}>
        
          <Text style={styles.songName}>{musicFiles[currentSongIndex]?.fileName}</Text>
          <Text style={styles.artistName}>Uploaded by: {musicFiles[currentSongIndex]?.uploadedBy}</Text>
        </View>
      )}

      {sound && (
        <Slider
          style={styles.slider}
          value={sliderValue}
          minimumValue={0}
          maximumValue={duration}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#000000"
          onValueChange={handleSeek}
          disabled={!isLeader}
        />
      )}

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>
          {Math.floor(position / 60)}:{Math.floor(position % 60).toString().padStart(2, '0')}
        </Text>
        <Text style={styles.timeText}>
          {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePreviousSong} disabled={!isLeader} style={styles.gradient}>
          <Icon name="skip-previous" size={40} color={isLeader ? '#ffffff' : '#ffffff'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause} disabled={!isLeader} style={styles.gradient}>
          <Icon name={isPaused ? 'play-arrow' : 'pause'} size={40} color={isLeader ? '#ffffff' : '#ffffff'} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNextSong} disabled={!isLeader} style={styles.gradient}>
          <Icon name="skip-next" size={40} color={isLeader ? '#ffffff' : '#ffffff'} />
        </TouchableOpacity>
      </View>
      <LinearGradient colors={['#7e57c2', '#b39ddb']} style={styles.gradient1}>
      <FlatList
        data={musicFiles}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleSongSelection(index)} disabled={!isLeader}>
            <Text style={currentSongIndex === index ? styles.selectedSong : styles.songItem}>
              {item.fileName}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.fileName}
        style={styles.songList}
      />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
  },
  songDetails: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: '#d1c4e9',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  songName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7e57c2',
  },
  artistName: {
    fontSize: 16,
    color: '#6a1b9a',
    marginTop: 5,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 20,
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: -10,
    paddingHorizontal: 10,
  },
  timeText: {
    fontSize: 12,
    color: '#6a1b9a',
  },
  gradient:{
    backgroundColor:'#7e57c2',
    height:50,
    width:50,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:30
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  songList: {
    marginTop: 20,
    width: '100%',
    color:'#ffffff'
  },
  songItem: {
    padding: 10,
    fontSize: 16,
    color: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontWeight:'bold'
  },
  selectedSong: {
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  gradient1: {
    flex:1,
    borderRadius:15
  },
});

export default MusicPlayer;
