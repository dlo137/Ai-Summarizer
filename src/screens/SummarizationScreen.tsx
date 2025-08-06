import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { saveSummaryRecord } from '../lib/summaryService';
import { updateDocumentStatus } from '../lib/documentService';

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
  
  const [summary, setSummary] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Function to summarize text using OpenAI API
  const summarizeText = async (text: string) => {
    try {
      console.log('📤 Sending text to OpenAI API, length:', text.length);
      
      const res = await fetch('https://ai-summarizer-drab-nu.vercel.app/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      console.log('📥 API Response status:', res.status);
      
      if (!res.ok) {
        // Try to get the error details from the response
        let errorDetails = '';
        try {
          const errorData = await res.json();
          errorDetails = errorData.error || 'Unknown error';
          console.log('❌ API Error details:', errorData);
        } catch (e) {
          console.log('❌ Could not parse error response');
        }
        throw new Error(`HTTP error! status: ${res.status}, details: ${errorDetails}`);
      }
      
      const data = await res.json();
      console.log('✅ API Response received:', data);
      return data.summary;
    } catch (err) {
      console.error('❌ Error summarizing:', err);
      return null;
    }
  };

  // Function to extract text from PDF URL (placeholder)
  const extractTextFromPDF = async (pdfUrl: string): Promise<string> => {
    // For now, return shorter sample text to avoid token limits
    const sampleText = `This is a sample document titled "${fileName}". 

The document discusses important concepts and methodologies. It covers various aspects of the subject matter, providing detailed explanations and examples. The content includes theoretical frameworks, practical applications, and case studies that demonstrate the effectiveness of the proposed approaches.

Key findings indicate that the methods described are highly effective and can be applied across different scenarios. The research methodology employed was rigorous and comprehensive, ensuring reliable and valid results.

The conclusion emphasizes the significance of the findings and suggests areas for future research and development.`;
    
    console.log('📄 Extracted text preview:', sampleText.substring(0, 100) + '...');
    console.log('📄 Total text length:', sampleText.length);
    
    return sampleText;
  };

  // Function to extract key points from summary
  const extractKeyPoints = (summaryText: string): string[] => {
    // Simple key point extraction - in production you might use more sophisticated methods
    const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.slice(0, 3).map(s => s.trim());
  };

  // Process the document when component mounts
  useEffect(() => {
    const processDocument = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        console.log('🚀 Starting document processing...');
        
        // Step 1: Extract text from PDF
        const extractedText = await extractTextFromPDF(publicUrl);
        
        if (!extractedText) {
          throw new Error('Failed to extract text from PDF');
        }

        console.log('✅ Text extraction completed');

        // Step 2: Summarize the text
        const summaryResult = await summarizeText(extractedText);
        
        if (!summaryResult) {
          throw new Error('Failed to generate summary. This might be due to:\n- OpenAI API key issues\n- Network connectivity\n- Server configuration\n\nPlease check your Vercel logs for more details.');
        }

        console.log('✅ Summarization completed');

        // Step 3: Extract key points
        const points = extractKeyPoints(summaryResult);
        
        // Step 4: Save summary to database
        try {
          console.log('💾 Saving summary to database for document:', documentId);
          await saveSummaryRecord(documentId, summaryResult, points);
          console.log('✅ Summary saved successfully');
          
          // Update document status to 'summarized'
          console.log('📝 Updating document status...');
          await updateDocumentStatus(documentId, 'summarized', summaryResult);
          console.log('✅ Document status updated');
        } catch (saveError) {
          console.error('⚠️ Failed to save summary:', saveError);
          console.error('Save error details:', {
            documentId,
            summaryLength: summaryResult.length,
            keyPointsCount: points.length,
            error: saveError
          });
          // Don't throw error here - we still want to show the summary even if save fails
        }
        
        // Update state
        setSummary(summaryResult);
        setKeyPoints(points);
        
        console.log('✅ Processing completed successfully');
        
      } catch (error) {
        console.error('❌ Error processing document:', error);
        setHasError(true);
        Alert.alert(
          'Processing Error',
          error instanceof Error ? error.message : 'Failed to process the document. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };

    processDocument();
  }, [documentId, publicUrl, fileName]);

  const handleRetry = () => {
    // Retry processing
    const processDocument = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const extractedText = await extractTextFromPDF(publicUrl);
        const summaryResult = await summarizeText(extractedText);
        const points = extractKeyPoints(summaryResult || '');
        
        // Save summary to database
        if (summaryResult) {
          try {
            await saveSummaryRecord(documentId, summaryResult, points);
            await updateDocumentStatus(documentId, 'summarized', summaryResult);
            console.log('✅ Summary saved successfully on retry');
          } catch (saveError) {
            console.error('⚠️ Failed to save summary on retry:', saveError);
          }
        }
        
        setSummary(summaryResult || '');
        setKeyPoints(points);
        
      } catch (error) {
        console.error('Error processing document:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    processDocument();
  };

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

        {/* Summary Content */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Generating summary...</Text>
            </View>
          ) : hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={32} color="#FF3B30" />
              <Text style={styles.errorText}>Failed to generate summary</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Summary will appear here once processing is complete.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Key Points</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Extracting key points...</Text>
            </View>
          ) : hasError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Key points unavailable</Text>
            </View>
          ) : keyPoints.length > 0 ? (
            <View style={styles.keyPointsContainer}>
              {keyPoints.map((point, index) => (
                <View key={index} style={styles.keyPointItem}>
                  <View style={styles.keyPointBullet} />
                  <Text style={styles.keyPointText}>{point}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>
                Key points will be extracted from the summary.
              </Text>
            </View>
          )}
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
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
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
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
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
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
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
  summaryText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
  },
  placeholderContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
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
  keyPointsContainer: {
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
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 8,
    marginRight: 12,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
});

export default SummarizationScreen;
