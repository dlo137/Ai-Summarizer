import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Summary } from '../types';
import { getUserSummaries, subscribeToUserSummaries, SummaryRow } from '../lib/summaryService';

type RootStackParamList = {
  Home: undefined;
  Summaries: undefined;
  Summarization: { 
    documentId: string;
    fileName: string;
    publicUrl?: string;
    summary?: Summary;
  };
};

const SummariesScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [summaries, setSummaries] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch summaries on component mount and when screen comes into focus
  const fetchSummaries = async () => {
    try {
      const userSummaries = await getUserSummaries();
      setSummaries(userSummaries);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      Alert.alert('Error', 'Failed to load summaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscribeToUserSummaries((updatedSummaries) => {
      setSummaries(updatedSummaries);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch summaries when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchSummaries();
    }, [])
  );

  // Pull to refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummaries();
    setRefreshing(false);
  };

  // Filter summaries based on search query
  const filteredSummaries = summaries.filter((summary) =>
    summary.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (summary.documents?.title && summary.documents.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderSummary = ({ item }: { item: SummaryRow }) => {
    // Convert SummaryRow to Summary type for navigation
    const summary: Summary = {
      id: item.id || '',
      documentId: item.document_id,
      content: item.content,
      keyPoints: item.key_points || [],
      wordCount: item.word_count || 0,
      createdAt: new Date(item.created_at || ''),
      updatedAt: new Date(item.updated_at || ''),
      documentTitle: item.documents?.title,
      documentType: item.documents?.document_type,
    };

    return (
      <TouchableOpacity
        style={styles.summaryCard}
        onPress={() => navigation.navigate('Summarization', { 
          documentId: summary.documentId,
          fileName: summary.documentTitle || 'Summary',
          publicUrl: '',
          summary: summary
        })}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryIcon}>
            <Ionicons name="list" size={24} color="#007AFF" />
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {summary.documentTitle || 'Summary'}
            </Text>
            <Text style={styles.summaryMeta}>
              {summary.wordCount > 0 ? `${summary.wordCount} words • ` : ''}{new Date(summary.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>
        <Text style={styles.summaryPreview} numberOfLines={3}>
          {summary.content}
        </Text>
        {summary.keyPoints.length > 0 && (
          <View style={styles.keyPoints}>
            <Text style={styles.keyPointsTitle}>Key Points:</Text>
            {summary.keyPoints.slice(0, 2).map((point, index) => (
              <Text key={index} style={styles.keyPoint} numberOfLines={1}>
                • {point}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {loading ? 'Loading Summaries...' : 'No Summaries Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {loading 
          ? 'Please wait while we fetch your summaries'
          : 'Create your first summary by adding a document'
        }
      </Text>
      {!loading && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.getParent()?.navigate('Documents')}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Summaries</Text>
        <TouchableOpacity style={styles.filterIcon}>
          <Ionicons name="filter" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search summaries..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Summaries List */}
      <FlatList
        data={filteredSummaries}
        renderItem={renderSummary}
        keyExtractor={(item) => item.id || item.document_id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterIcon: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#666',
  },
  summaryPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  keyPoints: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  keyPointsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  keyPoint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default SummariesScreen; 