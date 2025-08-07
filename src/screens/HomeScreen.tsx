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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { handlePdfUpload } from '../lib/pdfUploadService';
import DocumentPicker from 'react-native-document-picker';
import { supabase } from '../lib/supabase';

type RootStackParamList = {
  HomeScreen: undefined;
  AddDocument: undefined;
  Subscription: undefined;
  Summarization: {
    documentId: string;
    fileName: string;
    publicUrl: string;
  };
};

const HomeScreen = () => {
  // Simulate conversion for YouTube videos (reuse PDF logic)
  const simulateYoutubeConversion = (videoData: { title: string; url: string; transcript: string }) => {
    setShowPdfModal(true);
    setPdfProgress(0);
    progressAnim.setValue(0);

    const duration = 3000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setPdfProgress(Math.round(progress));
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: interval,
        useNativeDriver: false,
      }).start();

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setShowPdfModal(false);
          setPdfProgress(0);
          progressAnim.setValue(0);
          // Navigate to Summarization screen or show transcript
          navigation.navigate('Summarization', {
            documentId: '',
            fileName: videoData.title,
            publicUrl: videoData.url,
            // Optionally pass transcript if Summarization screen supports it
          });
        }, 500);
      }
    }, interval);
  };
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [url, setUrl] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [showYoutubeModal, setShowYoutubeModal] = React.useState(false);
  const [showPdfModal, setShowPdfModal] = React.useState(false);
  const [pdfProgress, setPdfProgress] = React.useState(0);
  const [currentDocument, setCurrentDocument] = React.useState<{
    id: string;
    fileName: string;
    publicUrl: string;
  } | null>(null);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const handleYoutubeUrl = async () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid YouTube URL');
      return;
    }
    try {
      // POST to backend API (Vercel production endpoint)
      const response = await fetch('https://ai-summarizer-drab-nu.vercel.app/api/youtube-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: youtubeUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract transcript');
      }
      // Simulate conversion animation for YouTube video
      simulateYoutubeConversion({ title: data.title, url: youtubeUrl, transcript: data.transcript });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to extract transcript');
      console.error('YouTube transcript error:', err);
    } finally {
      setYoutubeUrl('');
      setShowYoutubeModal(false);
    }
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

  const simulatePdfConversion = (documentData?: {
    id: string;
    fileName: string;
    publicUrl: string;
  }) => {
    setShowPdfModal(true);
    setPdfProgress(0);
    progressAnim.setValue(0);

    // Simulate progress over 3 seconds
    const duration = 3000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = (currentStep / steps) * 100;
      setPdfProgress(Math.round(progress));
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: interval,
        useNativeDriver: false,
      }).start();

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setShowPdfModal(false);
          setPdfProgress(0);
          progressAnim.setValue(0);
          
          // Navigate to Summarization screen if we have document data
          const docToUse = documentData || currentDocument;
          if (docToUse) {
            console.log('Navigating to Summarization with:', docToUse);
            navigation.navigate('Summarization', {
              documentId: docToUse.id,
              fileName: docToUse.fileName,
              publicUrl: docToUse.publicUrl,
            });
          } else {
            console.warn('No current document data available for navigation');
          }
        }, 500); // Increased delay to ensure modal closes properly
      }
    }, interval);
  };

  const pickPDF = async () => {
    try {
      console.log('Starting PDF picker...');
      // First, let user select the PDF file
      const result = await handlePdfUpload();
      
      if (result) {
        // File selected successfully, store document data
        const documentData = {
          id: result.docRow.id || '',
          fileName: result.fileName,
          publicUrl: result.publicUrl,
        };
        
        setCurrentDocument(documentData);
        
        console.log('Document record created:', {
          id: result.docRow.id,
          publicUrl: result.publicUrl,
          name: result.fileName
        });
        
        console.log('Current document set to:', documentData);
        
        // Start the visual conversion process after file selection
        simulatePdfConversion(documentData);
      } else {
        console.warn('PDF upload result was null or undefined');
      }
    } catch (err) {
      setShowPdfModal(false);
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to process PDF');
      console.error('PDF upload error:', err);
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
      // 1. Pick audio file
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.audio],
      });

      // 2. Upload to Supabase Storage
      const file = res;

      // Defensive: file.name and file.type may be null
      if (!file.name || !file.type) {
        throw new Error('Invalid file: missing name or type');
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExt}`;

      // Fetch the file as a blob (React Native workaround)
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data, error } = await supabase
        .storage
        .from('audio-uploads')
        .upload(fileName, blob, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      // 3. Get public URL
      const { data: urlData } = supabase
        .storage
        .from('audio-uploads')
        .getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get public URL');

      // 4. Invoke your Vercel transcription endpoint
      const resp = await fetch('https://<your-vercel-domain>/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: publicUrl }),
      });

      const { transcript } = await resp.json();
      if (!transcript) throw new Error('No transcript returned');

      // 5. Navigate to your Summarization screen (pass transcript as fileName for now)
      navigation.navigate('Summarization', {
        documentId: '',
        fileName: 'Audio Transcript',
        publicUrl: publicUrl,
        // Optionally, you can pass transcript via context or another param if needed
      });

    } catch (err: any) {
      console.error('Audio pick/upload/transcribe error:', err);
      Alert.alert('Failed to process audio', err.message);
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
      onPress: () => navigation.getParent()?.navigate('Summaries'),
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

      {/* PDF Progress Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPdfModal}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.progressHeader}>
              <Ionicons name="document-text" size={32} color="#007AFF" />
              <Text style={styles.modalTitle}>Processing PDF</Text>
            </View>
            <Text style={styles.progressSubtitle}>Converting your document...</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{pdfProgress}%</Text>
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
  progressHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  progressSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default HomeScreen; 