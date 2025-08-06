import type { VercelRequest, VercelResponse } from '@vercel/node';
import ytdl from 'ytdl-core';

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
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const duration = parseInt(info.videoDetails.lengthSeconds);

    // Always grab a fresh track.baseUrl right before fetching
    const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      // Fallback: Use Whisper if no captions
      const transcript = await whisperTranscribe(videoUrl);
      if (!transcript) {
        return res.status(404).json({ error: 'No captions or transcript available for this video' });
      }
      return res.status(200).json({ transcript, title, duration });
    }

    // Prefer English captions, fallback to first available
    const track = captionTracks.find((t: any) => t.languageCode.startsWith('en')) || captionTracks[0];
    if (!track?.baseUrl) {
      // Fallback: Use Whisper if no valid caption track
      const transcript = await whisperTranscribe(videoUrl);
      if (!transcript) {
        return res.status(404).json({ error: 'No captions or transcript available for this video' });
      }
      return res.status(200).json({ transcript, title, duration });
    }

    // Fetch captions immediately
    const captionRes = await fetch(track.baseUrl);
    if (captionRes.status === 410) {
      // Fallback: Use Whisper if captions endpoint returns 410
      const transcript = await whisperTranscribe(videoUrl);
      if (!transcript) {
        return res.status(404).json({ error: 'No captions or transcript available for this video' });
      }
      return res.status(200).json({ transcript, title, duration });
    }
    const captionXml = await captionRes.text();

    // Parse XML to plain text
    const transcript = parseCaptionXml(captionXml);

    return res.status(200).json({ transcript, title, duration });
  } catch (error: any) {
    console.error('YouTube caption extraction error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Whisper fallback function
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

async function whisperTranscribe(videoUrl: string): Promise<string | null> {
  try {
    // Download audio from YouTube
    const audioStream = ytdl(videoUrl, { filter: 'audioonly' });
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    const audioBuffer = Buffer.concat(chunks);

    // Write buffer to a temp file and use fs.createReadStream
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `youtube-audio-${Date.now()}.mp3`);
    await fs.promises.writeFile(tempFilePath, audioBuffer);
    const audioReadStream = fs.createReadStream(tempFilePath);

    // Send to OpenAI Whisper
    const translation = await openai.audio.translations.create({
      file: audioReadStream,
      model: 'whisper-1',
      response_format: 'text',
    });

    // Clean up temp file
    audioReadStream.on('close', () => {
      fs.promises.unlink(tempFilePath).catch(() => {});
    });

    return typeof translation === 'string' ? translation : null;
  } catch (err) {
    console.error('Whisper transcription error:', err);
    return null;
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
