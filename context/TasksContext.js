import React, { createContext, useContext, useState, useEffect } from 'react';
import { onValue, ref, push, update, remove, set } from 'firebase/database';
import { auth, database } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { scheduleTaskReminder, cancelAllNotifications, requestNotificationPermissions } from '../utils/notificationUtils';

// Creating a Task Context to manage task-related state across the app
const TasksContext = createContext();

// Hook to access the Tasks Context from other components
export const useTasks = () => useContext(TasksContext);

// TaskProvider component provides task-related functionalities to manage state
const TasksProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState({
    taskReminders: true,
    taskReminderTime: 10,
    dailySummary: true,
  });

  // Monitor user authentication staatus and sets the user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  // Load tasks and notification preferences from firebase whenever the user state changes
  useEffect(() => {
    if (user) {
      const tasksRef = ref(database, `tasks/${user.uid}`);
      const preferencesRef = ref(database, `users/${user.uid}/notificationPreferences`);

      // Load tasks from Firebase
      const tasksUnsubscribe = onValue(tasksRef, (snapshot) => {
        const data = snapshot.val();
        const loadedTasks = [];
        for (const key in data) {
          loadedTasks.push({ id: key, ...data[key] }); // Push each task into the tasks array
        }
        setTasks(loadedTasks);
        updateNotifications(loadedTasks); // Update notifications whenever tasks are loaded
      });

      // Load notification preferences
      const preferencesUnsubscribe = onValue(preferencesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setPreferences(data);
        }
      });

      return () => {
        tasksUnsubscribe();
        preferencesUnsubscribe(); // Cleanup on unmount
      };
    } else {
      setTasks([]);
    }
  }, [user]);

  // Function to add tasks to Firebase
  const addTask = (task) => {
    if (user) {
      const tasksRef = ref(database, `tasks/${user.uid}`);
      const newTaskRef = push(tasksRef);
      set(newTaskRef, { ...task, userId: user.uid }).then(() => {
        // Fetch updated tasks and update notifications after adding a task
        onValue(ref(database, `tasks/${user.uid}`), (snapshot) => {
          const data = snapshot.val();
          const updatedTasks = [];
          for (const key in data) {
            updatedTasks.push({ id: key, ...data[key] });
          }
          updateNotifications(updatedTasks);
        });
      });
    }
  };

  // Function to add sub task to Firebase
  const addSubtask = (taskId, subtask) => {
    if (user) {
      const subtasksRef = ref(database, `subtasks/${taskId}`);
      const newSubtaskRef = push(subtasksRef);
      set(newSubtaskRef, { ...subtask, taskId, completed: false }).then(() => {
        // Fetch updated subtasks after adding a subtask
        onValue(subtasksRef, (snapshot) => {
          const data = snapshot.val();
          const updatedSubtasks = [];
          for (const key in data) {
            updatedSubtasks.push({ id: key, ...data[key] });
          }
        });
      });
    }
  };

  // Function to edit an existing subtask in Firebase
  const editSubtask = (taskId, updatedSubtask) => {
    if (user) {
      const subtaskRef = ref(database, `subtasks/${taskId}/${updatedSubtask.id}`);
      update(subtaskRef, updatedSubtask).then(() => {
        // Fetch updated subtasks after editing a subtask
        onValue(ref(database, `subtasks/${taskId}`), (snapshot) => {
          const data = snapshot.val();
          const updatedSubtasks = [];
          for (const key in data) {
            updatedSubtasks.push({ id: key, ...data[key] });
          }
        });
      });
    }
  };

  // Function to delete subtask from Firebase
  const deleteSubtask = (taskId, subtaskId) => {
    if (user) {
      const subtaskRef = ref(database, `subtasks/${taskId}/${subtaskId}`);
      remove(subtaskRef).then(() => {
        // Fetch updated subtasks after deleting a subtask
        onValue(ref(database, `subtasks/${taskId}`), (snapshot) => {
          const data = snapshot.val();
          const updatedSubtasks = [];
          for (const key in data) {
            updatedSubtasks.push({ id: key, ...data[key] });
          }
        });
      });
    }
  };

  // Function to edit exisiting task in Firebase
  const editTask = (updatedTask) => {
    if (user) {
      const taskRef = ref(database, `tasks/${user.uid}/${updatedTask.id}`);
      update(taskRef, updatedTask).then(() => {
        // Fetch updated tasks and update notifications after editing a task
        onValue(ref(database, `tasks/${user.uid}`), (snapshot) => {
          const data = snapshot.val();
          const updatedTasks = [];
          for (const key in data) {
            updatedTasks.push({ id: key, ...data[key] });
          }
          updateNotifications(updatedTasks);
        });
      });
    }
  };

  // Function to delete task from Firebase
  const deleteTask = (taskId) => {
    if (user) {
      const taskRef = ref(database, `tasks/${user.uid}/${taskId}`);
      remove(taskRef).then(() => {
        // Fetch updated tasks and update notifications after deleting a task
        onValue(ref(database, `tasks/${user.uid}`), (snapshot) => {
          const data = snapshot.val();
          const updatedTasks = [];
          for (const key in data) {
            updatedTasks.push({ id: key, ...data[key] });
          }
          updateNotifications(updatedTasks);
        });
      });
    }
  };

  // Function to handle notification for tasks
  const updateNotifications = async (updatedTasks) => {
    try {
      await requestNotificationPermissions();
      await cancelAllNotifications();

      const { taskReminders, taskReminderTime } = preferences;

      // If task reminders is true, schedule reminders for tasks
      if (taskReminders) {
        updatedTasks.forEach(task => {
          if (task.date) {
            const reminderTime = new Date(task.date);
            reminderTime.setMinutes(reminderTime.getMinutes() - parseInt(taskReminderTime));
            if (reminderTime > new Date()) {
              scheduleTaskReminder(task.title, reminderTime); // Schedule the task reminder
            }
          } else {
            console.warn(`Task "${task.title}" does not have a valid date.`);
          }
        });
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  return (
    <TasksContext.Provider value={{
      tasks,
      addTask,
      editTask,
      deleteTask,
      addSubtask,
      editSubtask,
      deleteSubtask
    }}>
      {children}
    </TasksContext.Provider>
  );
};

export default TasksProvider;
