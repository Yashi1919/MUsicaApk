import TrackPlayer, { Capability, RepeatMode, Event } from 'react-native-track-player';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';

// Request permission to access storage on Android
async function requestStoragePermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message: 'This app needs access to your storage to play local music files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Storage permission error', err);
      return false;
    }
  }
  return true;
}

// Set up the Track Player
export async function setupPlayer() {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      console.warn('Storage permission denied');
      return;
    }

    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
      ],
    });

    console.log('Player setup complete');
  } catch (error) {
    console.log('Error setting up player', error);
  }
}



// Fetch local MP3 files from various directories
async function fetchLocalMP3Files() {
  try {
    // Try different directories in case MusicDirectoryPath is unavailable
    const directories = [
      RNFS.MusicDirectoryPath, // Common music directory
      RNFS.DownloadDirectoryPath, // Downloads directory
      RNFS.ExternalStorageDirectoryPath, // External storage directory
    ];

    for (const dir of directories) {
      if (dir) {
        console.log('Looking for files in:', dir);
        const files = await RNFS.readDir(dir);
        const mp3Files = files.filter((file) => file.name && file.name.endsWith('.mp3'));

        if (mp3Files.length > 0) {
          // Return the tracks mapped to TrackPlayer format
          return mp3Files.map((file, index) => ({
            id: index.toString(),
            url: `file://${file.path}`,
            title: file.name.replace('.mp3', ''),
            artist: 'Local Artist',
          }));
        }
      }
    }
    
    console.warn('No MP3 files found in any directory');
    return [];
  } catch (error) {
    console.error('Error fetching local MP3 files:', error);
    return [];
  }
}

// Add tracks to the player from the local files
export async function addTracks() {
  try {
    const localTracks = await fetchLocalMP3Files();
    if (localTracks.length > 0) {
      await TrackPlayer.add(localTracks);
      await TrackPlayer.setRepeatMode(RepeatMode.Queue);
      console.log('Tracks added to player:', localTracks);
    } else {
      console.warn('No MP3 files to add');
    }
  } catch (error) {
    console.error('Error adding tracks:', error);
  }
}

// Handle remote controls and playback events
export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
}
