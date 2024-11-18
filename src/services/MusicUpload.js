import React, { useState, useEffect } from 'react';
import { View, Button, Text, Alert, ActivityIndicator, FlatList, Platform, PermissionsAndroid, StyleSheet, TouchableOpacity } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient'; 

const MusicUpload = ({ roomCode }) => {
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Fetch uploaded music files from Firestore
  const fetchUploadedFiles = async () => {
    try {
      const roomDoc = await firestore().collection('rooms').doc(roomCode).get();
      const roomData = roomDoc.data();
      if (roomData && roomData.musicFiles) {
        setUploadedFiles(roomData.musicFiles);
      }
    } catch (error) {
      console.error('Error fetching uploaded files: ', error);
    }
  };

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Request both READ and WRITE permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
  
        if (
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('You have access to read and write files');
          // Proceed with your file upload functionality
        } else {
          console.log('Permission denied');
          //Alert.alert('Permission Denied', 'Storage access is needed to upload music files.');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };
  const uploadMusicFile = async () => {
    const hasPermission = await requestStoragePermission();
    if (hasPermission) {
     Alert.alert('Permission Denied', 'Storage permission is required to upload music files.');
      return;
    }

    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
      });

      const { uri, name, size } = res[0];
      setFileName(name);

      const maxFileSize = 100 * 1024 * 1024;
      if (size > maxFileSize) {
        throw new Error('File size exceeds the 100MB limit.');
      }

      const destPath = `${RNFS.TemporaryDirectoryPath}/${name}`;
      await RNFS.copyFile(uri, destPath);

      const fileExistsLocally = await RNFS.exists(destPath);
      if (!fileExistsLocally) {
        throw new Error('File not found locally. Cannot upload.');
      }

      const uniqueName = `${Date.now()}-${name}`;
      const fileRef = storage().ref(`rooms/${roomCode}/${uniqueName}`);

      setUploading(true);

      const task = fileRef.putFile(destPath);

      task.on('state_changed', (snapshot) => {
        const progressPercentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progressPercentage);
      });

      await task;

      const downloadURL = await fileRef.getDownloadURL();

      await firestore().collection('rooms').doc(roomCode).update({
        musicFiles: firestore.FieldValue.arrayUnion({
          fileName: uniqueName,
          downloadURL,
          uploadedBy: auth().currentUser.email,
        }),
      });

      fetchUploadedFiles();

      Alert.alert('Success', 'Music file uploaded and saved to Firestore.');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled the picker');
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Function to handle file deletion
  const deleteFile = async (file) => {
    try {
      // Construct the correct storage reference using the roomCode and fileName
      const fileRef = storage().ref(`rooms/${roomCode}/${file.fileName}`);
  
      // Delete the file from Firebase Storage
      await fileRef.delete();
  
      // Remove file info from Firestore
      await firestore().collection('rooms').doc(roomCode).update({
        musicFiles: firestore.FieldValue.arrayRemove(file),
      });
  
      fetchUploadedFiles();  // Refresh the list after deletion
      Alert.alert('Deleted', 'The music file has been deleted.');
    } catch (error) {
      console.error('Error deleting file: ', error);
      Alert.alert('Error', 'Failed to delete the music file.');
    }
  };
  

  // Function to confirm file deletion
  const confirmDeleteFile = (file) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete the file "${file.fileName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deleteFile(file), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  // Render uploaded files with long press for delete
  const renderUploadedFile = ({ item }) => (
    <TouchableOpacity onLongPress={() => confirmDeleteFile(item)} style={styles.fileContainer}>
      <Text style={styles.fileText}>{item.fileName} (Uploaded by: {item.uploadedBy})</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7e57c2', '#b39ddb']} style={styles.gradient}>
      <TouchableOpacity onPress={uploadMusicFile} disabled={uploading}>
        <Text style={styles.text}>Upload Music Files</Text>
      </TouchableOpacity>
      </LinearGradient>
      {uploading && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Uploading: {progress.toFixed(2)}%</Text>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      )}
      {fileName ? <Text style={styles.fileNameText}>Selected file: {fileName}</Text> : null}

      {/* Display the uploaded files */}
      <Text style={styles.uploadedFilesTitle}>Uploaded Music Files:</Text>
      {uploadedFiles.length > 0 ? (
        <FlatList
          data={uploadedFiles}
          keyExtractor={(item) => item.fileName}
          renderItem={renderUploadedFile}
        />
      ) : (
        <Text style={styles.noFilesText}>No music files uploaded yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#fff',
    flex: 1,
  },
  progressContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#6200EE',
  },
  fileNameText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
    fontWeight:'bold'
  },
  text:{
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadedFilesTitle: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 18,
    color: '#000',
    fontWeight:'bold'
  },
  noFilesText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777',
  },
  gradient: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileContainer: {
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  fileText: {
    fontSize: 16,
    color: '#333',
  },
});

export default MusicUpload;
