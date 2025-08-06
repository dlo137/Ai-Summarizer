export interface SummarizationResult {
  summary: string;
  keyPoints: string[];
  overview: string[];
  sections: {
    title: string;
    bullets: string[];
  }[];
  chatOptions: string[];
  transcript?: string;
  wordCount: number;
  sourceType: 'pdf' | 'youtube' | 'article';
}

export interface SummarizationOptions {
  sourceType: 'pdf' | 'youtube' | 'article';
  title?: string;
  originalText?: string;
  transcript?: string;
}

/**
 * Centralized summarization service for all content types
 * @param text Content text to summarize
 * @param options Summarization options
 * @returns Structured summary result
 */
export async function summarize(
  text: string, 
  options: SummarizationOptions
): Promise<SummarizationResult> {
  try {
    console.log(`📝 Starting ${options.sourceType} summarization...`);
    console.log(`📊 Content length: ${text.length} characters`);
    
    if (!text || text.trim().length < 50) {
      throw new Error('Content is too short to summarize effectively');
    }

    // Generate summary using OpenAI API
    const summary = await generateSummary(text, options);
    
    if (!summary) {
      throw new Error('Failed to generate summary from the content');
    }

    // Extract structured data
    const keyPoints = extractKeyPoints(summary);
    const structuredData = parseStructuredSummary(summary, options.sourceType);
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    console.log('✅ Summarization completed successfully');

    return {
      summary,
      keyPoints,
      overview: structuredData.overview,
      sections: structuredData.sections,
      chatOptions: structuredData.chatOptions,
      transcript: options.transcript,
      wordCount,
      sourceType: options.sourceType,
    };

  } catch (error) {
    console.error('❌ Summarization error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : `Failed to summarize ${options.sourceType} content`
    );
  }
}

/**
 * Generate summary using OpenAI API
 * @param text Content to summarize
 * @param options Summarization options
 * @returns Generated summary
 */
async function generateSummary(text: string, options: SummarizationOptions): Promise<string> {
  try {
    const prompt = createSummarizationPrompt(text, options);
    
    console.log('📤 Sending content to OpenAI API...');
    
    const response = await fetch('https://ai-summarizer-drab-nu.vercel.app/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: prompt }),
    });
    
    console.log('📥 API Response status:', response.status);
    
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || 'Unknown error';
        console.log('❌ API Error details:', errorData);
      } catch (e) {
        console.log('❌ Could not parse error response');
      }
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response received');
    return data.summary;
    
  } catch (error) {
    console.error('❌ Error calling summarization API:', error);
    throw error;
  }
}

/**
 * Create appropriate prompt based on content type
 * @param text Content to summarize
 * @param options Summarization options
 * @returns Formatted prompt
 */
function createSummarizationPrompt(text: string, options: SummarizationOptions): string {
  const basePrompt = `Please provide a comprehensive summary of the following ${options.sourceType} content:`;
  
  let specificInstructions = '';
  
  switch (options.sourceType) {
    case 'youtube':
      specificInstructions = `
This is a transcript from a YouTube video${options.title ? ` titled "${options.title}"` : ''}. 
Please summarize the key points, main topics discussed, and any important insights or conclusions.
Focus on the educational or informational content while ignoring filler words or tangential remarks.`;
      break;
      
    case 'article':
      specificInstructions = `
This is content from a web article${options.title ? ` titled "${options.title}"` : ''}. 
Please summarize the main arguments, key findings, and important conclusions.
Focus on the core message and supporting evidence presented by the author.`;
      break;
      
    case 'pdf':
      specificInstructions = `
This is content from a PDF document${options.title ? ` titled "${options.title}"` : ''}. 
Please summarize the key information, main topics, and important details.
Focus on the document's primary purpose and essential information.`;
      break;
  }

  return `${basePrompt}

${specificInstructions}

Please structure your summary to be clear, concise, and informative. Focus on the most important information that would be valuable to someone who wants to understand the content without reading/watching the entire ${options.sourceType}.

Content to summarize:
${text}`;
}

/**
 * Extract key points from summary text
 * @param summaryText Generated summary
 * @returns Array of key points
 */
function extractKeyPoints(summaryText: string): string[] {
  // Extract sentences and filter for the most important ones
  const sentences = summaryText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 200);
  
  // Return first 3-5 sentences as key points
  return sentences.slice(0, Math.min(5, sentences.length));
}

/**
 * Parse summary into structured format based on content type
 * @param summaryText Generated summary
 * @param sourceType Type of source content
 * @returns Structured summary data
 */
function parseStructuredSummary(
  summaryText: string, 
  sourceType: 'pdf' | 'youtube' | 'article'
) {
  // Create overview from first few sentences
  const sentences = summaryText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const overview = sentences.slice(0, 3).map(s => s.trim());

  // Create sections based on content type
  let sections: { title: string; bullets: string[] }[] = [];
  let chatOptions: string[] = [];

  switch (sourceType) {
    case 'youtube':
      sections = [
        {
          title: "Main Topics Discussed",
          bullets: extractBulletPoints(summaryText, 'topics')
        },
        {
          title: "Key Insights",
          bullets: extractBulletPoints(summaryText, 'insights')
        },
        {
          title: "Takeaways",
          bullets: extractBulletPoints(summaryText, 'takeaways')
        }
      ];
      chatOptions = [
        "What were the main points of this video?",
        "Can you explain the key concepts discussed?",
        "What are the practical applications mentioned?"
      ];
      break;

    case 'article':
      sections = [
        {
          title: "Main Arguments",
          bullets: extractBulletPoints(summaryText, 'arguments')
        },
        {
          title: "Supporting Evidence",
          bullets: extractBulletPoints(summaryText, 'evidence')
        },
        {
          title: "Conclusions",
          bullets: extractBulletPoints(summaryText, 'conclusions')
        }
      ];
      chatOptions = [
        "What is the author's main argument?",
        "What evidence supports the claims?",
        "How does this relate to current trends?"
      ];
      break;

    case 'pdf':
      sections = [
        {
          title: "Document Purpose",
          bullets: extractBulletPoints(summaryText, 'purpose')
        },
        {
          title: "Key Information",
          bullets: extractBulletPoints(summaryText, 'information')
        },
        {
          title: "Important Details",
          bullets: extractBulletPoints(summaryText, 'details')
        }
      ];
      chatOptions = [
        "What is the main purpose of this document?",
        "Can you explain the key requirements?",
        "What are the important deadlines or dates?"
      ];
      break;
  }

  return { overview, sections, chatOptions };
}

/**
 * Extract bullet points from text based on context
 * @param text Summary text
 * @param context Context for extraction
 * @returns Array of bullet points
 */
function extractBulletPoints(text: string, context: string): string[] {
  // Simple extraction - in production you might use more sophisticated NLP
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  // Return 2-4 sentences as bullet points
  const startIndex = context === 'topics' ? 0 : 
                    context === 'insights' ? Math.floor(sentences.length / 3) :
                    Math.floor(sentences.length * 2 / 3);
  
  return sentences
    .slice(startIndex, startIndex + 3)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}
