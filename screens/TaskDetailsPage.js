import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Pressable, ScrollView, Modal } from 'react-native';
import { useTasks } from '../context/TasksContext';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { usePoints } from '../context/PointsContext';
import { onValue, ref } from 'firebase/database';
import { database } from '../firebaseConfig';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';

const TaskDetailsPage = ({ route, navigation }) => {
  const { taskId, backTitle, source } = route.params;
  const { tasks, deleteTask, editTask } = useTasks();
  const [currentTask, setCurrentTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const { addPoints, completeTask } = usePoints();

  const [sortBy, setSortBy] = useState('default');
  const [filterCriteria, setFilterCriteria] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);


  useEffect(() => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
      fetchSubtasks(taskId); // Fetch subtasks when the task is found
    } else {
      navigateToSource();
    }
  }, [taskId, tasks]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Task Detail',
      headerBackTitle: backTitle,
    });
  }, [navigation, backTitle]);

  // Fetching subtasks
  const fetchSubtasks = (taskId) => {
    const subtasksRef = ref(database, `subtasks/${taskId}`);
    onValue(subtasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedSubtasks = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setSubtasks(loadedSubtasks);
      } else {
        setSubtasks([]); // No subtasks available
      }
    });
  };

  // Navigation to source from one of the pages listed
  const navigateToSource = () => {
    if (source === 'Calendar') {
      navigation.navigate('CalendarPage');
    } else if (source === 'Search') {
      navigation.navigate('SearchPage');
    } else {
      navigation.navigate('TasksListPage');
    }
  };

  if (!currentTask) {
    return null;
  }

  // Sorting the subtasks
  const sortSubtasks = (subtasksToSort) => {
    const sortedSubtasks = [...subtasksToSort];
    switch (sortBy) {
      case 'time':
        sortedSubtasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'priority':
        const priorityOrder = { High: 1, Medium: 2, Low: 3 };
        sortedSubtasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      default:
        break;
    }
    return sortedSubtasks;
  };

  // Filtering the subtasks
  const filterSubtasks = (subtasksToFilter) => {
    if (filterCriteria.length === 0) {
      return subtasksToFilter;
    }

    return subtasksToFilter.filter(subtask => {
      let matches = true;

      filterCriteria.forEach(criteria => {
        if (criteria === 'Completed' && !subtask.completed) matches = false;
        if (criteria === 'Not Completed' && subtask.completed) matches = false;
        if (['High', 'Medium', 'Low'].includes(criteria) && subtask.priority !== criteria) matches = false;
      });

      return matches;
    });
  };

  const filteredAndSortedSubtasks = sortSubtasks(filterSubtasks(subtasks));

  // Handles main task deletion
  const handleDeletePress = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this task?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTask(currentTask.id);
            navigateToSource();
            addPoints(-10);
          }
        }
      ]
    );
  };

  // Handles maint ask completion
  const handleToggleComplete = () => {
    const updatedTask = { ...currentTask, completed: !currentTask.completed };
    completeTask(currentTask.id, updatedTask.completed);
    editTask(updatedTask);
    setCurrentTask(updatedTask);
  };

  const taskDate = new Date(currentTask.date);
  const formattedDate = format(taskDate, 'dd/MM/yyyy hh:mm a');

  // Setting the priority colour
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

      {/* Task Container */}
      <Text style={[styles.taskTitle, { color: currentTheme.textColor }]}>Main Task:</Text>
      <View style={styles.sectionContainer}>
        <View style={[
          styles.card,
          { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }
        ]}>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>{currentTask.title}</Text>
          <Text style={[styles.description, { color: currentTheme.textColor }]}>{currentTask.description}</Text>
          <Text style={[styles.date, { color: currentTheme.textColor }]}>{formattedDate}</Text>

          <View style={styles.additionalInfo}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(currentTask.priority) }]}>
              <Text style={styles.priorityText}>{currentTask.priority}</Text>
            </View>
            <Text style={[styles.category, { color: currentTheme.textColor }]}>{currentTask.category}</Text>

            {currentTask.tags && currentTask.tags.length > 0 && currentTask.tags[0] !== '' && (
              <View style={styles.tagsContainer}>
                {currentTask.tags.slice(0, 5).map((tag, index) => (
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
              onPress={() => navigation.navigate('AddEditTask', { mode: 'edit', task: currentTask })}
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
              style={[styles.button, currentTask.completed ? styles.undoButton : styles.completeButton]}
              onPress={handleToggleComplete}
            >
              <Text style={styles.buttonText}>{currentTask.completed ? "Uncomplete" : "Complete"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Subtasks Header and Add Button */}
      <View style={styles.subtasksHeaderContainer}>
        <Text style={[styles.subtaskTitle, { color: currentTheme.textColor }]}>Subtasks:</Text>
        <TouchableOpacity
          style={[styles.addSubtaskButton, { backgroundColor: currentTheme.buttonColor }]}
          onPress={() => navigation.navigate('AddEditSubTask', { taskId, mainTaskDate: currentTask.date, mode: 'add' })}
        >
          <Text style={[styles.addSubtaskButtonText, { color: currentTheme.buttonText }]}>Add Subtask</Text>
        </TouchableOpacity>
      </View>

      {/* Subtasks Section */}
      {filteredAndSortedSubtasks.length === 0 ? (
        <Text style={[styles.noSubtasksText, { color: currentTheme.textColor }]}>
          No subtasks available.
        </Text>
      ) : (
        <ScrollView style={styles.subtasksContainer}>
          {filteredAndSortedSubtasks.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.subtaskCard,
                {
                  backgroundColor: pressed
                    ? currentTheme.taskContainerBackground
                    : item.completed
                      ? '#d3ffd3'
                      : currentTheme.taskContainerBackground,
                  borderColor: currentTheme.cardBorderColor,
                },
              ]}
              onPress={() =>
                navigation.navigate('SubTaskDetails', { subtaskId: item.id, taskId, mainTaskDate: currentTask.date })
              }
            >
              {/* Title and Priority */}
              <View style={styles.subtaskHeader}>
                <Text
                  style={[
                    styles.subtaskTitle,
                    {
                      color: item.completed ? '#999' : currentTheme.textColor,
                      textDecorationLine: item.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {item.title}{item.completed && '✓'}
                </Text>
                {item.priority && (
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(item.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text
                style={[
                  styles.subtaskDescription,
                  {
                    color: item.completed ? '#999' : currentTheme.textColor,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  },
                ]}
              >
                {item.description}{item.completed && '✓'}
              </Text>

              {/* Time and Tags */}
              <View style={styles.subtaskFooter}>
                <Text
                  style={[
                    styles.subtaskTime,
                    {
                      color: item.completed ? '#999' : currentTheme.textColor,
                      textDecorationLine: item.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {format(new Date(item.date), 'hh:mm a')}{item.completed && '✓'}
                </Text>

                {item.tags && item.tags.length > 0 && (
                  <View style={styles.subtaskTagsContainer}>
                    {item.tags
                      .filter(tag => tag.trim() !== "")
                      .slice(0, 5) // Display only 5 tags
                      .map((tag, index) => (
                        <View key={index} style={styles.subtaskTag}>
                          <Text style={styles.subtaskTagText}>{tag}</Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="filter" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Sort and Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.backgroundColor }]}>

            {/* Sort by Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, color: currentTheme.textColor, marginRight: 10 }}>Sort by:</Text>
              <Dropdown
                data={[
                  { label: 'Default', value: 'default' },
                  { label: 'Time', value: 'time' },
                  { label: 'Priority', value: 'priority' },
                ]}
                labelField="label"
                valueField="value"
                value={sortBy}
                placeholder="Select sort option"
                onChange={item => setSortBy(item.value)}
                style={{
                  flex: 1,
                  padding: 6,
                  borderWidth: 1,
                  borderRadius: 5,
                  borderColor: currentTheme.textColor,
                  backgroundColor: currentTheme.backgroundColor,
                }}
                placeholderStyle={{ color: currentTheme.textColor }}
                selectedTextStyle={{ color: currentTheme.textColor }}
                iconColor={currentTheme.textColor}
              />
            </View>

            {/* Filter by Section */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 16, color: currentTheme.textColor, marginRight: 10 }}>Filter By:</Text>
              <View style={{ flex: 1 }}>
                <SectionedMultiSelect
                  items={[
                    {
                      name: 'Priority',
                      id: 0,
                      children: [
                        { id: 'High', name: 'High' },
                        { id: 'Medium', name: 'Medium' },
                        { id: 'Low', name: 'Low' },
                      ],
                    },
                    {
                      name: 'Completion Status',
                      id: 2,
                      children: [
                        { id: 'Completed', name: 'Completed' },
                        { id: 'Not Completed', name: 'Not Completed' },
                      ],
                    },
                  ]}
                  IconRenderer={MaterialIcons}
                  uniqueKey="id"
                  subKey="children"
                  selectText="Choose your filters"
                  searchPlaceholderText="Search for filters"
                  showDropDowns={true}
                  readOnlyHeadings={true}
                  onSelectedItemsChange={setFilterCriteria}
                  selectedItems={filterCriteria}
                  showCancelButton={true}
                  showRemoveAll={true}
                  modalWithSafeAreaView={true}
                  colors={{
                    primary: currentTheme.buttonColor,
                    text: lightTheme.textColor,
                    chipColor: lightTheme.textColor,
                    selectToggleTextColor: currentTheme.textColor,
                    success: 'green',
                    cancel: lightTheme.errorColor,
                  }}
                  styles={{
                    selectToggle: {
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 8,
                      marginBottom: 10,
                      backgroundColor: currentTheme.backgroundColor,
                      borderColor: currentTheme.textColor,
                      borderWidth: 1,
                      borderRadius: 5,
                      width: '100%',
                    },
                    selectToggleText: {
                      color: currentTheme.textColor,
                      fontSize: 16,
                    },
                    chipsWrapper: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 5 },
                    chipContainer: {
                      borderColor: currentTheme.textColor,
                      borderWidth: 1,
                      borderRadius: 20,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      margin: 3,
                      backgroundColor: currentTheme.backgroundColor,
                    },
                    chipText: { color: currentTheme.textColor, fontSize: 14 },
                    chipIcon: { color: currentTheme.textColor },
                    selectedItemText: { color: lightTheme.textColor },
                    selectedSubItemText: { color: lightTheme.textColor },
                    itemText: { color: lightTheme.textColor },
                    subItemText: { color: lightTheme.textColor },
                    itemCheckIcon: { color: 'green' },
                    itemIcon: { color: 'black' },
                    confirmText: { color: currentTheme.textColor, fontWeight: 'black' },
                  }}
                />
              </View>
            </View>

            {/* Apply Filters Button */}
            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
              style={[styles.applyButton, { backgroundColor: currentTheme.buttonColor }]}
            >
              <Text style={{ color: currentTheme.buttonText }}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    padding: 10,
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
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderRadius: 5,
  },
  priorityText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  category: {
    fontStyle: 'italic',
    marginBottom: 10,
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
    marginTop: 10,
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

  // Subtask Styles
  subtasksHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  subtasksContainer: {
    flexGrow: 1,
  },
  subtaskCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  subtaskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtaskDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  subtaskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  subtaskTime: {
    fontSize: 12,
  },
  subtaskTagsContainer: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  subtaskTag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 5,
  },
  subtaskTagText: {
    fontSize: 12,
    color: '#333',
  },
  noSubtasksText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  addSubtaskButton: {
    padding: 12,
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
  },
  addSubtaskButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
  },
  applyButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },

  filterButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 30,
    elevation: 5,
  },
});

export default TaskDetailsPage;
