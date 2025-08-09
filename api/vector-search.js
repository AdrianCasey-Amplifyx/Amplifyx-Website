// API endpoint for semantic search using vector embeddings
// Finds relevant knowledge base entries for user queries

import { getSupabaseAdmin } from './supabase-client.js';

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
    const { query, matchThreshold = 0.7, matchCount = 5 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query text is required' });
    }
    
    // Generate embedding for the query
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-ada-002'
      })
    });
    
    if (!embeddingResponse.ok) {
      const error = await embeddingResponse.text();
      console.error('OpenAI API error:', error);
      return res.status(500).json({ 
        error: 'Failed to generate query embedding',
        details: error
      });
    }
    
    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    
    // Perform vector similarity search using Supabase RPC
    const supabase = getSupabaseAdmin();
    
    // Format embedding as PostgreSQL array string
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    
    // Call the search function
    const { data, error } = await supabase
      .rpc('search_knowledge', {
        query_embedding: embeddingString,
        match_threshold: matchThreshold,
        match_count: matchCount
      });
    
    if (error) {
      console.error('Supabase search error:', error);
      return res.status(500).json({ 
        error: 'Failed to search knowledge base',
        details: error.message
      });
    }
    
    // Return the search results
    return res.status(200).json({
      success: true,
      results: data || [],
      query: query,
      resultCount: data ? data.length : 0
    });
    
  } catch (error) {
    console.error('Vector search error:', error);
    return res.status(500).json({
      error: 'Failed to perform search',
      details: error.message
    });
  }
}