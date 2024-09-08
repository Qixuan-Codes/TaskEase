import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const LoginPage = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handles the login
  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('TasksListPage');
    } catch (error) {
      console.error(error);
      handleFirebaseError(error);
    }
  };

  // Handles the firebase errors
  const handleFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        setError('The email address is not valid.');
        break;
      case 'auth/user-disabled':
        setError('The user account has been disabled.');
        break;
      case 'auth/user-not-found':
        setError('No user found with this email.');
        break;
      case 'auth/wrong-password':
        setError('Incorrect password. Please try again.');
        break;
      case 'auth/invalid-credential':
        setError('Invalid credentials provided. Please check your login details.');
        break;
      case 'auth/too-many-requests':
        setError('Too many attempts. Please try again later.');
        break;
      case 'auth/internal-error':
        setError('An internal error occurred. Please try again later.');
        break;
      default:
        setError('An error occurred. Please try again.');
        break;
    }
  };

  return (
    <View style={styles.container}>

      {/* App Logo */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Welcome to TaskEase</Text>

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
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Custom button styling */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.registerText} onPress={() => navigation.navigate('Register')}>
        Don't have an account? Register
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
  registerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#FF6347',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginPage;
