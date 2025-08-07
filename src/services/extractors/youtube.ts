// Note: This is a React Native compatible version with long-polling support
// Interfaces first
export interface TranscriptionJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  error?: string;
}

export interface YouTubeExtractionResult {
  transcript: string;
  title: string;
  duration: number;
  error?: string;
}

export interface TranscriptionJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  error?: string;
}

/**
 * Extract transcript from YouTube video URL
 * Note: This version implements long-polling for transcription status
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
    
    // Start transcription job and poll for results
    const transcriptionResult = await startAndPollTranscription(videoUrl);
    
    if (!transcriptionResult.transcript) {
      throw new Error(transcriptionResult.error || 
        'Could not extract transcript from this video. ' +
        'This may be because the video does not have captions available, ' +
        'or the video is private/restricted.'
      );
    }

    return {
      transcript: transcriptionResult.transcript,
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
/**
 * Fetch basic video information using the YouTube Data API
 * @param videoId YouTube video ID
 * @returns Video information
 */
async function fetchVideoInfo(videoId: string): Promise<{title: string; duration: number}> {
  try {
    // Get video info from our backend which uses YouTube Data API
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/youtube-info/${videoId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video info');
    }
    
    const data = await response.json();
    return {
      title: data.title || 'YouTube Video',
      duration: data.duration || 0
    };
    
  } catch (error) {
    console.warn('Could not fetch video info:', error);
    return { title: 'YouTube Video', duration: 0 };
  }
}

/**
 * Check the status of a transcription job
 * @param jobId The ID of the transcription job
 * @returns The current status of the job
 */
async function checkTranscriptionStatus(jobId: string): Promise<TranscriptionJob> {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/youtube-transcribe/status/${jobId}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to check transcription status');
  }
  
  return await response.json();
}

/**
 * Start a transcription job and poll for results
 * @param videoUrl YouTube video URL
 * @returns Promise with transcription result
 */
async function startAndPollTranscription(videoUrl: string): Promise<TranscriptionJob> {
  try {
    // Start transcription job
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/youtube-transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start transcription');
    }

    const { jobId } = await response.json();
    
    // Poll for results
    const maxAttempts = 30; // 5 minutes maximum (10 second intervals)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/youtube-transcribe/status/${jobId}`
      );
      
      if (!statusResponse.ok) {
        throw new Error('Failed to check transcription status');
      }
      
      const job: TranscriptionJob = await statusResponse.json();
      
      if (job.status === 'completed') {
        return job;
      }
      
      if (job.status === 'failed') {
        throw new Error(job.error || 'Transcription failed');
      }
      
      // Wait 10 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
    
    throw new Error('Transcription timed out');
    
  } catch (error) {
    console.warn('Transcription error:', error);
    return {
      jobId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
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
