import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import TrackPlayer, { usePlaybackState, useProgress, Event, State } from 'react-native-track-player';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { setupPlayer, addTracks } from './trackPlayerServices';
import Slider from '@react-native-community/slider';

// Main Music Player Component
function NormalMusicPlayerComponent() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playbackState = usePlaybackState();

  useEffect(() => {
    async function setup() {
      await setupPlayer();
      await addTracks();
      setIsPlayerReady(true);
    }

    setup();

    return () => {
      TrackPlayer.reset();
    };
  }, []);

  if (!isPlayerReady) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#bbb" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TrackInfo />
      <Playlist />
      <Controls playbackState={playbackState} />
      <TrackProgress />
    </SafeAreaView>
  );
}

// Track Info Component
function TrackInfo() {
  const [trackInfo, setTrackInfo] = useState({});

  useEffect(() => {
    async function loadTrackInfo() {
      const trackId = await TrackPlayer.getCurrentTrack();
      if (trackId !== null) {
        const track = await TrackPlayer.getTrack(trackId);
        setTrackInfo(track);
      }
    }
    loadTrackInfo();

    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, loadTrackInfo);
  }, []);

  return (
    <View style={styles.trackInfo}>
      <Text style={styles.title}>{trackInfo?.title}</Text>
      <Text style={styles.artist}>{trackInfo?.artist}</Text>
    </View>
  );
}

// Playlist Component
function Playlist() {
  const [queue, setQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    async function loadQueue() {
      const tracks = await TrackPlayer.getQueue();
      setQueue(tracks);
    }
    loadQueue();

    TrackPlayer.addEventListener(Event.PlaybackTrackChanged, async () => {
      const trackId = await TrackPlayer.getCurrentTrack();
      setCurrentTrack(trackId);
    });
  }, []);

  return (
    <FlatList
      data={queue}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TouchableOpacity onPress={() => TrackPlayer.skip(index)}>
          <Text style={{ ...styles.playlistItem, backgroundColor: currentTrack === index ? '#666' : 'transparent' }}>
            {item.title}
          </Text>
        </TouchableOpacity>
      )}
    style={styles.songs}/>
  );
}

// Controls Component
function Controls({ playbackState }) {
    const [isPlaying, setIsPlaying] = useState(false);
  
    const togglePlayPause = async () => {
      const currentState = await TrackPlayer.getState(); // Fetch current state
  
      if (currentState === State.Playing) {
        await TrackPlayer.pause();
        setIsPlaying(false)
      } else {
        await TrackPlayer.play();
        setIsPlaying(true)
      }
    };

  return (
    <View style={styles.controls}>
        <TouchableOpacity onPress={() => TrackPlayer.skipToPrevious()} style={styles.controlButton}>
        <MaterialIcons name="skip-previous" size={40} color="#ffffff" />
      </TouchableOpacity>

      {/* Play/Pause Button */}
      <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
        <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={40} color="#ffffff" />
      </TouchableOpacity>

      {/* Next Button */}
      <TouchableOpacity onPress={() => TrackPlayer.skipToNext()} style={styles.controlButton}>
        <MaterialIcons name="skip-next" size={40} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

// TrackProgress Component
function TrackProgress() {
  const { position, duration } = useProgress();

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  return (
    <View style={styles.progressContainer}>
      {/* Slider for the track progress */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        minimumTrackTintColor="#7e57c2"  // Purple color for progress
        maximumTrackTintColor="#bbb"      // Light gray for the remaining progress
        thumbTintColor="#7e57c2"          // Purple color for the thumb
        onValueChange={(value) => TrackPlayer.seekTo(value)} // Handle the sliding interaction
      />

      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>{formatTime(position)}</Text>
        <Text style={styles.progressText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
    songs:{
        borderWidth:2,
        borderColor:'#7e57c2',
        borderRadius:10
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#121212', // Dark background for contrast
    },
    trackInfo: {
      alignItems: 'center',
      marginBottom: 30,
      backgroundColor: '#1e1e1e', // Darker container for track info
      padding: 20,
      borderRadius: 10,
      elevation: 3, // Slight shadow effect
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#9661f2', // Purple title for track name
    },
    artist: {
      fontSize: 18,
      color: '#bbb', // Light gray for artist name
      marginTop: 5,
    },
    playlistItem: {
      fontSize: 16,
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginVertical: 5,
      borderRadius: 8,
      backgroundColor: '#2c2c2c', // Dark background for playlist items
      color: '#ffffff',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-around', // Spread the control buttons evenly
      marginTop: 30,
      paddingHorizontal: 30,
    },
    controlButton:{
        backgroundColor:'#7e57c2',
        borderRadius:25,
        height:50,
        width:50,
        alignItems:'center',
        justifyContent:'center'
    },
    progress: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 30,
      paddingHorizontal: 20,
      backgroundColor: '#1e1e1e', // Same as track info for consistency
      borderRadius: 8,
      paddingVertical: 10,
    },
    progressText: {
      color: '#fffff', // Progress time color
      fontSize: 14,
    },

    progressContainer: {
        marginTop: 30,
        paddingHorizontal: 20,
      },
      slider: {
        width: '100%',
        height: 10, // Increase height to make the slider larger
        transform: [{ scaleX: 1.0 }, { scaleY: 1 }]
      },
      progressTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      progressText: {
        color: '#bbb', // Progress time color
        fontSize: 14,
      },
  });
  

export default NormalMusicPlayerComponent;