import { supabase } from './supabase'

export type DocumentRow = {
  id?: string
  user_id: string
  title: string
  content: string
  summary?: string
  document_type: 'pdf' | 'article' | 'youtube' | 'audio'
  status: 'pending' | 'text_extracted' | 'summarized'
  created_at?: string
  updated_at?: string
}

export async function saveDocumentRecord(
  storagePath: string,
  publicUrl: string,
  filename: string
): Promise<DocumentRow> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .insert([{
      user_id: user.data.user.id,
      title: filename,
      content: publicUrl,
      summary: '',
      document_type: 'pdf',
      status: 'pending',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserDocuments(): Promise<DocumentRow[]> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.data.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function subscribeToUserDocuments(
  callback: (documents: DocumentRow[]) => void
) {
  const subscription = supabase
    .channel('documents_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
      },
      async () => {
        try {
          const documents = await getUserDocuments();
          callback(documents);
        } catch (error) {
          console.error('Error fetching documents after change:', error);
        }
      }
    )
    .subscribe();

  return subscription;
}
