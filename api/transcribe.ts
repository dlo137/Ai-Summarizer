import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

/**
 * Vercel serverless function to transcribe audio from a public URL using OpenAI Whisper
 * Usage: POST /api/transcribe { audioUrl: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { audioUrl, documentId } = req.body || {};
  if (!audioUrl || typeof audioUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid audioUrl' });
  }
  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid documentId' });
  }

  try {
    // Download the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a temporary file for Whisper
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tmpFile = path.join(os.tmpdir(), `audio-${Date.now()}.mp3`);
    fs.writeFileSync(tmpFile, buffer);

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpFile),
      model: 'whisper-1',
      response_format: 'text',
    });

    // Clean up temp file
    try { fs.unlinkSync(tmpFile); } catch {}

    // Update Supabase document with transcript
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabase
      .from('documents')
      .update({ content: transcription })
      .eq('id', documentId);

    return res.status(200).json({ transcript: transcription });
  } catch (err: any) {
    console.error('Audio transcription error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
