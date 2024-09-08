import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import useNotifications from '../hooks/useNotifications';
import { Ionicons } from '@expo/vector-icons';

const EditNotificationsPage = () => {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const {
    taskReminders,
    setTaskReminders,
    dailySummary,
    setDailySummary,
    taskReminderTime,
    setTaskReminderTime,
    handleSavePreferences,
    permissionsGranted,
  } = useNotifications();

  // Function to guide user to the app's notification settings in the device settings
  const openNotificationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.header, { color: currentTheme.textColor }]}>Edit Notification Preferences</Text>

      {/* Show alert if permissions are not granted */}
      {!permissionsGranted && (
        <TouchableOpacity style={styles.permissionAlert} onPress={openNotificationSettings}>
          <Ionicons name="notifications-off-circle-outline" size={24} color="red" />
          <Text style={[styles.alertText, { color: 'black' }]}>
            Notifications are disabled. Tap here to enable in Settings.
          </Text>
        </TouchableOpacity>
      )}

      {/* Task Reminders */}
      <View style={[styles.card, { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }]}>
        <View style={styles.settingContainer}>
          <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>Task Reminders</Text>
          <Switch
            trackColor={{ false: '#767577', true: 'green' }}
            thumbColor={taskReminders ? '#ffffff' : '#f4f3f4'}
            onValueChange={() => setTaskReminders(!taskReminders)}
            value={taskReminders}
          />
        </View>
        {taskReminders && (
          <View style={styles.reminderTimeContainer}>
            <Text style={[styles.customReminderLabel, { color: currentTheme.textColor }]}>Reminder Time (Minutes Before):</Text>
            <TextInput
              style={[styles.customReminderInput, { color: currentTheme.textColor, borderColor: currentTheme.buttonColor }]}
              value={taskReminderTime}
              onChangeText={setTaskReminderTime}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* Daily Summary */}
      <View style={[styles.card, { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }]}>
        <View style={styles.settingContainer}>
          <Text style={[styles.settingLabel, { color: currentTheme.textColor }]}>Daily Summary</Text>
          <Switch
            trackColor={{ false: '#767577', true: 'green' }}
            thumbColor={dailySummary ? '#ffffff' : '#f4f3f4'}
            onValueChange={() => setDailySummary(!dailySummary)}
            value={dailySummary}
          />
        </View>
        {dailySummary && (
          <Text style={[styles.summaryInfo, { color: currentTheme.textColor }]}>
            Daily summaries will be sent at 6 AM and 9 PM.
          </Text>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity style={[styles.saveButton, { backgroundColor: currentTheme.buttonColor }]} onPress={handleSavePreferences}>
        <Text style={[styles.saveButtonText, { color: currentTheme.buttonText }]}>Save Preferences</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  permissionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffdddd',
    borderRadius: 5,
    marginBottom: 10,
  },
  alertText: {
    fontSize: 14,
    marginLeft: 10,
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingLabel: {
    fontSize: 18,
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customReminderLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  customReminderInput: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    width: 80,
  },
  summaryInfo: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  saveButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditNotificationsPage;