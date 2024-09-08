import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Modal, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, database } from '../firebaseConfig';
import { ref, push, update } from 'firebase/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { usePoints } from '../context/PointsContext';
import { useTasks } from '../context/TasksContext';
import { Dropdown } from 'react-native-element-dropdown';

const AddEditTaskPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  // Getting task and mode from the parameter
  const { task, mode } = route.params || {};
  const isEditMode = mode === 'edit';
  const { points, addPoints } = usePoints();
  const { addTask, editTask } = useTasks();

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [date, setDate] = useState(task ? new Date(task.date) : new Date());
  const [time, setTime] = useState(task ? new Date(task.date) : new Date());
  const [priority, setPriority] = useState(task?.priority || '');
  const [category, setCategory] = useState(task?.category || '');
  const [tags, setTags] = useState(task?.tags ? task.tags.join(', ') : ''); // Converting array to string to display

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  // Checking the mode to set the header title
  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? 'Edit Task' : 'Add Task',
    });
  }, [navigation, isEditMode]);

  // validating the form before submission
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    }
    if (!priority) {
      newErrors.priority = 'Priority is required.';
    }
    if (!category) {
      newErrors.category = 'Category is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to save task
  const handleSaveTask = () => {
    if (!validateForm()) return;

    const user = auth.currentUser;
    if (user) {
      const combinedDateTime = new Date(date);
      combinedDateTime.setHours(time.getHours(), time.getMinutes());

      const taskData = {
        title,
        description,
        date: combinedDateTime.toISOString(),
        priority,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Ensure no empty tags
        completed: task?.completed || false,
      };

      if (isEditMode) {
        editTask({ ...taskData, id: task.id });
      } else {
        addTask(taskData);
        addPoints(10);
      }
      navigation.goBack();
    }
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
        placeholder="Task Title"
        value={title}
        onChangeText={setTitle}
        style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.cardBorderColor }]}
        placeholderTextColor={currentTheme.textColor}
      />
      {errors.title && <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>{errors.title}</Text>}

      {/* Description */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Description</Text>
      <TextInput
        placeholder="Task Description"
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
      {errors.priority && <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>{errors.priority}</Text>}

      {/* Category Dropdown */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Category</Text>
      <Dropdown
        data={[
          { label: 'Work', value: 'Work' },
          { label: 'Personal', value: 'Personal' },
        ]}
        labelField="label"
        valueField="value"
        placeholder="Select Category"
        value={category}
        onChange={item => setCategory(item.value)}
        style={[styles.dropdown, { borderColor: currentTheme.cardBorderColor }]}
        placeholderStyle={{ color: currentTheme.textColor }}
        selectedTextStyle={{ color: currentTheme.textColor }}
      />
      {errors.category && <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>{errors.category}</Text>}

      {/* Tags Input */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Tags</Text>
      <TextInput
        placeholder="Comma separated tags (e.g., Work, Urgent)"
        value={tags}
        onChangeText={setTags}
        style={[styles.input, { color: currentTheme.textColor, borderColor: currentTheme.cardBorderColor }]}
        placeholderTextColor={currentTheme.textColor}
      />

      {/* Date and Time Pickers */}
      <Text style={[styles.label, { color: currentTheme.textColor }]}>Date</Text>
      <Pressable onPress={() => setShowDatePicker(true)} style={({ pressed }) => [
        styles.dateButton,
        { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor, borderColor: currentTheme.cardBorderColor }
      ]}>
        <Text style={[styles.dateButtonText, { color: currentTheme.buttonText }]}>
          {format(date, 'dd/MM/yyyy')}
        </Text>
      </Pressable>

      <Text style={[styles.label, { color: currentTheme.textColor }]}>Time</Text>
      <Pressable onPress={() => setShowTimePicker(true)} style={({ pressed }) => [
        styles.dateButton,
        { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor, borderColor: currentTheme.cardBorderColor }
      ]}>
        <Text style={[styles.dateButtonText, { color: currentTheme.buttonText }]}>
          {format(time, 'HH:mm')}
        </Text>
      </Pressable>

      {Object.keys(errors).length > 0 && (
        <Text style={[styles.errorText, { color: currentTheme.errorColor }]}>Please fix the above errors before saving.</Text>
      )}

      {/* Modal for date picker */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.backgroundColor }]}>
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
            <Pressable onPress={() => setShowDatePicker(false)} style={({ pressed }) => [
              styles.confirmButton,
              { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor }
            ]}>
              <Text style={{ color: currentTheme.buttonText }}>Confirm Date</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal for time picker */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.backgroundColor }]}>
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
            <Pressable onPress={() => setShowTimePicker(false)} style={({ pressed }) => [
              styles.confirmButton,
              { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor }
            ]}>
              <Text style={{ color: currentTheme.buttonText }}>Confirm Time</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Button to save task */}
      <Pressable onPress={handleSaveTask} style={({ pressed }) => [
        styles.saveButton,
        { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor }
      ]}>
        <Text style={{ color: currentTheme.buttonText, fontWeight: 'bold' }}>{isEditMode ? 'Update Task' : 'Save Task'}</Text>
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
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    borderRadius: 10,
    padding: 20,
    width: 300,
    alignItems: 'center',
  },
  confirmButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FF6347',
  },
  saveButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    marginTop: -10,
    marginBottom: 10,
  },
});

export default AddEditTaskPage;
