import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

    // Fetch the transcript from Supabase
    const { data: transcriptData, error: transcriptError } = await supabase
      .from('documents')
      .select('transcript')
      .eq('id', documentId)
      .single();

    if (transcriptError) {
      throw transcriptError;
    }

    const transcript = transcriptData?.transcript;

    if (!transcript || transcript.trim().length < 10) {
      // If transcript is empty or not meaningful, clear the summary and return a clear message
      await supabase
        .from('documents')
        .update({ summary: null })
        .eq('id', documentId);
      return res.status(200).json({ summary: null, message: 'This file could not be transcribed or summarized.' });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Summarize the following document clearly and concisely. Provide the main points and key insights in a structured format.',
          },
          {
            role: 'user',
            content: transcript,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'OpenAI response error', detail: data });
    }

    // Save the summary to Supabase
    await supabase
      .from('documents')
      .update({ summary: data.choices[0].message.content })
      .eq('id', documentId);

    return res.status(200).json({ summary: data.choices[0].message.content });
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

