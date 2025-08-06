# YouTube & Article Summarization Implementation

This implementation extends the existing PDF summarization pipeline to support YouTube videos and web articles.

## Architecture Overview

The implementation follows the same pattern as the existing PDF pipeline:

1. **Content Extraction** → 2. **Summarization** → 3. **Storage** → 4. **Display**

## New Components

### 1. Content Extractors (`src/services/extractors/`)

#### YouTube Extractor (`youtube.ts`)
- Extracts video metadata (title, duration)
- Attempts to fetch captions when available
- Provides fallback for audio transcription (requires backend implementation)
- React Native compatible (uses web APIs only)

```typescript
import { extractYouTubeTranscript } from '../services/extractors/youtube';

const result = await extractYouTubeTranscript('https://youtube.com/watch?v=...');
console.log(result.transcript, result.title);
```

#### Article Extractor (`article.ts`)
- Fetches HTML content from article URLs
- Parses content using regex-based extraction
- Extracts title, author, and main text content
- Cleans and normalizes text for summarization

```typescript
import { extractArticleText } from '../services/extractors/article';

const result = await extractArticleText('https://example.com/article');
console.log(result.textContent, result.title);
```

### 2. Centralized Summarization Service (`src/services/summarization.ts`)

Provides unified summarization for all content types:

```typescript
import { summarize } from '../services/summarization';

const result = await summarize(text, {
  sourceType: 'youtube', // or 'article' or 'pdf'
  title: 'Content Title',
  transcript: 'optional transcript'
});
```

### 3. Enhanced Summary Service (`src/lib/summaryService.ts`)

Extended with new functions:
- `processYouTubeContent(videoUrl, documentId)`
- `processArticleContent(articleUrl, documentId)`
- `saveEnhancedSummaryRecord()` with new fields

### 4. Updated UI (`src/screens/SummarizationScreen.tsx`)

Enhanced with:
- Dynamic tab system (Summary, PDF/Video/Article, Chat)
- Video and Article viewer tabs
- Content-type-aware chat options
- Flexible route parameters

## Database Schema Extensions

New optional fields in summaries table:
```sql
-- Enhanced summary fields
overview: string[]
sections: { title: string; bullets: string[] }[]
chat_options: string[]
transcript: string
source_type: 'pdf' | 'youtube' | 'article'
source_url: string
source_title: string
```

## Usage Examples

### 1. Navigate to YouTube Summary
```typescript
navigation.navigate('Summarization', {
  documentId: 'youtube_' + Date.now(),
  fileName: 'Video Title',
  contentType: 'youtube',
  sourceUrl: 'https://youtube.com/watch?v=...',
});
```

### 2. Navigate to Article Summary
```typescript
navigation.navigate('Summarization', {
  documentId: 'article_' + Date.now(),
  fileName: 'Article Title',
  contentType: 'article',
  sourceUrl: 'https://example.com/article',
});
```

### 3. Process Content Programmatically
```typescript
import { processYouTubeContent, processArticleContent } from '../lib/summaryService';

// YouTube
const youtubeResult = await processYouTubeContent(videoUrl, documentId);

// Article
const articleResult = await processArticleContent(articleUrl, documentId);
```

## Limitations & Improvements

### Current Limitations

1. **YouTube Transcription**: Only works with videos that have captions. Audio transcription requires backend implementation with OpenAI Whisper API.

2. **Article Extraction**: Uses regex-based parsing instead of proper DOM parsing (for React Native compatibility). For better results, implement server-side extraction.

3. **Rate Limiting**: No built-in rate limiting for API calls.

### Recommended Improvements

1. **Backend API**: Implement server-side extraction for better reliability:
   ```
   POST /api/extract-youtube
   POST /api/extract-article
   ```

2. **Audio Transcription**: Add OpenAI Whisper integration for YouTube videos without captions.

3. **Better Article Parsing**: Use server-side libraries like Readability or Mercury for more accurate extraction.

4. **Caching**: Implement caching for extracted content to avoid re-processing.

5. **Error Handling**: Add retry logic and better error messages.

## File Structure

```
src/
├── services/
│   ├── extractors/
│   │   ├── youtube.ts      # YouTube content extraction
│   │   └── article.ts      # Article content extraction
│   └── summarization.ts    # Unified summarization service
├── lib/
│   └── summaryService.ts   # Enhanced with new content types
├── screens/
│   └── SummarizationScreen.tsx  # Updated UI with new tabs
└── utils/
    └── contentProcessingExamples.ts  # Usage examples
```

## Integration Steps

To integrate this into your app:

1. **Install Dependencies** (already added to package.json)
2. **Database Migration**: Add new columns to summaries table
3. **Update Navigation**: Add URL input screens
4. **Test with Examples**: Use the provided example functions

## Testing

Test with these URLs:
- **YouTube**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **Article**: `https://dev.to/...` or any news article URL

The implementation gracefully handles errors and provides meaningful feedback to users.
