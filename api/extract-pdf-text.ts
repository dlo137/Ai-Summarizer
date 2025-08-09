import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Use dynamic imports for node-fetch and pdf-parse to avoid Vercel import issues
  const fetch = (await import('node-fetch')).default;
  const pdfParse = (await import('pdf-parse')).default;
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { documentId } = req.body;
    console.log('[extract-pdf-text] Received documentId:', documentId);
    if (!documentId) {
      return res.status(400).json({ error: 'Missing document ID' });
    }

    // Fetch the document row to get the storage path
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();
    if (docError) {
      console.error('[extract-pdf-text] Supabase error:', docError);
      return res.status(404).json({ error: 'Document not found', detail: docError });
    }
    if (!docData?.content) {
      console.error('[extract-pdf-text] No content URL for document:', documentId);
      return res.status(404).json({ error: 'Document content URL missing' });
    }

    // The content field should be the public or storage URL
    const pdfUrl = docData.content;
    console.log('[extract-pdf-text] PDF URL:', pdfUrl);

    // Wait 1.5 seconds to avoid race condition with storage propagation
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Download the PDF file
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) {
      console.error('[extract-pdf-text] Failed to download PDF:', pdfRes.status, pdfRes.statusText);
      return res.status(400).json({ error: 'Failed to download PDF from storage', status: pdfRes.status, statusText: pdfRes.statusText });
    }
    const pdfBuffer = await pdfRes.buffer();

    // Extract text from PDF
    let extractedText = '';
    try {
      const pdfData = await pdfParse(pdfBuffer);
      extractedText = pdfData.text;
    } catch (parseErr) {
      console.error('[extract-pdf-text] PDF parse error:', parseErr);
      return res.status(500).json({ error: 'Failed to parse PDF', detail: parseErr });
    }

    if (!extractedText || extractedText.trim().length < 10) {
      await supabase
        .from('documents')
        .update({ transcript: '' })
        .eq('id', documentId);
      console.warn('[extract-pdf-text] No text extracted from PDF for document:', documentId);
      return res.status(200).json({ transcript: '', message: 'No text extracted from PDF.' });
    }

    // Save extracted text to transcript column
    await supabase
      .from('documents')
      .update({ transcript: extractedText })
      .eq('id', documentId);

    console.log('[extract-pdf-text] Extraction complete for document:', documentId);
    return res.status(200).json({ transcript: extractedText });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err });
  }
}
