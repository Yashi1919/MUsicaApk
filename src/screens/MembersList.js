import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const MemberListComponent = ({ members, leader, isLeader, transferLeadership }) => {
  const [refresh, setRefresh] = useState(false);

  // Use useFocusEffect to trigger a re-render when the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Toggle the state to force a re-render
      setRefresh((prev) => !prev);
    }, [])
  );

  return (
    <View style={styles.membersContainer}>
      <Text style={styles.membersTitle}>Members in this room:</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.uid}
        extraData={refresh} // Use the refresh state to ensure re-render
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => {
              if (isLeader && item.uid !== leader.uid) {
                Alert.alert(
                  "Transfer Leadership",
                  `Are you sure you want to transfer leadership to ${item.email}?`,
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "OK",
                      onPress: () => transferLeadership(item),
                    },
                  ]
                );
              }
            }}
          >
            <View style={styles.memberItem}>
              <Text style={styles.memberText}>
                {item.email} {leader && leader.uid === item.uid ? '(Leader)' : ''}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

// Styles for the MemberListComponent
const styles = StyleSheet.create({
  membersContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#7e57c2',
  },
  memberItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  memberText: {
    fontSize: 16,
    color: '#000000',
    fontWeight:'bold'
  },
  controlButton: {
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    textAlign: 'center',
    backgroundColor: '#7e57c2',
    color: '#ffffff',
    borderRadius: 5,
    marginVertical: 5,
  },
});

export default MemberListComponent;


