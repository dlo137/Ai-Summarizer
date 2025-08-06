import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';
import { saveDocumentRecord } from './documentService';

async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return await response.blob();
}

export async function handlePdfUpload() {
  try {
    // 1) Let user pick
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true
    });

    if (result.canceled) {
      return;
    }

    // 2) Turn URI into Blob
    const blob = await uriToBlob(result.assets[0].uri);

    // 3) Upload to Storage
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const fileName = result.assets[0].name || `document_${Date.now()}.pdf`;
    const path = `${user.data.user.id}/${Date.now()}_${fileName}`;

    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('pdfs')
      .upload(path, blob, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) throw storageError;

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(path);

    // 4) Save in documents table
    const docRow = await saveDocumentRecord(path, urlData.publicUrl, fileName);
    console.log('✔️ Document queued:', docRow.id);

    return {
      docRow,
      publicUrl: urlData.publicUrl,
      fileName
    };
  } catch (err) {
    console.error('Upload failed:', err);
    throw err;
  }
}
