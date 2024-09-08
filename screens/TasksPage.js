import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTasks } from '../context/TasksContext';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SectionedMultiSelect from 'react-native-sectioned-multi-select';

const TasksPage = () => {
  const { tasks } = useTasks();
  const [subtasksMap, setSubtasksMap] = useState({});
  const navigation = useNavigation();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  const [sortBy, setSortBy] = useState('default');
  const [filterCriteria, setFilterCriteria] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const today = new Date();
  const todayTasks = tasks.filter(task => new Date(task.date).toDateString() === today.toDateString());

  // Navigate to addedittask with mode edit
  const navigateToAddTask = () => {
    navigation.navigate('AddEditTask', {
      mode: 'add',
    });
  };

  useEffect(() => {
    tasks.forEach(task => {
      fetchSubtasks(task.id, (subtasks) => {
        setSubtasksMap(prev => ({ ...prev, [task.id]: subtasks }));
      });
    });
  }, [tasks]);

  // Getting the sub tasks status
  const getSubtaskStatus = (subtasks) => {
    if (!subtasks || subtasks.length === 0) {
      return { completed: 0, uncompleted: 0 };
    }
    const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
    const uncompletedSubtasks = subtasks.length - completedSubtasks;
    return { completed: completedSubtasks, uncompleted: uncompletedSubtasks };
  };

  // Fetching subtasks
  const fetchSubtasks = (taskId, callback) => {
    const subtasksRef = ref(database, `subtasks/${taskId}`);
    onValue(subtasksRef, (snapshot) => {
      const subtasksData = snapshot.val();
      if (subtasksData) {
        const subtasks = Object.keys(subtasksData).map(subtaskId => ({
          id: subtaskId,
          ...subtasksData[subtaskId],
        }));
        callback(subtasks); // Pass the subtasks to the callback function
      } else {
        callback([]); // Return empty array if there are no subtasks
      }
    });
  };

  // Setting the Priority Colour
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return '#FF4500';
      case 'Medium':
        return '#FFA500';
      case 'Low':
        return '#006400';
      default:
        return currentTheme.textColor;
    }
  };

  // Sorting the tasks
  const sortTasks = (tasksToSort) => {
    const sortedTasks = [...tasksToSort];

    switch (sortBy) {
      case 'time':
        sortedTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'priority':
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      default:
        break;
    }

    return sortedTasks;
  };

  // Filtering the tasks
  const filterTasks = (tasksToFilter) => {
    if (filterCriteria.length === 0) {
      return tasksToFilter;
    }

    return tasksToFilter.filter(task => {
      let matches = true;

      filterCriteria.forEach(criteria => {
        if (criteria === 'Completed' && !task.completed) matches = false;
        if (criteria === 'Not Completed' && task.completed) matches = false;
        if (['High', 'Medium', 'Low'].includes(criteria) && task.priority !== criteria) matches = false;
        if (['Work', 'Personal'].includes(criteria) && task.category !== criteria) matches = false;
      });

      return matches;
    });
  };


  const filteredAndSortedTasks = sortTasks(filterTasks(todayTasks));

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.title, { color: currentTheme.textColor }]}>
        Tasks Today ({format(today, 'd MMM yyyy')})
      </Text>

      {/* Buttons Container */}
      <View style={styles.buttonsContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: pressed ? '#d0d0d0' : currentTheme.buttonColor },
          ]}
          onPress={navigateToAddTask}
        >
          <Text style={[styles.addButtonText, { color: currentTheme.buttonText }]}>Add Task</Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredAndSortedTasks}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
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
              navigation.navigate('TaskDetails', {
                taskId: item.id,
                backTitle: 'Tasks',
                source: 'Tasks',
              })
            }
          >
            {/* Title and Priority */}
            <View style={styles.taskHeader}>
              <Text style={[styles.taskTitle, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                {item.title} {item.completed && '✓'}
              </Text>
              {item.priority && (
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={[styles.taskDescription, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
              {item.description} {item.completed && '✓'}
            </Text>

            {/* Time Display */}
            <Text style={[styles.taskTime, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
              {format(new Date(item.date), 'hh:mm a')} {item.completed && '✓'}
            </Text>

            {/* Category */}
            <Text style={[styles.categoryLabel, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
              {item.category} {item.completed && '✓'}
            </Text>

            {/* Subtasks and Tags inside taskFooter */}
            <View style={styles.taskFooter}>
              {subtasksMap[item.id] && subtasksMap[item.id].length > 0 ? (
                <Text style={[styles.subtaskStatus, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                  Subtasks Completed: {getSubtaskStatus(subtasksMap[item.id]).completed} Incompleted: {getSubtaskStatus(subtasksMap[item.id]).uncompleted} {item.completed && '✓'}
                </Text>
              ) : (
                <Text style={[styles.subtaskStatus, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                  No Subtasks Created {item.completed && '✓'}
                </Text>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags
                    .filter(tag => tag.trim() !== "")
                    .slice(0, 5)
                    .map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                </View>
              )}
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Floating Button for Filter and Sort Modal */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="filter" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Filter and Sort Modal */}
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
                      name: 'Category',
                      id: 1,
                      children: [
                        { id: 'Work', name: 'Work' },
                        { id: 'Personal', name: 'Personal' },
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
                  selectText="Choose your fields"
                  searchPlaceholderText="Search for your fields"
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subtaskStatus: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  addButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 3,
  },
  taskTime: {
    fontSize: 12,
    marginBottom: 3,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1,
  },
  categoryLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginTop: 1,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
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
});

export default TasksPage;
