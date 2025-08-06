import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { testSummariesTable } from '../lib/summaryService';

// Temporary debug component - add this to any screen to test database
export const SummaryDebugButton = () => {
  const handleTest = async () => {
    await testSummariesTable();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleTest}>
        <Text style={styles.text}>Test Summaries DB</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  text: {
    color: 'white',
    textAlign: 'center',
  },
});
