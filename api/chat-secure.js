// Secure Vercel Edge Function with server-side prompt and scoring
import { SYSTEM_PROMPT, calculateLeadScore } from './system-prompt.js';

// Fallback function to extract data from conversation
function extractFromConversation(messages) {
  const extracted = {
    name: "",
    company: "",
    email: "",
    phone: "",
    projectType: "",
    timeline: "",
    budget: "",
    score: 50
  };
  
  // Combine all user messages
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');
  
  // Extract email
  const emailMatch = userText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) extracted.email = emailMatch[0];
  
  // Extract phone
  const phoneMatch = userText.match(/\b(?:\+?61|0)?4\d{8}\b|\b\d{10}\b/);
  if (phoneMatch) extracted.phone = phoneMatch[0];
  
  // Extract name (look for "I am" or "My name is" patterns)
  const nameMatch = userText.match(/(?:i am|my name is|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (nameMatch) extracted.name = nameMatch[1];
  
  // Try to identify project type from conversation
  if (userText.toLowerCase().includes('automation')) extracted.projectType = 'AI Automation';
  if (userText.toLowerCase().includes('integration')) extracted.projectType = 'AI Integration';
  if (userText.toLowerCase().includes('chatbot')) extracted.projectType = 'Chatbot Development';
  
  console.log('Fallback extraction result:', extracted);
  return extracted;
}

export default async function handler(req, res) {
  // Restrict CORS to your domain (update in production)
  const allowedOrigins = [
    'https://amplifyx.com.au',
    'https://www.amplifyx.com.au',
    'http://localhost:3000', // for local development
    'http://localhost:8000', // Python HTTP server
    'http://localhost:8080', // Python HTTP server (alternative port)
    'http://127.0.0.1:5500', // VS Code Live Server
    'http://127.0.0.1:8000', // Python HTTP server
    'http://127.0.0.1:8080' // Python HTTP server (alternative port)
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
        model: 'gpt-4o',  // Upgraded from gpt-4o-mini for better instruction following
        messages: fullMessages,
        max_tokens: 500,  // Increased to ensure structured data is included
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error response:', data);
      return res.status(response.status).json(data);
    }
    
    // Get the AI response content
    const aiResponse = data.choices && data.choices[0] && data.choices[0].message 
      ? data.choices[0].message.content 
      : '';
    
    // If we have extracted data, calculate score server-side
    let serverScore = null;
    if (extractedData && extractedData.email) {
      serverScore = calculateLeadScore(extractedData);
      console.log(`[Session ${sessionId}] Lead score calculated:`, serverScore);
    }
    
    // Extract structured data from AI response if present
    let structuredData = null;
    const structuredDataMatch = aiResponse.match(/<!--STRUCTURED_DATA:(.*?)-->/s);
    if (structuredDataMatch) {
      try {
        structuredData = JSON.parse(structuredDataMatch[1].trim());
        console.log('✅ Extracted structured data:', structuredData);
      } catch (e) {
        console.error('❌ Failed to parse structured data:', e);
        console.log('Raw structured data string:', structuredDataMatch[1]);
      }
    } else {
      console.log('⚠️ No structured data found in AI response');
      
      // Fallback: Try to extract from conversation if this looks like a confirmation
      const lowerResponse = aiResponse.toLowerCase();
      if (lowerResponse.includes("i've passed") || 
          lowerResponse.includes("team will be in touch") ||
          lowerResponse.includes("they'll be in touch")) {
        console.log('📝 Attempting fallback extraction from conversation...');
        structuredData = extractFromConversation(messages);
      }
    }
    
    res.status(200).json({
      ...data,
      serverScore: serverScore,
      sessionId: sessionId,
      structuredData: structuredData
    });
    
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message 
    });
  }
}