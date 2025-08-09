import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { documentId } = req.body;
    if (!documentId) {
      return res.status(400).json({ error: 'Missing document ID' });
    }

    // Fetch the document row to get the storage path
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('content')
      .eq('id', documentId)
      .single();
    if (docError || !docData?.content) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // The content field should be the public or storage URL
    const pdfUrl = docData.content;

    // Download the PDF file
    const pdfRes = await fetch(pdfUrl);
    if (!pdfRes.ok) {
      return res.status(400).json({ error: 'Failed to download PDF from storage' });
    }
    const pdfBuffer = await pdfRes.buffer();

    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 10) {
      await supabase
        .from('documents')
        .update({ transcript: '' })
        .eq('id', documentId);
      return res.status(200).json({ transcript: '', message: 'No text extracted from PDF.' });
    }

    // Save extracted text to transcript column
    await supabase
      .from('documents')
      .update({ transcript: extractedText })
      .eq('id', documentId);

    return res.status(200).json({ transcript: extractedText });
  } catch (err) {
    console.error('PDF extraction error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
