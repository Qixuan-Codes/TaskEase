import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { ref, onValue, remove, update } from 'firebase/database';
import { auth, database } from '../firebaseConfig';
import { signOut, deleteUser, updatePassword, updateProfile } from 'firebase/auth';
import { usePoints } from '../context/PointsContext';

const ProfilePage = ({ navigation }) => {
  const { theme, setTheme } = useTheme();
  const { points, challengeProgress, streak } = usePoints();
  const [userData, setUserData] = useState({ name: '', email: '' });
  const [user, setUser] = useState(auth.currentUser);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState(userData.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  useEffect(() => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserData({ name: data.name || '', email: data.email || user.email });
          setNewName(data.name || '');
          setTheme(data.theme || 'light');
        }
      });
    }
  }, [user, setTheme]);

  // Toggle the theme from light to dark vise versa
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      update(userRef, { theme: newTheme });
    }
  };

  // Handles the logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };

  // Handles deleting the account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDeleteAccount }
      ]
    );
  };

  // Confirmation of deletion of account
  const confirmDeleteAccount = async () => {
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const tasksRef = ref(database, `tasks/${user.uid}`);
      const leaderboardRef = ref(database, `leaderboard/${user.uid}`);

      await remove(userRef);
      await remove(tasksRef);
      await remove(leaderboardRef);
      await deleteUser(user);
      setUser(null);
    } catch (error) {
      console.error("Error deleting account: ", error);
    }
  };

  // Handles profile updates
  const handleSaveChanges = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      if (newName !== userData.name) {
        await updateProfile(user, { displayName: newName });
        update(ref(database, `users/${user.uid}`), { name: newName });
      }

      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      Alert.alert('Profile Updated', 'Your profile has been updated successfully.');
      setIsModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Show the dailly challenge progress in a progress bar
  const renderProgressBar = () => {
    const progressPercentage = (challengeProgress / 3) * 100;

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFiller, { width: `${progressPercentage}%` }]} />
        </View>
        <Text style={[styles.progressText, { color: currentTheme.textColor }]}>
          Progress: {challengeProgress} / 3 tasks
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>

      {/* Profile Card */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Profile Information</Text>
        <View style={[
          styles.card,
          { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }
        ]}>
          <Text style={[styles.cardItem, { color: currentTheme.textColor }]}>Name: {userData.name}</Text>
          <Text style={[styles.cardItem, { color: currentTheme.textColor }]}>Email: {userData.email}</Text>
          <Text style={[styles.cardItem, { color: currentTheme.textColor }]}>Login Streak: {streak} days</Text>
          <Text style={[styles.cardItem, { color: currentTheme.textColor }]}>Points: {points}</Text>
        </View>
      </View>

      {/* Daily Challenge */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Daily Challenge (50 Points)</Text>
        {renderProgressBar()}
      </View>

      {/* Buttons */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>Settings</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleTheme} style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Toggle Theme</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>View Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Notification')} style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Notification</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 'auto' }}>
        <TouchableOpacity onPress={handleDeleteAccount} style={[styles.button, styles.deleteButton]}>
          <Text style={[styles.deleteButtonText]}>Delete Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}>
          <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.textColor }]}>Edit Profile</Text>
            <TextInput
              style={[
                styles.input,
                { color: currentTheme.textColor, backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.textColor }
              ]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Name"
              placeholderTextColor={theme === 'dark' ? 'lightgray' : 'gray'}
            />
            <TextInput
              style={[
                styles.input,
                { color: currentTheme.textColor, backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.textColor }
              ]}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="New Password"
              placeholderTextColor={theme === 'dark' ? 'lightgray' : 'gray'}
              secureTextEntry
            />
            <TextInput
              style={[
                styles.input,
                { color: currentTheme.textColor, backgroundColor: currentTheme.backgroundColor, borderColor: currentTheme.textColor }
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor={theme === 'dark' ? 'lightgray' : 'gray'}
              secureTextEntry
            />

            <TouchableOpacity onPress={handleSaveChanges} style={[styles.modalButton, { backgroundColor: currentTheme.buttonColor }]}>
              <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={[styles.modalButton, { backgroundColor: currentTheme.buttonColor }]}>
              <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 5,
    width: '100%',
  },
  progressBarContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 20,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFiller: {
    height: '100%',
    backgroundColor: '#76c7c0',
  },
  progressText: {
    marginTop: 5,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: 'red',
  },
});

export default ProfilePage;
