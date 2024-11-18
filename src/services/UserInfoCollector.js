import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
const userId=auth().currentUser;

const UserInfoCollector = ({ route }) => {
 
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    // Fetch user data when the component mounts
    const fetchUserData = async () => {
      try {
        const userDoc = await firestore().collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData.username && userData.gender) {
            // If username and gender exist, navigate to MainScreen
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainScreen', params: { userId } }],
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId, navigation]);

  const checkUsernameUnique = async () => {
    const snapshot = await firestore()
      .collection('users')
      .where('username', '==', username)
      .get();
    return snapshot.empty;
  };

  const handlePhotoUpload = async () => {
    const options = {
      mediaType: 'photo',
    };
    
    const result = await launchImageLibrary(options);

    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.errorCode) {
      console.log('ImagePicker Error: ', result.errorMessage);
    } else {
      setPhoto(result.assets[0]);
    }
  };

  const handleSaveUser = async () => {
    if (!username) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }

    if (!gender) {
      Alert.alert('Validation Error', 'Please select your gender');
      return;
    }

    setLoading(true);

    // Check if the username is unique across all users
    const isUnique = await checkUsernameUnique();
    if (!isUnique) {
      Alert.alert('Validation Error', 'Username is already taken. Please choose another one.');
      setLoading(false);
      return;
    }

    // Upload the photo to Firebase Storage if a photo is selected
    let photoURL = '';
    if (photo) {
      const photoRef = storage().ref(`/profilePictures/${userId}`);
      await photoRef.putFile(photo.uri);
      photoURL = await photoRef.getDownloadURL();
    }

    // Save user information in Firestore under the users collection
    await firestore().collection('users').doc(userId).set({
      username,
      gender,
      photoURL,
      currentRoom: '', // Set an initial value or update it as needed
    });

    Alert.alert('Success', 'User information saved successfully!');
    setLoading(false);

    // Redirect to MainScreen after saving user information
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainScreen', params: { userId } }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Information</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a unique username"
        placeholderTextColor={'#7e57c2'}
        value={username}
        onChangeText={setUsername}
      />
      <Text style={styles.label}>Select Gender:</Text>
      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
          onPress={() => setGender('male')}
        >
          <Text style={styles.genderButtonText}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
          onPress={() => setGender('female')}
        >
          <Text style={styles.genderButtonText}>Female</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, gender === 'other' && styles.genderButtonSelected]}
          onPress={() => setGender('other')}
        >
          <Text style={styles.genderButtonText}>Other</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoUpload}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.image} />
        ) : (
          <Icon name="account-box" size={100} color="#7e57c2" />
        )}
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveUser} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save User Info'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    color:'#7e57c2'
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#7e57c2',
  },
  genderButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  photoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    width: 150,
    height: 150,
    alignSelf: 'center',
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  button: {
    backgroundColor: '#7e57c2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
});

export default UserInfoCollector;
