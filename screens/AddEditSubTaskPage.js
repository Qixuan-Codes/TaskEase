import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../firebaseConfig';
import { ref, set, update, push } from 'firebase/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { Dropdown } from 'react-native-element-dropdown';

const AddEditSubTaskPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // Getting the task id, subtask, mode, and maintask date from the parameter
  const { taskId, subtask, mode, mainTaskDate } = route.params || {};
  const isEditMode = mode === 'edit';

  // Initialising the states
  const [title, setTitle] = useState(subtask?.title || '');
  const [description, setDescription] = useState(subtask?.description || '');
  const [date, setDate] = useState(subtask ? new Date(subtask.date) : new Date());
  const [time, setTime] = useState(subtask ? new Date(subtask.date) : new Date());
  const [priority, setPriority] = useState(subtask?.priority || 'Low');
  const [tags, setTags] = useState(subtask?.tags ? subtask.tags.join(', ') : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  // Set the header title based on the mode
  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? 'Edit Subtask' : 'Add Subtask',
    });
  }, [navigation, isEditMode]);

  const handleSaveSubtask = () => {
    const newErrors = {};

    // Validate Title
    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    }

    // Validate Description
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    }

    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(time.getHours(), time.getMinutes());

    const readableMainTaskDate = format(new Date(mainTaskDate), 'dd/MM/yyyy HH:mm');

    // Check if the subtask date and time is later than the main task date and time
    if (combinedDateTime > new Date(mainTaskDate)) {
      newErrors.date = `Subtask date and time cannot be later than the main task.\nMain Task Date: ${readableMainTaskDate}`;
    }

    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);  // This will display all errors at once
      return;
    }

    // If no errors, proceed with saving the subtask
    const subtaskData = {
      title,
      description,
      date: combinedDateTime.toISOString(),
      priority,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      completed: subtask?.completed || false,
    };

    if (isEditMode) {
      updateSubtask(subtask.id, subtaskData);
    } else {
      addSubtask(subtaskData);
    }
  };

  // Function to add subtask
  const addSubtask = (subtaskData) => {
    const subtasksRef = ref(database, `subtasks/${taskId}`);
    const newSubtaskRef = push(subtasksRef);
    set(newSubtaskRef, subtaskData)
      .then(() => {
        navigation.goBack();
      })
      .catch((error) => {
        console.error('Failed to add subtask:', error);
      });
  };

  // function to update subtask
  const updateSubtask = (subtaskId, subtaskData) => {
    const subtaskRef = ref(database, `subtasks/${taskId}/${subtaskId}`);
    update(subtaskRef, subtaskData)
      .then(() => {
        navigation.goBack();
      })
      .catch((error) => {
        console.error('Failed to update subtask:', error);
      });
  };

  // Handle date change from DatePicker
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  // Handle time change from TimePicker
  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>

      {/* Title */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Title</Text>
      <TextInput
        placeholder="Subtask Title"
        value={title}
        onChangeText={setTitle}
        style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.cardBorderColor }]}
        placeholderTextColor={currentTheme.textColor}
      />
      {errors.title && <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>{errors.title}</Text>}

      {/* Description */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Description</Text>
      <TextInput
        placeholder="Subtask Description"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.cardBorderColor }]}
        placeholderTextColor={currentTheme.textColor}
      />
      {errors.description && <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>{errors.description}</Text>}

      {/* Priority Dropdown */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Priority</Text>
      <Dropdown
        data={[
          { label: 'Low', value: 'Low' },
          { label: 'Medium', value: 'Medium' },
          { label: 'High', value: 'High' },
        ]}
        labelField="label"
        valueField="value"
        placeholder="Select Priority"
        value={priority}
        onChange={item => setPriority(item.value)}
        style={[styles.dropdown, { borderColor: currentTheme.cardBorderColor }]}
        placeholderStyle={{ color: currentTheme.textColor }}
        selectedTextStyle={{ color: currentTheme.textColor }}
      />

      {/* Tags */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Tags</Text>
      <TextInput
        placeholder="Comma separated tags (e.g., Work, Urgent)"
        value={tags}
        onChangeText={setTags}
        style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.cardBorderColor }]}
        placeholderTextColor={currentTheme.textColor}
      />

      {/* Date and Time */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Date</Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={({ pressed }) => [
        styles.dateButton,
        { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor, borderColor: currentTheme.cardBorderColor }
      ]}>
        <Text style={[styles.dateButtonText, { color: currentTheme.textColor }]}>
          {format(date, 'dd/MM/yyyy')}
        </Text>
      </Pressable>

      <Text style={[styles.label, { color: currentTheme.textColor }]}>Time</Text>
      <Pressable onPress={() => setShowTimePicker(true)} style={({ pressed }) => [
        styles.dateButton,
        { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor, borderColor: currentTheme.cardBorderColor }
      ]}>
        <Text style={[styles.dateButtonText, { color: currentTheme.textColor }]}>
          {format(time, 'HH:mm')}
        </Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
      {errors.date && <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>{errors.date}</Text>}

      <Pressable onPress={handleSaveSubtask} style={[styles.saveButton, { backgroundColor: currentTheme.buttonColor }]}>
        <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>
          {isEditMode ? 'Update Subtask' : 'Add Subtask'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  input: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: 5,
  },
  dropdown: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: 5,
  },
  dateButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    fontSize: 16,
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
});

export default AddEditSubTaskPage;