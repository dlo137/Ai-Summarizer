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
import { Document } from '../types';
import { getUserDocuments, subscribeToUserDocuments, DocumentRow } from '../lib/documentService';

type RootStackParamList = {
  Home: undefined;
  Documents: undefined;
  AddDocument: undefined;
  DocumentDetail: { document: Document };
};

// Move getDocumentIcon above DocumentsScreen so it is in scope
const getDocumentIcon = (type: DocumentRow['document_type']) => {
  switch (type) {
    case 'pdf':
      return 'document-text';
    case 'article':
      return 'globe';
    case 'youtube':
      return 'logo-youtube';
    case 'audio':
      return 'musical-notes';
    default:
      return 'document';
  }
};

const getDocumentColor = (type: DocumentRow['document_type']) => {
  switch (type) {
    case 'pdf':
      return '#007AFF';
    case 'article':
      return '#34C759';
    case 'youtube':
      return '#FF0000';
    case 'audio':
      return '#AF52DE';
    default:
      return '#666';
  }
};

const getStatusColor = (status: DocumentRow['status']) => {
  switch (status) {
    case 'pending':
      return '#FF9500';
    case 'text_extracted':
      return '#007AFF';
    case 'summarized':
      return '#34C759';
    default:
      return '#666';
  }
};

const DocumentsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch documents on component mount and when screen comes into focus
  const fetchDocuments = async () => {
    try {
      const userDocuments = await getUserDocuments();
      setDocuments(userDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscribeToUserDocuments((updatedDocuments) => {
      setDocuments(updatedDocuments);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch documents when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchDocuments();
    }, [])
  );

  // Pull to refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.document_type === 'article' && doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add: Convert past article links to clickable links in the document list
  const renderDocument = ({ item }: { item: DocumentRow }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => {
        // Convert DocumentRow to Document type for navigation
        const document: Document = {
          id: item.id || '',
          title: item.title,
          type: item.document_type === 'article' ? 'website' : 
                item.document_type === 'youtube' ? 'url' : 
                item.document_type === 'audio' ? 'text' : 'pdf',
          content: item.summary,
          url: item.content,
          createdAt: new Date(item.created_at || ''),
          updatedAt: new Date(item.updated_at || ''),
        };
        navigation.navigate('DocumentDetail', { document });
      }}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentIcon}>
          <Ionicons 
            name={getDocumentIcon(item.document_type) as any} 
            size={24} 
            color={getDocumentColor(item.document_type)} 
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.documentMeta}>
            <Text style={styles.documentType}>{item.document_type.toUpperCase()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
      <View style={styles.documentFooter}>
        <Text style={styles.documentDate}>
          {new Date(item.created_at || '').toLocaleDateString()}
        </Text>
        {item.document_type === 'article' && item.content && (
          <Text
            style={[styles.documentUrl, { textDecorationLine: 'underline' }]}
            numberOfLines={1}
            onPress={() => {
              // Open the article link in browser
              if (item.content.startsWith('http')) {
                // @ts-ignore
                window.open(item.content, '_blank');
              }
            }}
          >
            {item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
          </Text>
        )}
        {item.document_type !== 'article' && item.content && (
          <Text style={styles.documentUrl} numberOfLines={1}>
            {item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {loading ? 'Loading Documents...' : 'No Documents Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {loading 
          ? 'Please wait while we fetch your documents'
          : 'Start by adding your first document to get summarized'
        }
      </Text>
      {!loading && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDocument')}
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
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity
          style={styles.addIcon}
          onPress={() => navigation.navigate('AddDocument')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Documents List */}
      <FlatList
        data={filteredDocuments}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id || item.title}
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
  addIcon: {
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
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  documentFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 12,
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  documentUrl: {
    fontSize: 12,
    color: '#007AFF',
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

export default DocumentsScreen;