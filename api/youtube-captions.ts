import type { VercelRequest, VercelResponse } from '@vercel/node';
import ytdl from 'ytdl-core';
import OpenAI from 'openai';
import { writeFileSync, unlinkSync, createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

/**
 * Vercel serverless function to fetch YouTube captions (transcript) for a given video URL
 * Usage: POST /api/youtube-captions { videoUrl: string }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { videoUrl } = req.body || {};
  if (!videoUrl || typeof videoUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid videoUrl' });
  }

  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(videoUrl)) {
      console.error('[DEBUG] Invalid YouTube URL:', videoUrl);
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    let info;
    try {
      info = await ytdl.getInfo(videoUrl);
    } catch (err: any) {
      if (err?.statusCode === 410) {
        console.warn('[DEBUG] ytdl.getInfo returned 410, falling back to Whisper');
        try {
          const transcript = await whisperTranscribe(videoUrl);
          if (!transcript) {
            console.error('[DEBUG] Whisper fallback failed, no transcript');
            return res.status(404).json({ error: 'Sorry, we can’t extract audio or captions for this video.' });
          }
          return res.status(200).json({ transcript, title: '', duration: 0 });
        } catch (audioErr: any) {
          console.error('[DEBUG] Whisper fallback failed:', audioErr);
          return res.status(404).json({ error: 'Sorry, we can’t extract audio or captions for this video.' });
        }
      }
      console.error('[DEBUG] ytdl.getInfo error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }

    const title = info.videoDetails.title;
    const duration = parseInt(info.videoDetails.lengthSeconds);
    console.log('[DEBUG] Video info:', { title, duration });

    // Always grab a fresh track.baseUrl right before fetching
    const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    console.log('[DEBUG] Caption tracks:', captionTracks);
    if (!captionTracks || captionTracks.length === 0) {
      console.warn('[DEBUG] No caption tracks found, falling back to Whisper');
      const transcript = await whisperTranscribe(videoUrl);
      if (!transcript) {
        console.error('[DEBUG] Whisper fallback failed, no transcript');
        return res.status(404).json({ error: 'No captions or transcript available for this video' });
      }
      return res.status(200).json({ transcript, title, duration });
    }

    // Prefer English captions, fallback to first available
    const track = captionTracks.find((t: any) => t.languageCode.startsWith('en')) || captionTracks[0];
    console.log('[DEBUG] Selected caption track:', track);
    if (!track?.baseUrl) {
      console.warn('[DEBUG] No valid baseUrl in caption track, falling back to Whisper');
      const transcript = await whisperTranscribe(videoUrl);
      if (!transcript) {
        console.error('[DEBUG] Whisper fallback failed, no transcript');
        return res.status(404).json({ error: 'No captions or transcript available for this video' });
      }
      return res.status(200).json({ transcript, title, duration });
    }

    // Fetch captions immediately
    let captionRes;
    try {
      console.log('[DEBUG] Fetching captions from baseUrl:', track.baseUrl);
      captionRes = await fetch(track.baseUrl);
    } catch (err: any) {
      if (err?.statusCode === 410) {
        console.warn('[DEBUG] Caption fetch threw 410, falling back to Whisper');
        const transcript = await whisperTranscribe(videoUrl);
        if (!transcript) {
          console.error('[DEBUG] Whisper fallback failed, no transcript');
          return res.status(404).json({ error: 'No captions or transcript available for this video' });
        }
        return res.status(200).json({ transcript, title, duration });
      }
      console.error('[DEBUG] Caption fetch error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
    console.log('[DEBUG] Caption fetch response status:', captionRes.status);
    if (captionRes.status === 410) {
      console.warn('[DEBUG] Caption endpoint returned 410, falling back to Whisper');
      const transcript = await whisperTranscribe(videoUrl);
      if (!transcript) {
        console.error('[DEBUG] Whisper fallback failed, no transcript');
        return res.status(404).json({ error: 'No captions or transcript available for this video' });
      }
      return res.status(200).json({ transcript, title, duration });
    }
    const captionXml = await captionRes.text();
    console.log('[DEBUG] Caption XML length:', captionXml.length);

    // Parse XML to plain text
    const transcript = parseCaptionXml(captionXml);
    console.log('[DEBUG] Parsed transcript length:', transcript.length);

    return res.status(200).json({ transcript, title, duration });
  } catch (error: any) {
    console.error('YouTube caption extraction error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function whisperTranscribe(videoUrl: string): Promise<string | null> {
  const tempFile = join(tmpdir(), `youtube-audio-${Date.now()}.mp3`);
  
  try {
    console.log('[DEBUG] Starting audio extraction for:', videoUrl);
    
    // Get audio stream from YouTube
    const audioStream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // 32MB buffer
    });

    // Convert stream to buffer and save to temp file
    const chunks: any[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    writeFileSync(tempFile, audioBuffer);
    
    console.log('[DEBUG] Audio saved to temp file:', tempFile);
    
    // Send to Whisper API
    console.log('[DEBUG] Starting Whisper transcription');
    const response = await openai.audio.transcriptions.create({
      file: await import('fs').then(fs => fs.createReadStream(tempFile)),
      model: 'whisper-1',
      response_format: 'text',
    });
    
    console.log('[DEBUG] Whisper transcription successful');
    return response;
    
  } catch (err: any) {
    console.error('[DEBUG] Processing error:', err);
    return null;
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFile);
      console.log('[DEBUG] Temp file deleted');
    } catch (cleanupErr) {
      console.warn('[DEBUG] Failed to delete temp file:', cleanupErr);
    }
  }
}

/**
 * Parse YouTube caption XML to plain text
 */
function parseCaptionXml(xml: string): string {
  // Simple regex-based XML parsing
  const textMatches = xml.match(/<text[^>]*>(.*?)<\/text>/gi);
  if (!textMatches) return '';
  return textMatches
    .map(match => decodeHtmlEntities(match.replace(/<text[^>]*>|<\/text>/gi, '')))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}
