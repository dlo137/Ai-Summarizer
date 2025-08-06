import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { handlePdfUpload } from '../lib/pdfUploadService';

type RootStackParamList = {
  AddDocument: undefined;
  Summaries: undefined;
};

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [url, setUrl] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [showYoutubeModal, setShowYoutubeModal] = React.useState(false);

  const handleYoutubeUrl = () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }
    // TODO: Handle YouTube URL processing
    console.log('Processing YouTube URL:', youtubeUrl);
    Alert.alert('Success', 'YouTube video added for processing!');
    setYoutubeUrl('');
    setShowYoutubeModal(false);
  };

  const addWebsite = () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // TODO: Validate URL and send to backend
    console.log('Adding website:', url);
    Alert.alert('Success', 'Website added successfully!');
    setUrl('');
  };

  const addUrl = () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // TODO: Validate URL and send to backend
    console.log('Adding URL:', url);
    Alert.alert('Success', 'URL added successfully!');
    setUrl('');
  };

  const pickPDF = async () => {
    try {
      const result = await handlePdfUpload();
      if (result) {
        console.log('Document record created:', {
          id: result.docRow.id,
          publicUrl: result.publicUrl,
          name: result.fileName
        });
        Alert.alert('Success', 'PDF uploaded and saved successfully!');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to process PDF');
      console.error(err);
    }
  };

  const pickVideo = async () => {
    try {
      Alert.alert('Coming Soon', 'Video upload feature is coming soon!');
    } catch (err) {
      Alert.alert('Error', 'Failed to process video');
      console.error(err);
    }
  };

  const pickAudio = async () => {
    try {
      Alert.alert('Coming Soon', 'Audio upload feature is coming soon!');
    } catch (err) {
      Alert.alert('Error', 'Failed to process audio');
      console.error(err);
    }
  };

  const quickActions = [
    {
      title: 'Upload PDF',
      icon: 'document-text',
      onPress: pickPDF,
      color: '#007AFF',
    },
    {
      title: 'YouTube Video',
      icon: 'logo-youtube',
      onPress: () => setShowYoutubeModal(true),
      color: '#FF0000',
    },
    {
      title: 'Summarize Audio',
      icon: 'mic',
      onPress: pickAudio,
      color: '#34C759',
    },
    {
      title: 'Recent Summaries',
      icon: 'time',
      onPress: () => navigation.navigate('Summaries'),
      color: '#AF52DE',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Summarizer</Text>
          <Text style={styles.subtitle}>Transform any content into clear summaries</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { borderLeftColor: action.color }]}
                onPress={action.onPress}
              >
                <Ionicons name={action.icon as any} size={24} color={action.color} />
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* URL Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paste Article Link</Text>
          <View style={styles.urlContainer}>
            <TextInput
              style={styles.urlInput}
              placeholder="Enter article URL..."
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.urlButtons}>
              <TouchableOpacity
                style={[styles.urlButton, styles.websiteButton]}
                onPress={addWebsite}
              >
                <Text style={styles.urlButtonText}>Summarize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.urlButton, styles.linkButton]}
                onPress={addUrl}
              >
                <Text style={styles.urlButtonText}>Preview</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Summaries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Words Saved</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* YouTube URL Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showYoutubeModal}
        onRequestClose={() => setShowYoutubeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter YouTube URL</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Paste YouTube video URL..."
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setYoutubeUrl('');
                  setShowYoutubeModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleYoutubeUrl}
              >
                <Text style={styles.modalButtonText}>Summarize</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#FF0000',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  urlContainer: {
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
  urlInput: {
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  urlButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  urlButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  websiteButton: {
    backgroundColor: '#34C759',
  },
  linkButton: {
    backgroundColor: '#FF9500',
  },
  urlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen; 