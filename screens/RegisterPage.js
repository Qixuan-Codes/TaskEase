import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, update } from 'firebase/database'; // Import necessary Firebase database functions
import { auth, database } from '../firebaseConfig'; // Import your Firebase config

const RegisterPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Add a state for the confirm password
  const [name, setName] = useState(''); // Add a state for the user's name
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Basic validation for password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Creates the user in firebase authentication services
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user details to the Realtime Database
      await set(ref(database, 'users/' + user.uid), {
        name: name,
        email: user.email,
        theme: "light",
        points: 0,
        tasksCompleted: 0,
        lastLoginDate: null,
      });

      // Log the user in to trigger the daily login points logic
      const today = new Date().toISOString().split('T')[0];
      const initialPoints = 10; // Assuming 10 points are awarded on login
      await update(ref(database, 'users/' + user.uid), {
        points: initialPoints,
        lastLoginDate: today,
      });

      // Update the leaderboard immediately after points are assigned
      await set(ref(database, 'leaderboard/' + user.uid), {
        name: name,
        points: initialPoints,
      });

      navigation.navigate('TasksListPage');
    } catch (err) {
      handleFirebaseError(err);
    }
  };

  // Handles the firebase errors
  const handleFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        setError('The email address is already in use by another account.');
        break;
      case 'auth/invalid-email':
        setError('The email address is not valid.');
        break;
      case 'auth/weak-password':
        setError('The password is too weak. It must be at least 6 characters long.');
        break;
      case 'auth/operation-not-allowed':
        setError('Email/password accounts are not enabled. Please contact support.');
        break;
      case 'auth/too-many-requests':
        setError('Too many requests. Please try again later.');
        break;
      case 'auth/missing-password':
        setError('Please enter your password.')
        break;
      case 'auth/internal-error':
        setError('An internal error occurred. Please try again later.');
        break;
      default:
        setError(error.message);
        break;
    }
  };

  return (
    <View style={styles.container}>

      {/* App Logo */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Create Your Account</Text>

      {/* Name */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        placeholderTextColor="#888"
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#888"
      />

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />

      {/* Confirm Password */}
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Custom button styling */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}>
        Already have an account? Login
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333333',
    marginBottom: 30,
  },
  input: {
    height: 48,
    borderColor: '#AAB8C2',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    color: '#333333',
  },
  button: {
    backgroundColor: '#d4dbe0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#D32F2F',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#FF6347',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RegisterPage;
