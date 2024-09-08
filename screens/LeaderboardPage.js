import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, StyleSheet } from 'react-native';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { database } from '../firebaseConfig';
import { useTheme } from '../context/ThemeContext';
import { lightTheme, darkTheme } from '../theme';
import { auth } from '../firebaseConfig';

const LeaderboardPage = () => {
  const { theme } = useTheme();
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Fetching the current leaderboard standings
  const fetchLeaderboard = () => {
    const leaderboardRef = query(ref(database, 'leaderboard'), orderByChild('points'));

    onValue(leaderboardRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sortedLeaderboard = Object.entries(data)
          .map(([userId, userData]) => ({ userId, ...userData }))
          .sort((a, b) => b.points - a.points); // Sort in descending order by points

        setLeaderboard(sortedLeaderboard.slice(0, 10)); // Limit to top 10

        // Find current user's rank and points
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userEntry = sortedLeaderboard.find((entry) => entry.userId === currentUser.uid);
          if (userEntry) {
            const userIndex = sortedLeaderboard.indexOf(userEntry);
            setUserRank(userIndex + 1); // Rank is index + 1
            setUserPoints(userEntry.points);
          }
        }
      }
    });
  };

  return (
    <SafeAreaView style={[styles.safeContainer, { backgroundColor: currentTheme.backgroundColor }]}>
      <Text style={[styles.headerText, { color: currentTheme.textColor }]}>Top 10 Point Holders!</Text>
      <View style={styles.container}>
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.userId}
          renderItem={({ item, index }) => (
            <View style={[styles.card, { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }]}>
              <View style={styles.itemContent}>
                <Text style={[styles.rank, { color: currentTheme.textColor }]}>{index + 1}</Text>
                <View style={styles.itemTextContainer}>
                  <Text style={[styles.itemName, { color: currentTheme.textColor }]}>{item.name}</Text>
                  <Text style={[styles.itemPoints, { color: currentTheme.textColor }]}>{item.points} points</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>No data available</Text>
          }
          contentContainerStyle={{ paddingBottom: 100 }} // Adds extra space at the bottom for the user's rank container
        />
        {userRank !== null && (
          <View style={[styles.card, styles.userRankContainer, { backgroundColor: currentTheme.taskContainerBackground, borderColor: currentTheme.cardBorderColor }]}>
            <Text style={[styles.rank, { color: currentTheme.textColor }]}>Your Rank: {userRank}</Text>
            <Text style={[styles.userPoints, { color: currentTheme.textColor }]}>Your Points: {userPoints}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemPoints: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  userRankContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  userPoints: {
    fontSize: 16,
    marginTop: 5,
  },
});

export default LeaderboardPage;
