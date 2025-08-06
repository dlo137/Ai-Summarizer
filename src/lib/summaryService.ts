import { supabase } from './supabase'

export type SummaryRow = {
  id?: string
  document_id: string
  user_id: string
  content: string
  key_points?: string[]
  word_count?: number
  created_at?: string
  updated_at?: string
  documents?: {
    title: string
    document_type: string
  }
}

export async function saveSummaryRecord(
  documentId: string,
  content: string,
  keyPoints?: string[]
): Promise<SummaryRow> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  // Check if summary already exists for this document
  const existingSummary = await getSummaryByDocumentId(documentId);
  if (existingSummary) {
    console.log('Summary already exists for document:', documentId);
    return existingSummary;
  }

  // Calculate word count
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

  // Start with basic data that we know exists
  const insertData: any = {
    document_id: documentId,
    user_id: user.data.user.id,
    content: content,
  };

  // Try to insert with new columns first, fallback if they don't exist
  try {
    const { data, error } = await supabase
      .from('summaries')
      .insert([{
        ...insertData,
        key_points: keyPoints || [],
        word_count: wordCount,
      }])
      .select()
      .single();

    if (error) {
      // If error is about missing columns, try again without them
      if (error.message.includes('key_points') || error.message.includes('word_count')) {
        console.log('New columns not available, using basic insert');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('summaries')
          .insert([insertData])
          .select()
          .single();
        
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      throw error;
    }
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getUserSummaries(): Promise<SummaryRow[]> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  try {
    // Try with joined data first
    const { data, error } = await supabase
      .from('summaries')
      .select(`
        *,
        documents!inner(title, document_type)
      `)
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Join query failed, falling back to simple query:', error);
      // Fallback to simple query without join
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSummaries:', error);
    throw error;
  }
}

export async function getSummaryByDocumentId(documentId: string): Promise<SummaryRow | null> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('user_id', user.data.user.id)
    .eq('document_id', documentId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data || null;
}

export function subscribeToUserSummaries(
  callback: (summaries: SummaryRow[]) => void
) {
  const subscription = supabase
    .channel('summaries_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'summaries',
      },
      async (payload) => {
        console.log('📡 Summaries subscription triggered:', payload.eventType);
        try {
          const summaries = await getUserSummaries();
          callback(summaries);
        } catch (error) {
          console.error('Error fetching summaries after change:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 Summaries subscription status:', status);
    });

  return subscription;
}

export async function deleteSummary(summaryId: string): Promise<void> {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('summaries')
    .delete()
    .eq('id', summaryId)
    .eq('user_id', user.data.user.id);

  if (error) throw error;
}

// Debug function to test database connection
export async function testSummariesTable(): Promise<void> {
  try {
    console.log('🧪 Testing summaries table...');
    
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      console.log('❌ User not authenticated');
      return;
    }
    
    // Test basic table access
    const { data, error } = await supabase
      .from('summaries')
      .select('count(*)')
      .eq('user_id', user.data.user.id);
    
    if (error) {
      console.error('❌ Database error:', error);
    } else {
      console.log('✅ Summaries table accessible, user summary count:', data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
