import { processYouTubeContent, processArticleContent } from '../lib/summaryService';

/**
 * Example usage of the new YouTube and Article processing capabilities
 */

// Example 1: Process a YouTube video
export async function exampleYouTubeProcessing() {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Example URL
    const documentId = 'youtube_' + Date.now(); // Generate unique ID
    
    console.log('Processing YouTube video...');
    const result = await processYouTubeContent(videoUrl, documentId);
    
    console.log('YouTube processing result:', {
      summary: result.summary.substring(0, 100) + '...',
      keyPoints: result.keyPoints,
      sourceType: result.sourceType,
      chatOptions: result.chatOptions
    });
    
    return result;
  } catch (error) {
    console.error('YouTube processing failed:', error);
    throw error;
  }
}

// Example 2: Process an article
export async function exampleArticleProcessing() {
  try {
    const articleUrl = 'https://example.com/article'; // Example URL
    const documentId = 'article_' + Date.now(); // Generate unique ID
    
    console.log('Processing article...');
    const result = await processArticleContent(articleUrl, documentId);
    
    console.log('Article processing result:', {
      summary: result.summary.substring(0, 100) + '...',
      keyPoints: result.keyPoints,
      sourceType: result.sourceType,
      sections: result.sections.map(s => s.title)
    });
    
    return result;
  } catch (error) {
    console.error('Article processing failed:', error);
    throw error;
  }
}

// Example 3: Navigate to SummarizationScreen with YouTube content
export function navigateToYouTubeSummary(navigation: any, videoUrl: string, title: string) {
  const documentId = 'youtube_' + Date.now();
  
  navigation.navigate('Summarization', {
    documentId,
    fileName: title || 'YouTube Video',
    contentType: 'youtube',
    sourceUrl: videoUrl,
  });
}

// Example 4: Navigate to SummarizationScreen with Article content
export function navigateToArticleSummary(navigation: any, articleUrl: string, title: string) {
  const documentId = 'article_' + Date.now();
  
  navigation.navigate('Summarization', {
    documentId,
    fileName: title || 'Web Article',
    contentType: 'article',
    sourceUrl: articleUrl,
  });
}

// Example 5: Determine content type from URL
export function determineContentType(url: string): 'youtube' | 'article' | 'unknown' {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    
    // Simple heuristic for articles
    if (hostname.includes('medium.com') || 
        hostname.includes('dev.to') || 
        hostname.includes('techcrunch.com') ||
        url.includes('/article') ||
        url.includes('/blog') ||
        url.includes('/news')) {
      return 'article';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
 * Integration example for adding URL input to your app
 */
export const URLProcessingExample = {
  // This could be added to a screen where users input URLs
  processUrl: async (url: string, navigation: any) => {
    const contentType = determineContentType(url);
    
    switch (contentType) {
      case 'youtube':
        navigateToYouTubeSummary(navigation, url, 'YouTube Video');
        break;
      case 'article':
        navigateToArticleSummary(navigation, url, 'Web Article');
        break;
      default:
        throw new Error('Unsupported URL type. Please provide a YouTube video or article URL.');
    }
  }
};
