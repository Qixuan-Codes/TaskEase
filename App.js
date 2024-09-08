import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from './firebaseConfig';
import { ref, onValue } from 'firebase/database';
import TasksProvider from './context/TasksContext';
import { useTheme, ThemeProvider } from './context/ThemeContext';
import { lightTheme, darkTheme } from './theme';
import Toast from 'react-native-toast-message';

import TasksPage from './screens/TasksPage';
import CalendarPage from './screens/CalendarPage';
import SearchPage from './screens/SearchPage';
import ProfilePage from './screens/ProfilePage';
import TaskDetailsPage from './screens/TaskDetailsPage';
import LoginPage from './screens/LoginPage';
import RegisterPage from './screens/RegisterPage';
import AddEditTaskPage from './screens/AddEditTaskPage';
import PointsProvider from './context/PointsContext';
import LeaderboardPage from './screens/LeaderboardPage';
import EditNotificationsPage from './screens/EditNotificationsPage';
import AddEditSubTaskPage from './screens/AddEditSubTaskPage';
import SubTaskDetailsPage from './screens/SubTaskDetailsPage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthStack() {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: currentTheme.headerBackground }, 
        headerTintColor: currentTheme.headerTextColor,
        headerShown: false  
      }}
    >
      <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterPage} options={{ headerShown: false }} />
      <Stack.Screen name="TasksListPage" component={TasksPage} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function TasksStack() {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: currentTheme.headerBackground }, 
        headerTintColor: currentTheme.headerTextColor,
        headerShown: true  
      }}
    >
      <Stack.Screen name="TasksListPage" component={TasksPage} options={{ headerTitle: 'Tasks' }} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsPage} options={{ headerTitle: 'Task Details' }} />
      <Stack.Screen name="AddEditTask" component={AddEditTaskPage} options={{ headerTitle: 'Add/Edit Task' }} />
      <Stack.Screen name="AddEditSubTask" component={AddEditSubTaskPage} options={{ headerTitle: 'Add/Edit Sub Task' }} />
      <Stack.Screen name="SubTaskDetails" component={SubTaskDetailsPage} options={{ headerTitle: 'Sub Task Details' }} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: currentTheme.headerBackground }, 
        headerTintColor: currentTheme.headerTextColor,
        headerShown: true  
      }}
    >
      <Stack.Screen name="CalendarPage" component={CalendarPage} options={{ headerTitle: 'Calendar' }} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsPage} options={{ headerTitle: 'Task Details' }} />
      <Stack.Screen name="AddEditTask" component={AddEditTaskPage} options={{ headerTitle: 'Add/Edit Task' }} />
      <Stack.Screen name="AddEditSubTask" component={AddEditSubTaskPage} options={{ headerTitle: 'Add/Edit Sub Task' }} />
      <Stack.Screen name="SubTaskDetails" component={SubTaskDetailsPage} options={{ headerTitle: 'Sub Task Details' }} />
    </Stack.Navigator>
  );
}

function SearchStack() {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: currentTheme.headerBackground }, 
        headerTintColor: currentTheme.headerTextColor,
        headerShown: true  
      }}
    >
      <Stack.Screen name="SearchPage" component={SearchPage} options={{ headerTitle: 'Search' }} />
      <Stack.Screen name="TaskDetails" component={TaskDetailsPage} options={{ headerTitle: 'Task Details' }} />
      <Stack.Screen name="AddEditTask" component={AddEditTaskPage} options={{ headerTitle: 'Add/Edit Task' }} />
      <Stack.Screen name="AddEditSubTask" component={AddEditSubTaskPage} options={{ headerTitle: 'Add/Edit Sub Task' }} />
      <Stack.Screen name="SubTaskDetails" component={SubTaskDetailsPage} options={{ headerTitle: 'Sub Task Details' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: currentTheme.headerBackground }, 
        headerTintColor: currentTheme.headerTextColor,
        headerShown: true  
      }}
    >
      <Stack.Screen name="ProfilePage" component={ProfilePage} options={{ headerTitle: 'Profile' }} />     
      <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
      <Stack.Screen name="Leaderboard" component={LeaderboardPage}  options={{ headerTitle: 'Leaderboard' }} />
      <Stack.Screen name="Notification" component={EditNotificationsPage}  options={{ headerTitle: 'Notification' }} />
    </Stack.Navigator>
  );
}

function MyTabs() {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: currentTheme.tabBarIconActive,
        tabBarInactiveTintColor: currentTheme.tabBarIconInactive,
        tabBarStyle: { backgroundColor: currentTheme.tabBarBackground },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Tasks" component={TasksStack}/>
      <Tab.Screen name="Calendar" component={CalendarStack}/>
      <Tab.Screen name="Search" component={SearchStack}/>
      <Tab.Screen name="Profile" component={ProfileStack}/>
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // Fetch user theme from Firebase and set it
        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data && data.theme) {
            setTheme(data.theme); // Set the theme based on user preference
          } else {
            setTheme('light'); // Default to light theme if no preference is found
          }
        });
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setTheme]);

  return (
    <NavigationContainer>
      {user ? <MyTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}



export default function App() {
  return (
    <ThemeProvider>
      <PointsProvider>
        <TasksProvider>
           <AppContent />
        </TasksProvider>
      </PointsProvider>
      <Toast />
    </ThemeProvider>
  );
}
