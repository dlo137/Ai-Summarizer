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

    // Find caption tracks
    const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
      return res.status(404).json({ error: 'No captions available for this video' });
    }

    // Prefer English captions, fallback to first available
    const track = captionTracks.find((t: any) => t.languageCode.startsWith('en')) || captionTracks[0];
    if (!track?.baseUrl) {
      return res.status(404).json({ error: 'No valid caption track found' });
    }

    // Fetch the caption XML
    const captionRes = await fetch(track.baseUrl);
    const captionXml = await captionRes.text();

    // Parse XML to plain text
    const transcript = parseCaptionXml(captionXml);

    return res.status(200).json({ transcript, title, duration });
  } catch (error: any) {
    console.error('YouTube caption extraction error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
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
