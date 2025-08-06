// Note: This is a React Native compatible version using web APIs
// For better extraction, consider implementing this in your backend

export interface ArticleExtractionResult {
  textContent: string;
  title: string;
  byline?: string;
  excerpt?: string;
  url: string;
  error?: string;
}

/**
 * Extract readable text content from article URL
 * Note: This is a simplified React Native version
 * @param articleUrl URL of the article to extract
 * @returns Promise with extracted article content
 */
export async function extractArticleText(articleUrl: string): Promise<ArticleExtractionResult> {
  try {
    console.log('📰 Starting article extraction for:', articleUrl);
    
    // Validate URL
    if (!isValidUrl(articleUrl)) {
      throw new Error('Invalid URL provided');
    }

    // Fetch HTML content
    console.log('🌐 Fetching HTML content...');
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 Fetched HTML content (${html.length} characters)`);

    // Simple HTML parsing using regex (React Native compatible)
    console.log('📖 Parsing content...');
    const articleData = parseArticleHtml(html, articleUrl);

    if (!articleData.textContent || articleData.textContent.trim().length < 100) {
      throw new Error('Extracted content is too short or empty. This might not be a readable article.');
    }

    console.log(`✅ Successfully extracted article content (${articleData.textContent.length} characters)`);

    return articleData;

  } catch (error) {
    console.error('❌ Article extraction error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to extract content from article'
    );
  }
}

/**
 * Parse HTML content to extract article data
 * @param html HTML content
 * @param url Article URL
 * @returns Parsed article data
 */
function parseArticleHtml(html: string, url: string): ArticleExtractionResult {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].trim() : extractTitleFromUrl(url);
  
  // Clean up title
  title = title.replace(/\s*-\s*[^-]*$/, ''); // Remove site name
  title = decodeHtmlEntities(title);

  // Extract meta description as excerpt
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const excerpt = descriptionMatch ? decodeHtmlEntities(descriptionMatch[1]) : undefined;

  // Extract byline/author
  const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i) ||
                     html.match(/by\s+([^<\n]+)/i);
  const byline = authorMatch ? authorMatch[1].trim() : undefined;

  // Extract main content
  let textContent = extractMainContent(html);
  
  return {
    textContent,
    title,
    byline,
    excerpt,
    url,
  };
}

/**
 * Extract main content from HTML using heuristics
 * @param html HTML content
 * @returns Extracted text content
 */
function extractMainContent(html: string): string {
  // Remove script and style tags
  let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<!--[\s\S]*?-->/g, '');

  // Look for common article containers
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class[^>]*article[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class[^>]*content[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class[^>]*post[^>]*>([\s\S]*?)<\/div>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
  ];

  let extractedContent = '';
  
  for (const selector of contentSelectors) {
    const matches = content.match(selector);
    if (matches && matches[0]) {
      extractedContent = matches[0];
      break;
    }
  }

  // Fallback: extract body content
  if (!extractedContent) {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/gi);
    extractedContent = bodyMatch ? bodyMatch[0] : content;
  }

  // Extract text from paragraphs and headers
  const textElements = extractedContent.match(/<(?:p|h[1-6]|div)[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/(?:p|h[1-6]|div)>/gi);
  
  let textContent = '';
  if (textElements) {
    textContent = textElements
      .map(element => {
        // Remove HTML tags
        const text = element.replace(/<[^>]*>/g, ' ');
        return decodeHtmlEntities(text);
      })
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Final fallback: strip all HTML
  if (!textContent || textContent.length < 200) {
    textContent = extractedContent.replace(/<[^>]*>/g, ' ');
    textContent = decodeHtmlEntities(textContent);
    textContent = textContent.replace(/\s+/g, ' ').trim();
  }

  return cleanTextContent(textContent);
}

/**
 * Clean and normalize extracted text content
 * @param text Raw text content
 * @returns Cleaned text content
 */
function cleanTextContent(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common web artifacts
    .replace(/\s*(Share|Tweet|Pin|Email|Print|Subscribe|Newsletter|Advertisement|Cookie|Privacy)\s*/gi, ' ')
    // Clean up punctuation spacing
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/([,.!?])\s*([a-zA-Z])/g, '$1 $2')
    // Remove very short lines
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 10)
    .join('\n')
    .trim();
}

/**
 * Decode HTML entities
 * @param text Text with HTML entities
 * @returns Decoded text
 */
function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&hellip;': '...',
    '&mdash;': '—',
    '&ndash;': '–',
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&lsquo;': "'",
    '&rsquo;': "'",
  };
  
  // Replace numeric entities
  text = text.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });
  
  // Replace named entities
  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Extract a basic title from URL if no title is found
 * @param url Article URL
 * @returns Basic title extracted from URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract filename or last path segment
    const segments = pathname.split('/').filter(seg => seg.length > 0);
    const lastSegment = segments[segments.length - 1] || urlObj.hostname;
    
    // Clean up and format as title
    return lastSegment
      .replace(/[-_]/g, ' ')
      .replace(/\.[^.]*$/, '') // Remove file extension
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
      .trim();
  } catch {
    return 'Article';
  }
}

/**
 * Validate if string is a valid URL
 * @param string URL string to validate
 * @returns True if valid URL
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if URL is likely to be an article page
 * @param url URL to check
 * @returns True if likely an article
 */
export function isLikelyArticleUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Common news/blog/article domains
    const articleDomains = [
      'medium.com', 'substack.com', 'dev.to', 'hashnode.com',
      'wordpress.com', 'blogspot.com', 'ghost.org',
      'nytimes.com', 'washingtonpost.com', 'theguardian.com',
      'bbc.com', 'cnn.com', 'reuters.com', 'ap.org',
      'techcrunch.com', 'arstechnica.com', 'wired.com',
      'atlantic.com', 'newyorker.com', 'economist.com',
    ];
    
    // Check if domain is known article site
    if (articleDomains.some(domain => hostname.includes(domain))) {
      return true;
    }
    
    // Check path patterns that suggest articles
    const articlePatterns = [
      /\/article[s]?\//,
      /\/blog\//,
      /\/news\//,
      /\/post[s]?\//,
      /\/story\//,
      /\/\d{4}\/\d{2}\/\d{2}\//,  // Date-based paths
      /\/[a-z0-9-]+\.html?$/,      // HTML files
    ];
    
    return articlePatterns.some(pattern => pattern.test(pathname));
    
  } catch {
    return false;
  }
}

/**
 * Extract domain name from URL for display
 * @param url Article URL
 * @returns Domain name
 */
export function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
}
