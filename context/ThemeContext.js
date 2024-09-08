import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, database } from '../firebaseConfig';
import { ref, onValue, set } from 'firebase/database';

// Creating a Theme Context to manage theme-related state across the app
const ThemeContext = createContext();

// Hook to access the Theme Context from other components
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to 'light' theme

  // Fetch theme from Firebase when the user logs in
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const themeRef = ref(database, `users/${user.uid}/theme`);
      onValue(themeRef, (snapshot) => {
        const userTheme = snapshot.val();
        if (userTheme) {
          setTheme(userTheme);
        }
      });
    }
  }, []);

  // Function that toggles theme from light to dark
  const toggleTheme = () => {
    try {
      setTheme((prevTheme) => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';

        // Save the theme to Firebase for the logged-in user
        const user = auth.currentUser;
        if (user) {
          const themeRef = ref(database, `users/${user.uid}/theme`);
          set(themeRef, newTheme);
        }

        return newTheme;
      });
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
