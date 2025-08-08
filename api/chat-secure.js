// Secure Vercel Edge Function with server-side prompt and scoring
import { SYSTEM_PROMPT, calculateLeadScore } from './system-prompt.js';

export default async function handler(req, res) {
  // Restrict CORS to your domain (update in production)
  const allowedOrigins = [
    'https://amplifyx.com.au',
    'https://www.amplifyx.com.au',
    'http://localhost:3000', // for local development
    'http://127.0.0.1:5500' // for VS Code Live Server
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get session ID from header (for future session management)
  const sessionId = req.headers['x-session-id'] || 'anonymous';
  
  // Your API key - set as environment variable in Vercel
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  try {
    const { messages, extractedData } = req.body;
    
    // Build messages with system prompt (server-side only!)
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];
    
    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: fullMessages,
        max_tokens: 250,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error response:', data);
      return res.status(response.status).json(data);
    }
    
    // If we have extracted data, calculate score server-side
    let serverScore = null;
    if (extractedData && extractedData.email) {
      serverScore = calculateLeadScore(extractedData);
      console.log(`[Session ${sessionId}] Lead score calculated:`, serverScore);
    }
    
    // Return response with server-calculated score
    res.status(200).json({
      ...data,
      serverScore: serverScore,
      sessionId: sessionId
    });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message 
    });
  }
}