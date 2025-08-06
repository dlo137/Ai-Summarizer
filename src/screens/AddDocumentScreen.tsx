import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const AddDocumentScreen = () => {
  const navigation = useNavigation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);
      
      // TODO: Upload file to your backend
      Alert.alert('Success', 'PDF uploaded successfully!');
      
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
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

  const options = [
    {
      title: 'Upload PDF',
      subtitle: 'Select a PDF file from your device',
      icon: 'document-text',
      color: '#007AFF',
      onPress: pickDocument,
    },
    {
      title: 'Add Website',
      subtitle: 'Enter a website URL to summarize',
      icon: 'globe',
      color: '#34C759',
      onPress: () => {}, // Will be handled by the form below
    },
    {
      title: 'Paste URL',
      subtitle: 'Paste any URL to summarize',
      icon: 'link',
      color: '#FF9500',
      onPress: () => {}, // Will be handled by the form below
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Add New Document</Text>
        <Text style={styles.subtitle}>Choose how you want to add content</Text>

        {/* Upload Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Options</Text>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionCard, { borderLeftColor: option.color }]}
              onPress={option.onPress}
            >
              <View style={styles.optionContent}>
                <Ionicons name={option.icon as any} size={24} color={option.color} />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Or Enter URL</Text>
          <View style={styles.urlContainer}>
            <TextInput
              style={styles.urlInput}
              placeholder="Enter website URL..."
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
                <Text style={styles.urlButtonText}>Website</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.urlButton, styles.linkButton]}
                onPress={addUrl}
              >
                <Text style={styles.urlButtonText}>URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supported Formats</Text>
          <View style={styles.formatCard}>
            <View style={styles.formatItem}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              <Text style={styles.formatText}>PDF Documents</Text>
            </View>
            <View style={styles.formatItem}>
              <Ionicons name="globe" size={20} color="#34C759" />
              <Text style={styles.formatText}>Websites & Articles</Text>
            </View>
            <View style={styles.formatItem}>
              <Ionicons name="link" size={20} color="#FF9500" />
              <Text style={styles.formatText}>Any URL</Text>
            </View>
            <View style={styles.formatItem}>
              <Ionicons name="text" size={20} color="#AF52DE" />
              <Text style={styles.formatText}>Plain Text</Text>
            </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
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
  optionCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 15,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
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
  formatCard: {
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
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formatText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
});

export default AddDocumentScreen; 