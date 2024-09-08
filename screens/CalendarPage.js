import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTasks } from '../context/TasksContext';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';

const CalendarPage = () => {
  const { tasks } = useTasks();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [subtasksMap, setSubtasksMap] = useState({}); // Store subtasks for each task

  useEffect(() => {
    setSelectedDate(currentDate);
  }, []);

  // Fetch subtasks for a specific task
  const fetchSubtasks = (taskId, callback) => {
    const subtasksRef = ref(database, `subtasks/${taskId}`);
    onValue(subtasksRef, (snapshot) => {
      const subtasksData = snapshot.val();
      if (subtasksData) {
        const subtasks = Object.keys(subtasksData).map(subtaskId => ({
          id: subtaskId,
          ...subtasksData[subtaskId],
        }));
        callback(subtasks); // Return subtasks
      } else {
        callback([]); // No subtasks
      }
    });
  };

  // Fetch subtasks for all tasks on the selected date
  useEffect(() => {
    tasks.forEach(task => {
      fetchSubtasks(task.id, (subtasks) => {
        setSubtasksMap(prev => ({ ...prev, [task.id]: subtasks }));
      });
    });
  }, [tasks]);

  // Handle day selection
  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  // Handle month change
  const handleMonthChange = (month) => {
    const day = selectedDate.split('-')[2];
    const newSelectedDate = `${month.year}-${String(month.month).padStart(2, '0')}-${day}`;
    setSelectedDate(newSelectedDate);
  };

  // Handle left and right arrow press
  const handleArrowPress = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    const updatedDate = format(newDate, 'yyyy-MM-dd');
    setSelectedDate(updatedDate);
  };

  const filteredTasks = tasks.filter(task => task.date.startsWith(selectedDate));

  // Getting the marked dates for the dot under the date which represents there are
  // tasks on that specific date
  const getMarkedDates = () => {
    const markedDates = {};

    tasks.forEach(task => {
      const taskDate = task.date.split('T')[0]; // Extract date without time
      markedDates[taskDate] = {
        marked: true,
        dots: [{ color: currentTheme.dotColor }],
        selected: taskDate === selectedDate,
        selectedColor: taskDate === selectedDate ? 'red' : undefined,
        selectedTextColor: taskDate === selectedDate ? 'white' : undefined,
        dotColor: taskDate === selectedDate ? 'white' : currentTheme.dotColor,
      };
    });

    if (!markedDates[selectedDate]) {
      markedDates[selectedDate] = {
        selected: true,
        selectedColor: 'red',
        dotColor: 'white',
      };
    } else {
      markedDates[selectedDate].dotColor = 'white';
    }

    return markedDates;
  };

  // Setting the priority colour
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

  // Checking the subtask status
  const getSubtaskStatus = (subtasks) => {
    if (!subtasks || subtasks.length === 0) {
      return { completed: 0, uncompleted: 0 };
    }
    const completedSubtasks = subtasks.filter(subtask => subtask.completed).length;
    const uncompletedSubtasks = subtasks.length - completedSubtasks;
    return { completed: completedSubtasks, uncompleted: uncompletedSubtasks };
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <Calendar
        key={theme}
        current={selectedDate}
        onDayPress={handleDayPress}
        monthFormat={'MMM yyyy'}
        onMonthChange={handleMonthChange}
        hideArrows={false}
        hideExtraDays={true}
        disableMonthChange={false}
        hideDayNames={false}
        showWeekNumbers={false}
        onPressArrowLeft={(subtractMonth) => {
          subtractMonth();
          handleArrowPress(-1);
        }}
        onPressArrowRight={(addMonth) => {
          addMonth();
          handleArrowPress(1);
        }}
        markedDates={getMarkedDates()}
        markingType={'dot'}
        theme={{
          calendarBackground: currentTheme.backgroundColor,
          textSectionTitleColor: currentTheme.textColor,
          dayTextColor: currentTheme.textColor,
          todayTextColor: 'red',
          selectedDayTextColor: 'white',
          monthTextColor: currentTheme.textColor,
          selectedDayBackgroundColor: 'red',
          arrowColor: currentTheme.textColor,
        }}
        style={{
          backgroundColor: currentTheme.backgroundColor,
        }}
      />
      <Text style={[styles.taskHeader, { color: currentTheme.textColor }]}>
        Tasks on {format(new Date(selectedDate), 'dd MMM yyyy')}
      </Text>
      <FlatList
        data={filteredTasks}
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
                backTitle: 'Calendar',
                source: 'Calendar',
              })
            }
          >
            {/* Title and Priority */}
            <View style={styles.taskHeaderContainer}>
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

            {/* Subtasks */}
            <View style={styles.taskFooter}>
              {subtasksMap[item.id] && subtasksMap[item.id].length > 0 ? (
                <Text style={[styles.subtaskStatus, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                  Subtasks Completed: {getSubtaskStatus(subtasksMap[item.id]).completed} Uncompleted: {getSubtaskStatus(subtasksMap[item.id]).uncompleted} {item.completed && '✓'}
                </Text>
              ) : (
                <Text style={[styles.subtaskStatus, { color: item.completed ? '#999' : currentTheme.textColor, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
                  No Subtasks Created {item.completed && '✓'}
                </Text>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && item.tags.filter(tag => tag.trim() !== "").length > 0 && (
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
        ListEmptyComponent={<Text style={{ color: currentTheme.textColor }}>No tasks for this date</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  taskHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
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
  taskHeaderContainer: {
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
    marginBottom: 1,
  },
  taskTime: {
    fontSize: 12,
    marginBottom: 1,
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
  subtaskStatus: {
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1,
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
    marginTop: 5,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },
});

export default CalendarPage;
