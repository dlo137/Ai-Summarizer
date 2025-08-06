import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text input' });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: 'OpenAI response error', detail: data });
    }

    return res.status(200).json({ summary: data.choices[0].message.content });
  } catch (err) {
    console.error('Summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
