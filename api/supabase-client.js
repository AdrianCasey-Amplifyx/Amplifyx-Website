// Supabase client for server-side operations
// This file should only be used in Vercel Edge Functions, never on client

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service key for admin operations
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Save lead to Supabase
export async function saveLeadToSupabase(leadData, sessionId, conversation) {
  const supabase = getSupabaseAdmin();
  
  try {
    // First, create or get session
    let { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('sessions')
        .insert({
          id: sessionId,
          user_agent: leadData.userAgent || null,
          referrer: leadData.referrer || null
        })
        .select()
        .single();
      
      if (createError) throw createError;
      session = newSession;
    }
    
    // Use provided reference number or generate a new one
    const referenceNumber = leadData.referenceNumber || ('AMP-' + Date.now().toString(36).toUpperCase());
    console.log('Using reference number:', referenceNumber);
    
    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        session_id: sessionId,
        reference_number: referenceNumber,
        name: leadData.name || null,
        email: leadData.email,
        phone: leadData.phone || null,
        company: leadData.company || null,
        project_type: leadData.projectType || null,
        timeline: leadData.timeline || null,
        budget: leadData.budget || null,
        summary: leadData.summary || null,
        score: leadData.score || 0,
        qualified: leadData.score >= 60
      })
      .select()
      .single();
    
    if (leadError) throw leadError;
    
    // Insert conversation history
    if (conversation && conversation.length > 0) {
      const conversationData = conversation.map(msg => ({
        session_id: sessionId,
        lead_id: lead.id,
        role: msg.role,
        content: msg.content
      }));
      
      const { error: convError } = await supabase
        .from('conversations')
        .insert(conversationData);
      
      if (convError) console.error('Error saving conversation:', convError);
    }
    
    // Queue email confirmation
    const { error: emailError } = await supabase
      .from('email_queue')
      .insert({
        lead_id: lead.id,
        to_email: leadData.email,
        subject: `Thank you for contacting Amplifyx Technologies - Ref: ${referenceNumber}`,
        body: `Hi ${leadData.name || 'there'},\n\nThank you for your interest in our AI consulting services.\n\nYour reference number is: ${referenceNumber}\n\nWe'll be in touch within 24 hours to discuss your ${leadData.projectType || 'project'} in detail.\n\nBest regards,\nThe Amplifyx Technologies Team`
      });
    
    if (emailError) console.error('Error queuing email:', emailError);
    
    return {
      success: true,
      referenceNumber: referenceNumber,
      leadId: lead.id
    };
    
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get lead statistics (for admin dashboard)
export async function getLeadStats() {
  const supabase = getSupabaseAdmin();
  
  try {
    // Get total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    // Get qualified leads
    const { count: qualifiedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('qualified', true);
    
    // Get leads by status
    const { data: statusCounts } = await supabase
      .from('leads')
      .select('status')
      .select('status, count(*)')
      .group('status');
    
    // Get recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return {
      totalLeads,
      qualifiedLeads,
      statusCounts,
      recentLeads
    };
    
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}