// API endpoint for managing knowledge base entries
// Handles adding, updating, and retrieving knowledge with embeddings

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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const supabase = getSupabaseAdmin();
  
  try {
    // GET - Retrieve knowledge entries
    if (req.method === 'GET') {
      const { category, limit = 50 } = req.query;
      
      let query = supabase
        .from('knowledge_base')
        .select('id, content, metadata, category, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return res.status(200).json({ data });
    }
    
    // POST - Add new knowledge entry with embedding
    if (req.method === 'POST') {
      const { content, category, metadata = {} } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }
      
      // Generate embedding for the content
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
          input: content,
          model: 'text-embedding-ada-002'
        })
      });
      
      if (!embeddingResponse.ok) {
        throw new Error('Failed to generate embedding');
      }
      
      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;
      
      // Store in Supabase with embedding
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          content,
          category,
          metadata,
          embedding: `[${embedding.join(',')}]` // Format as PostgreSQL array
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({ 
        success: true,
        data: {
          id: data.id,
          content: data.content,
          category: data.category,
          metadata: data.metadata
        }
      });
    }
    
    // PUT - Update existing knowledge entry
    if (req.method === 'PUT') {
      const { id, content, category, metadata } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      
      let updateData = { category, metadata };
      
      // If content changed, regenerate embedding
      if (content) {
        const openaiKey = process.env.OPENAI_API_KEY;
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input: content,
            model: 'text-embedding-ada-002'
          })
        });
        
        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;
          updateData.content = content;
          updateData.embedding = `[${embedding.join(',')}]`;
        }
      }
      
      const { data, error } = await supabase
        .from('knowledge_base')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(200).json({ success: true, data });
    }
    
    // DELETE - Remove knowledge entry
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'ID is required' });
      }
      
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Knowledge management error:', error);
    return res.status(500).json({
      error: 'Failed to manage knowledge',
      details: error.message
    });
  }
}