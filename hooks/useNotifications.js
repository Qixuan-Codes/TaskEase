import * as Notifications from 'expo-notifications';
import { useState, useEffect } from 'react';
import { scheduleTaskReminder, scheduleMorningSummary, scheduleEveningSummary, cancelAllNotifications, requestNotificationPermissions } from '../utils/notificationUtils';
import { useTasks } from '../context/TasksContext';
import { ref, get, update } from 'firebase/database'; // Import Firebase functions
import { auth, database } from '../firebaseConfig'; // Import Firebase config

const useNotifications = () => {
  const { tasks } = useTasks();
  const [taskReminders, setTaskReminders] = useState(false);
  const [dailySummary, setDailySummary] = useState(false);
  const [taskReminderTime, setTaskReminderTime] = useState('10'); // default 10 minutes before task
  const [permissionsGranted, setPermissionsGranted] = useState(true); // Track notification permissions

  const user = auth.currentUser; // Get the current user

  useEffect(() => {
    checkNotificationPermissions();
    loadPreferences(); // Load preferences on component mount
  }, []);

  useEffect(() => {
    if (taskReminders || dailySummary) {
      handleSavePreferences(); // Update notifications whenever task reminders or daily summary preferences change
    }
  }, [tasks]); // Watch for changes in tasks

  // Function to check notification permissions and guide the user if denied
  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      setPermissionsGranted(false);
      await Notifications.requestPermissionsAsync();
    } else {
      setPermissionsGranted(true);
    }
  };

  const loadPreferences = async () => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}/notificationPreferences`);
      get(userRef)
        .then((snapshot) => {
          const data = snapshot.val();
          if (data) {
            setTaskReminders(data.taskReminders || false);
            setDailySummary(data.dailySummary || false);
            setTaskReminderTime(data.taskReminderTime || '10');
          }
        })
        .catch((error) => console.error('Error loading notification preferences:', error));
    }
  };

  const savePreferences = async () => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}/notificationPreferences`);
      try {
        await update(userRef, {
          taskReminders,
          dailySummary,
          taskReminderTime,
        });
        console.log('Preferences saved successfully.');
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
    }
  };

  const handleSavePreferences = () => {
    savePreferences(); // Save preferences to Firebase
    cancelAllNotifications(); // Clear existing notifications

    if (taskReminders) {
      tasks.forEach(task => {
        const reminderTime = new Date(task.date);
        reminderTime.setMinutes(reminderTime.getMinutes() - parseInt(taskReminderTime));
        scheduleTaskReminder(task.title, reminderTime);
      });
    }

    if (dailySummary) {
      const tasksDueToday = tasks.filter(task => new Date(task.date).toDateString() === new Date().toDateString()).length;
      const tasksCompleted = tasks.filter(task => task.completed && new Date(task.date).toDateString() === new Date().toDateString()).length;
      const tasksLeft = tasksDueToday - tasksCompleted;

      scheduleMorningSummary(tasksDueToday);
      scheduleEveningSummary(tasksCompleted, tasksLeft);
    }
  };

  return {
    taskReminders,
    setTaskReminders,
    dailySummary,
    setDailySummary,
    taskReminderTime,
    setTaskReminderTime,
    handleSavePreferences,
    permissionsGranted, // Expose permissions status
  };
};

export default useNotifications;
