import DocumentPicker from 'react-native-document-picker';
import { supabase } from '../lib/supabase'; // your initialized client
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Button } from 'react-native';

export default function HomeScreen() {
  const navigation = useNavigation();

  const handlePickAudio = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.audio],
      });

      // Defensive: file.name and file.type may be null
      if (!res.name || !res.type) {
        throw new Error('Invalid file: missing name or type');
      }
      const fileExt = res.name.split('.').pop();
      const fileName = `audio_${Date.now()}.${fileExt}`;

      // Fetch the file as a blob (React Native workaround)
      const response = await fetch(res.uri);
      const blob = await response.blob();

      const { data, error } = await supabase
        .storage
        .from('audio-uploads')
        .upload(fileName, blob, {
          contentType: res.type,
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

      // 5. Navigate to your Summarization screen
      navigation.navigate('Summarization', {
        documentId: '',
        fileName: 'Audio Transcript',
        publicUrl: publicUrl,
        // Optionally, you can pass transcript via context or another param if needed
      });
    } catch (err: any) {
      console.error('Audio pick/upload/transcribe error:', err);
      alert('Failed to process audio: ' + err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Select & Transcribe Audio" onPress={handlePickAudio} />
    </View>
  );
}
