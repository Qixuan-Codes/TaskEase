import * as Notifications from 'expo-notifications';

// Function to request notification permissions
export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
};

// Function to schedule a task reminder
export const scheduleTaskReminder = async (taskTitle, reminderTime) => {
  try {
    const currentTime = new Date();
    if (reminderTime > currentTime) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: `Reminder: ${taskTitle} is due soon`,
          sound: true,
        },
        trigger: { date: reminderTime },
      });
    }
  } catch (error) {
    console.error(`Failed to schedule task reminder for "${taskTitle}":`, error); // Error log
  }
};

// Function to schedule daily summary at 6 AM for tasks due today
export const scheduleMorningSummary = async (tasksDueToday) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Morning Summary',
        body: `You have ${tasksDueToday} tasks due today.`,
        sound: true,
      },
      trigger: {
        hour: 6,
        minute: 0,
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Failed to schedule morning summary:', error); // Error log
  }
};

// Function to schedule daily summary at 9 PM for completed and pending tasks
export const scheduleEveningSummary = async (tasksCompleted, tasksLeft) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Evening Summary',
        body: `You completed ${tasksCompleted} tasks today. ${tasksLeft} tasks left.`,
        sound: true,
      },
      trigger: {
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Failed to schedule evening summary:', error); // Error log
  }
};

// Function to cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel all scheduled notifications:', error); // Error log
  }
};
