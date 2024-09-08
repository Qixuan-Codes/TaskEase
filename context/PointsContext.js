import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { auth, database } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Toast from 'react-native-toast-message';

// Creating a context to manage points and challenges across the app
const PointsContext = createContext();

// Custom hook to access PointContext easily from any component
export const usePoints = () => useContext(PointsContext);

const PointsProvider = ({ children }) => {
  // Initialising the states
  const [points, setPoints] = useState(0);
  const [user, setUser] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastChallengeDate, setLastChallengeDate] = useState(null);

  // Constants for daily points and challenge goals
  const dailyLoginPoints = 10;
  const dailyChallengeGoal = 3;

  // Effect to track user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        resetPointsState();
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect to initialise user state and challenge progress when the user logs in
  useEffect(() => {
    if (user) {
      initializeState();
    }
  }, [user]);

  // Function to initialise user data, points, and challenge progress from Firebase
  const initializeState = () => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      const tasksRef = ref(database, `tasks/${user.uid}`);

      // Fetch user data (points, streak, last challenge date) from Firebase
      get(userRef)
        .then((snapshot) => {
          const data = snapshot.val();
          if (data) {
            setPoints(data.points || 0);
            setLastChallengeDate(data.lastChallengeDate);
            setStreak(data.streak || 0);

            handleDailyLoginAndStreak(userRef, data);
          }
        })
        .catch((error) => console.error('Error fetching user data:', error));

      // Fetch tasks and calculate daily challenge progress (task completed today)
      get(tasksRef)
        .then((snapshot) => {
          const tasksData = snapshot.val();
          if (tasksData) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set time to midnight
            const todayString = today.toISOString().split('T')[0];

            const completedTasksToday = Object.values(tasksData).filter(
              (task) => task.completed && task.date.startsWith(todayString)
            ).length;

            setChallengeProgress(Math.min(completedTasksToday, dailyChallengeGoal));
          } else {
            setChallengeProgress(0); // Reset progress if there is no task completed
          }
        })
        .catch((error) => console.error('Error fetching tasks data:', error));
    }
  };

  // Refresh function to update user state and challenge progress from Firebase
  const refreshState = () => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      const tasksRef = ref(database, `tasks/${user.uid}`);

      // Refresh user points, streaks, and last challenge date
      get(userRef)
        .then((snapshot) => {
          const data = snapshot.val();
          if (data) {
            setPoints(data.points || 0);
            setLastChallengeDate(data.lastChallengeDate);
            setStreak(data.streak || 0);
          }
        })
        .catch((error) => console.error('Error fetching user data:', error));

      // Refresh daily challenge progress
      get(tasksRef)
        .then((snapshot) => {
          const tasksData = snapshot.val();
          if (tasksData) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split('T')[0];

            const completedTasksToday = Object.values(tasksData).filter(
              (task) => task.completed && task.date.startsWith(todayString)
            ).length;

            setChallengeProgress(Math.min(completedTasksToday, dailyChallengeGoal));
          } else {
            setChallengeProgress(0);
          }
        })
        .catch((error) => console.error('Error fetching tasks data:', error));
    }
  };

  // Handles daily login points and streak calculation
  const handleDailyLoginAndStreak = (userRef, data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight
    const todayString = today.toISOString().split('T')[0];
    const oldLastLoginDate = data.lastLoginDate;

    // Checks if user has already logged in today
    if (oldLastLoginDate !== todayString) {
      let newStreak = 1;
      if (oldLastLoginDate) {
        const lastLogin = new Date(oldLastLoginDate);
        lastLogin.setHours(0, 0, 0, 0);
        const daysDifference = (new Date(todayString) - lastLogin) / (1000 * 60 * 60 * 24);

        newStreak = daysDifference === 1 ? data.streak + 1 : 1; // Increase streak if user has logged in on consecutive days
      }

      // Award daily plogin points and reset challenge progress for the new day
      const newPoints = (data.points || 0) + dailyLoginPoints;

      update(userRef, {
        points: newPoints,
        lastLoginDate: todayString,
        streak: newStreak,
        challengeProgress: 0,
      })
        .then(() => {
          updateLeaderboard(newPoints);
          refreshState();
          Toast.show({
            type: 'success',
            text1: 'Points Earned!',
            text2: `🎉 You've earned ${dailyLoginPoints} points for daily login!`,
          });
        })
        .catch((error) => console.error('Error updating points, lastLoginDate, and streak:', error));
    }
  };

  // Function to add points to user's score
  const addPoints = (pointsToAdd) => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef)
        .then((snapshot) => {
          const data = snapshot.val();
          let newPoints = (data.points || 0) + pointsToAdd;
          newPoints = Math.max(newPoints, 0);

          update(userRef, { points: newPoints })
            .then(() => {
              updateLeaderboard(newPoints);
              refreshState();

              // Custom Toast Message for 70 Points (completing daily challenge 50 + 20 from completing a task)
              if (pointsToAdd === 70) {
                Toast.show({
                  type: 'success',
                  text1: 'Daily Challenge Complete!',
                  text2: '🎉 You earned a total of 20 + 50 points for completing the daily challenge!',
                });
              } else if (pointsToAdd === -70) {
                Toast.show({
                  type: 'error',
                  text1: 'Daily Challenge Uncompleted!',
                  text2: '⚠️ You lost a total of 20 + 50 points for uncompleting the daily challenge!',
                });
              } else {
                Toast.show({
                  type: pointsToAdd > 0 ? 'success' : 'error',
                  text1: 'Points Update!',
                  text2: pointsToAdd > 0
                    ? `🎉 You've earned ${pointsToAdd} points!`
                    : `⚠️ You've lost ${Math.abs(pointsToAdd)} points!`,
                });
              }
            })
            .catch((error) => console.error('Error updating points:', error));
        })
        .catch((error) => console.error('Error fetching user data for points update:', error));
    }
  };


  // Function to reset the points state
  const resetPointsState = () => {
    setPoints(0);
    setChallengeProgress(0);
    setStreak(0);
    setLastChallengeDate(null);
  };

  // Handles completing a task
  const completeTask = (taskId, isCompleted) => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      const taskRef = ref(database, `tasks/${user.uid}/${taskId}`);

      get(taskRef)
        .then((snapshot) => {
          const taskData = snapshot.val();
          if (taskData) {
            const wasCompleted = taskData.completed;

            if (isCompleted !== wasCompleted) {
              update(taskRef, { completed: isCompleted });

              if (isCompleted) {
                // Setting newProgress as setChallengeProgress takes a while to update the state
                let newProgress = challengeProgress + 1;
                // If the task completed is the third of the day award 70 points
                if (newProgress == dailyChallengeGoal) {
                  addPoints(70);
                  setChallengeProgress((prev) => prev + 1);
                } else {
                  // For normal completion 20 points will be added
                  addPoints(20);
                  setChallengeProgress((prev) => prev + 1);
                }
              } else {
                let newProgress = challengeProgress - 1;
                // if the newProgress == 2 this means that the user has completed the daily challenge and undo-ed
                // the completion this removes 70 points
                if (newProgress == 2) {
                  addPoints(-70);
                  setChallengeProgress((prev) => prev - 1);
                } else {
                  addPoints(-20);
                  setChallengeProgress((prev) => prev - 1);
                }
              }
            }
          }
        })
        .catch((error) => console.error('Error fetching task data:', error));
    }
  };

  // Update the leaderboard with the latest points
  const updateLeaderboard = (newPoints) => {
    if (user) {
      const leaderboardRef = ref(database, `leaderboard/${user.uid}`);
      update(leaderboardRef, { points: newPoints }).catch((error) =>
        console.error('Error updating leaderboard:', error)
      );
    }
  };

  return (
    <PointsContext.Provider value={{ points, addPoints, challengeProgress, streak, completeTask }}>
      {children}
    </PointsContext.Provider>
  );
};

export default PointsProvider;
