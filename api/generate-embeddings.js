// API endpoint for generating OpenAI embeddings
// Used by the RAG system to create vector representations of text

export default async function handler(req, res) {
  // Set CORS headers
  const allowedOrigins = [
    'https://amplifyx.com.au',
    'https://www.amplifyx.com.au',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ];
  
  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin) || origin.includes('localhost')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Check if OpenAI API key is configured
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    // Call OpenAI embeddings API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({ 
        error: 'Failed to generate embedding',
        details: error
      });
    }
    
    const data = await response.json();
    
    // Return the embedding vector
    return res.status(200).json({
      embedding: data.data[0].embedding,
      model: data.model,
      usage: data.usage
    });
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    return res.status(500).json({
      error: 'Failed to generate embedding',
      details: error.message
    });
  }
}