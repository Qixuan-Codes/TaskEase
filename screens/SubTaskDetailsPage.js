import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { usePoints } from '../context/PointsContext';
import { useTasks } from '../context/TasksContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';
import { format } from 'date-fns';

const SubTaskDetailsPage = ({ route, navigation }) => {
  const { subtaskId, taskId } = route.params;
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const { tasks, editSubtask, deleteSubtask } = useTasks();
  const { addPoints, completeTask } = usePoints();

  const [currentSubtask, setCurrentSubtask] = useState(null);

  useEffect(() => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      fetchSubtask(subtaskId, taskId);
    } else {
      navigation.goBack();
    }
  }, [subtaskId, taskId, tasks]);

  // Fetching subtasks
  const fetchSubtask = (subtaskId, taskId) => {
    const subtaskRef = ref(database, `subtasks/${taskId}/${subtaskId}`);
    onValue(subtaskRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentSubtask({ id: subtaskId, ...data });
      }
    });
  };

  // Return null if there is no subtask
  if (!currentSubtask) {
    return null;
  }

  // Handles subtask deletion
  const handleDeletePress = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this subtask?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteSubtask(taskId, subtaskId);
            navigation.goBack();
            addPoints(-5);  // Adjust points as per subtask deletion
          }
        }
      ]
    );
  };

  // Handles subtask completion status
  const handleToggleComplete = () => {
    const updatedSubtask = { ...currentSubtask, completed: !currentSubtask.completed };
    editSubtask(taskId, updatedSubtask);
    setCurrentSubtask(updatedSubtask);

    completeTask(subtaskId, updatedSubtask.completed);

    if (updatedSubtask.completed) {
      if (!currentSubtask.completed) {
        addPoints(10);
      }
    } else {
      addPoints(-10);
    }
  };

  const subtaskDate = new Date(currentSubtask.date);
  const formattedDate = format(subtaskDate, 'dd/MM/yyyy hh:mm a');

  // Setting priority colour
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#FF4500';
      case 'Medium': return '#FFA500';
      case 'Low': return '#006400';
      default: return currentTheme.textColor;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={styles.sectionContainer}>

        {/* Subtask Information Card */}
        <View style={[
          styles.card,
          { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }
        ]}>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>{currentSubtask.title}</Text>
          <Text style={[styles.description, { color: currentTheme.textColor }]}>{currentSubtask.description}</Text>
          <Text style={[styles.date, { color: currentTheme.textColor }]}>{formattedDate}</Text>

          <View style={styles.additionalInfo}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(currentSubtask.priority) }]}>
              <Text style={styles.priorityText}>{currentSubtask.priority}</Text>
            </View>

            {currentSubtask.tags && currentSubtask.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {currentSubtask.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: currentTheme.buttonColor }]}
              onPress={() => navigation.navigate('AddEditSubTask', { taskId, mode: 'edit', subtask: currentSubtask, mainTaskDate: route.params.mainTaskDate })}
            >
              <Text style={[styles.buttonText, { color: currentTheme.buttonText }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDeletePress}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, currentSubtask.completed ? styles.undoButton : styles.completeButton]}
              onPress={handleToggleComplete}
            >
              <Text style={styles.buttonText}>{currentSubtask.completed ? "Uncomplete" : "Complete"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  additionalInfo: {
    marginTop: 10,
    marginBottom: 20,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  priorityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginTop: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 1,
  },
  button: {
    padding: 10,
    alignItems: 'center',
    width: '30%',
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: 'red',
  },
  completeButton: {
    backgroundColor: 'green',
  },
  undoButton: {
    backgroundColor: 'orange',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SubTaskDetailsPage;
