// Lead submission endpoint for Supabase
// Handles structured data from chatbot and saves to database

export default async function handler(req, res) {
  // Set CORS headers
  const allowedOrigins = [
    'https://amplifyx.com.au',
    'https://www.amplifyx.com.au',
    'https://amplifyx-chatbot.vercel.app',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8000',
    'null' // Allow file:// protocol for testing
  ];
  
  const origin = req.headers.origin || 'null';
  if (allowedOrigins.includes(origin) || origin === 'null') {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { sessionId, structuredData, conversation } = req.body;
    
    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    if (!structuredData || !structuredData.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(structuredData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Prepare lead data with proper field mapping
    const leadData = {
      name: structuredData.name || null,
      email: structuredData.email,
      phone: structuredData.phone || null,
      company: structuredData.company || null,
      projectType: structuredData.projectType || structuredData.project_type || null,
      timeline: structuredData.timeline || null,
      budget: structuredData.budget || null,
      score: structuredData.score || 0,
      userAgent: req.headers['user-agent'] || null,
      referrer: req.headers.referer || null
    };
    
    // Check if we have Supabase configured
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured');
      return res.status(500).json({
        error: 'Database configuration missing',
        details: 'Please configure Supabase environment variables'
      });
    }
    
    // Save to Supabase
    const { saveLeadToSupabase } = await import('./supabase-client.js');
    const result = await saveLeadToSupabase(leadData, sessionId, conversation);
    
    if (result.success) {
      // Trigger admin notification for high-value leads
      if (leadData.score >= 70) {
        try {
          // Call admin notification endpoint
          await fetch('https://amplifyx-chatbot.vercel.app/api/admin-notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: result.leadId,
              referenceNumber: result.referenceNumber
            })
          });
        } catch (notifyError) {
          console.error('Admin notification failed:', notifyError);
          // Don't fail the lead submission if notification fails
        }
      }
      
      return res.status(200).json({
        success: true,
        referenceNumber: result.referenceNumber,
        leadId: result.leadId,
        message: 'Lead saved successfully'
      });
    } else {
      console.error('Supabase save failed:', result.error);
      return res.status(500).json({
        error: 'Failed to save lead',
        details: 'Database operation failed'
      });
    }
    
  } catch (error) {
    console.error('Error processing lead submission:', error);
    return res.status(500).json({
      error: 'Failed to save lead',
      details: error.message
    });
  }
}