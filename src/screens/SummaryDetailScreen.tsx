import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Summary } from '../types';

const SummaryDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const summary = route.params?.summary as Summary;

  if (!summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Summary not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Header */}
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Ionicons name="list" size={32} color="#007AFF" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryMeta}>
              {summary.wordCount} words • {new Date(summary.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => Alert.alert('Coming Soon', 'Share functionality will be available soon')}
          >
            <Ionicons name="share" size={20} color="white" />
            <Text style={styles.actionButtonText}>Share Summary</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Coming Soon', 'Export functionality will be available soon')}
          >
            <Ionicons name="download" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.contentCard}>
            <Text style={styles.summaryText}>{summary.content}</Text>
          </View>
        </View>

        {/* Key Points */}
        {summary.keyPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Points</Text>
            <View style={styles.keyPointsCard}>
              {summary.keyPoints.map((point, index) => (
                <View key={index} style={styles.keyPointItem}>
                  <View style={styles.keyPointBullet}>
                    <Text style={styles.keyPointNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{summary.wordCount}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{summary.keyPoints.length}</Text>
              <Text style={styles.statLabel}>Key Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {new Date(summary.createdAt).toLocaleDateString()}
              </Text>
              <Text style={styles.statLabel}>Created</Text>
            </View>
          </View>
        </View>

        {/* Summary Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Regenerate functionality will be available soon')}
            >
              <Ionicons name="refresh-outline" size={20} color="#007AFF" />
              <Text style={styles.actionItemText}>Regenerate Summary</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}
            >
              <Ionicons name="create-outline" size={20} color="#34C759" />
              <Text style={styles.actionItemText}>Edit Summary</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Delete functionality will be available soon')}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.actionItemText}>Delete Summary</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  contentCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  keyPointsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  keyPointBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  keyPointNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
});

export default SummaryDetailScreen; 