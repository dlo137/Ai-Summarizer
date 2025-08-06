import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test endpoint to verify basic functionality
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text input' });
    }

    // Check if OpenAI API key is present
    if (!process.env.OPENAI_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'OPENAI_SECRET_KEY environment variable is missing'
      });
    }

    // Log the request for debugging
    console.log('Request received:', {
      textLength: text.length,
      textPreview: text.substring(0, 100),
      hasApiKey: !!process.env.OPENAI_SECRET_KEY
    });

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Summarize the following document clearly and concisely. Provide the main points and key insights in a structured format.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    console.log('OpenAI response status:', openaiRes.status);

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.log('OpenAI error response:', errorText);
      
      return res.status(500).json({ 
        error: 'OpenAI API error', 
        status: openaiRes.status,
        details: errorText,
        apiKeyPresent: !!process.env.OPENAI_SECRET_KEY
      });
    }

    const data = await openaiRes.json();
    console.log('OpenAI response data:', data);

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ 
        error: 'Invalid OpenAI response', 
        detail: data,
        received: JSON.stringify(data, null, 2)
      });
    }

    return res.status(200).json({ 
      summary: data.choices[0].message.content,
      debug: {
        inputLength: text.length,
        tokensUsed: data.usage?.total_tokens || 'unknown'
      }
    });
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    });
  }
}
