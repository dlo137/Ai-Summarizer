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
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { saveSummaryRecord } from '../lib/summaryService';
import { updateDocumentStatus } from '../lib/documentService';
import { Summary } from '../types';

type RootStackParamList = {
  HomeScreen: undefined;
  Summarization: {
    documentId: string;
    fileName: string;
    publicUrl?: string;
    summary?: Summary;
  };
  Summaries: undefined;
};

type SummarizationScreenRouteProp = RouteProp<RootStackParamList, 'Summarization'>;
type SummarizationScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const SummarizationScreen = () => {
  const navigation = useNavigation<SummarizationScreenNavigationProp>();
  const route = useRoute<SummarizationScreenRouteProp>();
  
  const { documentId, fileName, publicUrl, summary: existingSummary } = route.params;
  
  const [summary, setSummary] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState<'Summary' | 'PDF' | 'Chat'>('Summary');
  const [chatInput, setChatInput] = useState('');
  const [structuredSummary, setStructuredSummary] = useState<{
    overview: string[];
    sections: { title: string; bullets: string[] }[];
    chatOptions: string[];
  } | null>(null);

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

  // Function to parse summary into structured format
  const parseStructuredSummary = (summaryText: string) => {
    // Mock structured data - in production, you'd enhance the AI to return structured data
    const overview = [
      "This document outlines the key responsibilities and requirements for an office automation clerk role.",
      "The position involves managing digital documents, data entry, and administrative support tasks.",
      "Strong computer skills and attention to detail are essential for success in this role."
    ];

    const sections = [
      {
        title: "Position Purpose and Scope",
        bullets: [
          "Perform data entry and document management tasks using office automation software",
          "Support various departments with administrative and clerical functions",
          "Maintain accurate records and ensure data integrity across systems"
        ]
      },
      {
        title: "Key Responsibilities",
        bullets: [
          "Process and organize digital documents and files",
          "Enter data into databases and spreadsheet applications",
          "Generate reports and correspondence using word processing software",
          "Maintain filing systems and document version control"
        ]
      },
      {
        title: "Required Qualifications",
        bullets: [
          "High school diploma or equivalent required",
          "Proficiency in Microsoft Office Suite (Word, Excel, PowerPoint)",
          "Strong typing skills with accuracy and speed",
          "Excellent organizational and time management abilities"
        ]
      }
    ];

    const chatOptions = [
      "Key points in the document",
      "Main responsibilities",
      "Draft a job application email"
    ];

    return { overview, sections, chatOptions };
  };

  // Process the document when component mounts
  useEffect(() => {
    // If we have an existing summary, just display it
    if (existingSummary) {
      setSummary(existingSummary.content);
      setKeyPoints(existingSummary.keyPoints);
      
      // Set structured summary from existing data or parse it
      if (existingSummary.overview && existingSummary.sections) {
        setStructuredSummary({
          overview: existingSummary.overview,
          sections: existingSummary.sections,
          chatOptions: existingSummary.chatOptions || ["Key points in the document", "Main responsibilities", "Draft a job application email"]
        });
      } else {
        // Parse the existing summary into structured format
        const structured = parseStructuredSummary(existingSummary.content);
        setStructuredSummary(structured);
      }
      return;
    }

    // If we don't have an existing summary, process the document
    if (!publicUrl) {
      setHasError(true);
      Alert.alert(
        'Error',
        'Document URL is missing. Cannot process the document.',
        [{ text: 'OK' }]
      );
      return;
    }

    const processDocument = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        console.log('🚀 Starting document processing...');
        
        // Step 1: Extract text from PDF
        const extractedText = await extractTextFromPDF(publicUrl!);
        
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

        // Step 3: Extract key points and parse structured summary
        const points = extractKeyPoints(summaryResult);
        const structured = parseStructuredSummary(summaryResult);
        
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
        setStructuredSummary(structured);
        
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
  }, [documentId, publicUrl, fileName, existingSummary]);

  const handleRetry = () => {
    // Check if we have publicUrl before retrying
    if (!publicUrl) {
      Alert.alert(
        'Error',
        'Document URL is missing. Cannot retry processing.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Retry processing
    const processDocument = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        const extractedText = await extractTextFromPDF(publicUrl!);
        const summaryResult = await summarizeText(extractedText);
        const points = extractKeyPoints(summaryResult || '');
        const structured = parseStructuredSummary(summaryResult || '');
        
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
        setStructuredSummary(structured);
        
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Summary':
        return renderSummaryTab();
      case 'PDF':
        return renderPDFTab();
      case 'Chat':
        return renderChatTab();
      default:
        return renderSummaryTab();
    }
  };

  const renderSummaryTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Generating summary...</Text>
        </View>
      );
    }

    if (hasError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={32} color="#FF3B30" />
          <Text style={styles.errorText}>Failed to generate summary</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!structuredSummary) {
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Summary will appear here once processing is complete.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.summaryContent} showsVerticalScrollIndicator={false}>
        {/* Overview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Overview</Text>
          {structuredSummary.overview.map((bullet, index) => (
            <View key={index} style={styles.bulletPoint}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>

        {/* Dynamic Sections */}
        {structuredSummary.sections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.bullets.map((bullet, bulletIndex) => (
              <View key={bulletIndex} style={styles.bulletPoint}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderPDFTab = () => {
    return (
      <View style={styles.pdfContainer}>
        <View style={styles.pdfPlaceholder}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.pdfPlaceholderText}>PDF Viewer</Text>
          <Text style={styles.pdfSubtext}>
            PDF rendering will be implemented here
          </Text>
        </View>
      </View>
    );
  };

  const renderChatTab = () => {
    return (
      <View style={styles.chatContainer}>
        <ScrollView style={styles.chatContent} showsVerticalScrollIndicator={false}>
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeText}>
              Hello there! What can I answer about your pdf?
            </Text>
          </View>

          <View style={styles.chatOptionsContainer}>
            {structuredSummary?.chatOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.chatOptionButton}
                onPress={() => setChatInput(option)}
              >
                <Text style={styles.chatOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <View style={styles.chatInputWrapper}>
            <TextInput
              style={styles.chatInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type your question here..."
              multiline
            />
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{fileName.replace('.pdf', '')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="heart-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        {(['Summary', 'PDF', 'Chat'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segmentButton,
              activeTab === tab && styles.activeSegment
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.segmentText,
              activeTab === tab && styles.activeSegmentText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {renderTabContent()}
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
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    margin: 20,
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeSegmentText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  summaryContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 6,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  pdfContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  pdfPlaceholder: {
    alignItems: 'center',
  },
  pdfPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  pdfSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    flex: 1,
    padding: 20,
  },
  welcomeMessage: {
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
  welcomeText: {
    fontSize: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  chatOptionsContainer: {
    gap: 12,
  },
  chatOptionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatOptionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  chatInputContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  chatInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    color: '#1a1a1a',
  },
  micButton: {
    padding: 8,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SummarizationScreen;
