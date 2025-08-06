import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  HomeScreen: undefined;
  Summarization: {
    documentId: string;
    fileName: string;
    publicUrl: string;
  };
  Summaries: undefined;
};

type SummarizationScreenRouteProp = RouteProp<RootStackParamList, 'Summarization'>;
type SummarizationScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SummarizationScreen = () => {
  const navigation = useNavigation<SummarizationScreenNavigationProp>();
  const route = useRoute<SummarizationScreenRouteProp>();
  
  const { documentId, fileName, publicUrl } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleViewSummaries = () => {
    // Navigate to the Summaries tab
    navigation.getParent()?.navigate('Summaries');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Document Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Info */}
        <View style={styles.documentInfo}>
          <View style={styles.documentIcon}>
            <Ionicons name="document-text" size={32} color="#007AFF" />
          </View>
          <View style={styles.documentDetails}>
            <Text style={styles.documentTitle} numberOfLines={2}>
              {fileName}
            </Text>
            <Text style={styles.documentId}>ID: {documentId}</Text>
          </View>
        </View>

        {/* Placeholder Content */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Summary will appear here once OpenAI integration is connected.
            </Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Key Points</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Key points will be extracted and displayed here.
            </Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>File Name:</Text>
              <Text style={styles.detailValue}>{fileName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Document ID:</Text>
              <Text style={styles.detailValue}>{documentId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>Ready for Summarization</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackPress}>
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleViewSummaries}>
          <Text style={styles.primaryButtonText}>View All Summaries</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  scrollContent: {
    padding: 20,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  documentDetails: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  documentId: {
    fontSize: 12,
    color: '#666',
  },
  contentSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SummarizationScreen;
