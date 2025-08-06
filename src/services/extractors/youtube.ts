// Note: This is a React Native compatible version
// For full ytdl-core functionality, you'd need a backend API

export interface YouTubeExtractionResult {
  transcript: string;
  title: string;
  duration: number;
  error?: string;
}

/**
 * Extract transcript from YouTube video URL
 * Note: This is a simplified version for React Native
 * @param videoUrl YouTube video URL
 * @returns Promise with transcript and metadata
 */
export async function extractYouTubeTranscript(videoUrl: string): Promise<YouTubeExtractionResult> {
  try {
    console.log('🎬 Starting YouTube transcript extraction for:', videoUrl);
    
    // Validate YouTube URL
    if (!isYouTubeUrl(videoUrl)) {
      throw new Error('Invalid YouTube URL provided');
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    console.log(`📹 Extracted video ID: ${videoId}`);

    // Try to fetch video info using public APIs
    const videoInfo = await fetchVideoInfo(videoId);
    
    // Try to get captions if available
    const transcript = await fetchVideoCaptions(videoId);
    
    if (!transcript) {
      throw new Error(
        'Could not extract transcript from this video. ' +
        'This may be because the video does not have captions available, ' +
        'or the video is private/restricted. ' +
        'For full YouTube transcript extraction, consider implementing a backend service with ytdl-core.'
      );
    }

    return {
      transcript,
      title: videoInfo.title || 'YouTube Video',
      duration: videoInfo.duration || 0,
    };

  } catch (error) {
    console.error('❌ YouTube extraction error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to extract transcript from YouTube video'
    );
  }
}

/**
 * Fetch basic video information
 * @param videoId YouTube video ID
 * @returns Video information
 */
async function fetchVideoInfo(videoId: string): Promise<{title: string; duration: number}> {
  try {
    // Note: This is a placeholder. In a real app, you'd use YouTube Data API
    // or implement this in your backend with proper API keys
    
    // For demo purposes, we'll extract title from the page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch video page');
    }
    
    const html = await response.text();
    
    // Extract title from page HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'YouTube Video';
    
    return { title, duration: 0 };
    
  } catch (error) {
    console.warn('Could not fetch video info:', error);
    return { title: 'YouTube Video', duration: 0 };
  }
}

/**
 * Attempt to fetch video captions
 * @param videoId YouTube video ID
 * @returns Transcript text or null
 */
async function fetchVideoCaptions(videoId: string): Promise<string | null> {
  try {
    // Note: This is a simplified approach. Real implementation would need:
    // 1. YouTube Data API key to get caption tracks
    // 2. Backend service to fetch and parse caption files
    // 3. Proper handling of different caption formats
    
    console.log('📝 Attempting to fetch captions for video:', videoId);
    
    // This is a placeholder - in a real app you'd implement this properly
    // with YouTube Data API or a backend service
    
    // For now, return null to indicate captions not available
    return null;
    
  } catch (error) {
    console.warn('Could not fetch captions:', error);
    return null;
  }
}

/**
 * Extract YouTube video ID from various URL formats
 * @param url YouTube URL
 * @returns Video ID or null
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Validate if URL is a YouTube URL
 * @param url URL to validate
 * @returns True if valid YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname.includes('youtube.com') || hostname.includes('youtu.be');
  } catch {
    return false;
  }
}
