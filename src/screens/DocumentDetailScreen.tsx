import React, { useState } from 'react';
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
import { Document } from '../types';

const DocumentDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const document = (route.params as any)?.document as Document;
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    // TODO: Call API to generate summary
    setTimeout(() => {
      setIsGeneratingSummary(false);
      Alert.alert('Success', 'Summary generated successfully!');
    }, 2000);
  };

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return 'document-text';
      case 'website':
        return 'globe';
      case 'url':
        return 'link';
      case 'text':
        return 'text';
      default:
        return 'document';
    }
  };

  const getDocumentColor = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return '#007AFF';
      case 'website':
        return '#34C759';
      case 'url':
        return '#FF9500';
      case 'text':
        return '#AF52DE';
      default:
        return '#666';
    }
  };

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Document not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Document Header */}
        <View style={styles.documentHeader}>
          <View style={[styles.documentIcon, { backgroundColor: getDocumentColor(document.type) + '20' }]}>
            <Ionicons 
              name={getDocumentIcon(document.type) as any} 
              size={32} 
              color={getDocumentColor(document.type)} 
            />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{document.title}</Text>
            <Text style={styles.documentType}>{document.type.toUpperCase()}</Text>
            <Text style={styles.documentDate}>
              Added on {new Date(document.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={generateSummary}
            disabled={isGeneratingSummary}
          >
            <Ionicons name="create" size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {isGeneratingSummary ? 'Generating...' : 'Generate Summary'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Coming Soon', 'Share functionality will be available soon')}
          >
            <Ionicons name="share" size={20} color="#007AFF" />
            <Text style={[styles.actionButtonText, { color: '#007AFF' }]}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Document Content Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Content Preview</Text>
          <View style={styles.contentCard}>
            {document.type === 'url' && document.url?.includes('youtube.com') ? (
              <View>
                <View style={styles.videoContainer}>
                  <TouchableOpacity 
                    style={styles.videoPreview}
                    onPress={() => {
                      // Open video in browser or native YouTube app
                      if (document.url) {
                        // @ts-ignore
                        window.open(document.url, '_blank');
                      }
                    }}
                  >
                    <Ionicons name="logo-youtube" size={48} color="#FF0000" />
                    <Text style={styles.videoPlayText}>Click to watch video</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.documentUrl} numberOfLines={1}>
                  {document.url}
                </Text>
              </View>
            ) : (
              <>
                {document.content ? (
                  <Text style={styles.contentText} numberOfLines={10}>
                    {document.content}
                  </Text>
                ) : (
                  <Text style={styles.noContentText}>No content preview available</Text>
                )}
                {document.url && document.type !== 'url' && (
                  <Text style={styles.documentUrl} numberOfLines={1}>
                    {document.url}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.noSummaryText}>
              No summary generated yet. Tap "Generate Summary" to create one.
            </Text>
          </View>
        </View>

        {/* Document Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be available soon')}
            >
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.actionItemText}>Edit Document</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Download functionality will be available soon')}
            >
              <Ionicons name="download-outline" size={20} color="#34C759" />
              <Text style={styles.actionItemText}>Download</Text>
              <Ionicons name="chevron-forward" size={16} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => Alert.alert('Coming Soon', 'Delete functionality will be available soon')}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.actionItemText}>Delete</Text>
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
  videoContainer: {
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  videoPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    opacity: 0.8,
  },
  videoPlayText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
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
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  documentIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  documentType: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    color: '#999',
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
  contentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  noContentText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  documentUrl: {
    fontSize: 12,
    color: '#007AFF',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  summaryCard: {
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
  noSummaryText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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

export default DocumentDetailScreen; 