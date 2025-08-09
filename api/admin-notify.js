// Admin notification endpoint for high-value leads
// Sends detailed email notifications to adrian@amplifyx.com.au

export default async function handler(req, res) {
  // Set CORS headers
  const allowedOrigins = [
    'https://amplifyx.com.au',
    'https://www.amplifyx.com.au',
    'https://amplifyx-chatbot.vercel.app',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
  ];
  
  const origin = req.headers.origin || 'https://amplifyx-chatbot.vercel.app';
  if (allowedOrigins.includes(origin)) {
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
    const { leadId, referenceNumber } = req.body;
    
    if (!leadId) {
      return res.status(400).json({ error: 'Lead ID is required' });
    }
    
    // Get Supabase configuration
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase not configured for admin notifications');
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    
    // Fetch lead data from Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (leadError || !lead) {
      console.error('Failed to fetch lead:', leadError);
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    // Get conversation history
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    
    if (convError) {
      console.error('Failed to fetch conversations:', convError);
    }
    
    // Generate conversation summary
    const conversationSummary = generateConversationSummary(conversations || []);
    
    // Determine lead temperature
    const leadTemp = getLeadTemperature(lead.score);
    
    // Format the email HTML
    const emailHtml = formatAdminEmail(lead, conversationSummary, conversations || [], leadTemp);
    
    // Send email using Resend (or your preferred service)
    const emailSent = await sendAdminEmail({
      to: 'adrian@amplifyx.com.au',
      subject: `${leadTemp.emoji} ${leadTemp.label} Lead: ${lead.name || 'Unknown'} - ${lead.company || 'No Company'} (Score: ${lead.score})`,
      html: emailHtml,
      lead: lead
    });
    
    if (emailSent) {
      return res.status(200).json({ 
        success: true, 
        message: 'Admin notification sent',
        leadScore: lead.score 
      });
    } else {
      return res.status(500).json({ error: 'Failed to send notification' });
    }
    
  } catch (error) {
    console.error('Error in admin notification:', error);
    return res.status(500).json({ 
      error: 'Failed to process notification',
      details: error.message 
    });
  }
}

// Generate a summary of the conversation
function generateConversationSummary(conversations) {
  if (!conversations || conversations.length === 0) {
    return 'No conversation history available.';
  }
  
  const userMessages = conversations.filter(c => c.role === 'user');
  if (userMessages.length === 0) {
    return 'No user messages in conversation.';
  }
  
  // Extract key information from user messages
  const summary = {
    messageCount: userMessages.length,
    firstMessage: userMessages[0]?.content || '',
    lastMessage: userMessages[userMessages.length - 1]?.content || '',
    keyPoints: []
  };
  
  // Look for key information in messages
  const allUserContent = userMessages.map(m => m.content).join(' ').toLowerCase();
  
  if (allUserContent.includes('automat')) summary.keyPoints.push('Interested in automation');
  if (allUserContent.includes('ai ') || allUserContent.includes('artificial')) summary.keyPoints.push('AI implementation needed');
  if (allUserContent.includes('integrat')) summary.keyPoints.push('System integration required');
  if (allUserContent.includes('customer service') || allUserContent.includes('support')) summary.keyPoints.push('Customer service focus');
  if (allUserContent.includes('loan') || allUserContent.includes('finance') || allUserContent.includes('fintech')) summary.keyPoints.push('Financial services industry');
  if (allUserContent.includes('urgent') || allUserContent.includes('asap') || allUserContent.includes('immediately')) summary.keyPoints.push('Urgent timeline');
  if (allUserContent.includes('budget') && allUserContent.match(/\d+k|\d+,000/)) summary.keyPoints.push('Budget specified');
  
  // Format summary
  let summaryText = `The prospect exchanged ${summary.messageCount} messages with our AI assistant.\n\n`;
  
  if (summary.keyPoints.length > 0) {
    summaryText += `**Key Points Discussed:**\n`;
    summary.keyPoints.forEach(point => {
      summaryText += `• ${point}\n`;
    });
    summaryText += '\n';
  }
  
  summaryText += `**First Message:** "${summary.firstMessage.substring(0, 150)}${summary.firstMessage.length > 150 ? '...' : ''}"\n\n`;
  
  if (summary.messageCount > 1) {
    summaryText += `**Last Message:** "${summary.lastMessage.substring(0, 150)}${summary.lastMessage.length > 150 ? '...' : ''}"`;
  }
  
  return summaryText;
}

// Determine lead temperature based on score
function getLeadTemperature(score) {
  if (score >= 85) return { emoji: '🔥', label: 'HOT', color: '#ff4444', priority: 'IMMEDIATE' };
  if (score >= 70) return { emoji: '🌡️', label: 'WARM', color: '#ff9944', priority: 'HIGH' };
  if (score >= 50) return { emoji: '💫', label: 'QUALIFIED', color: '#44aa44', priority: 'MEDIUM' };
  return { emoji: '❄️', label: 'COLD', color: '#4444ff', priority: 'LOW' };
}

// Format the admin notification email
function formatAdminEmail(lead, summary, conversations, leadTemp) {
  const phoneLink = lead.phone ? `tel:${lead.phone.replace(/\D/g, '')}` : '#';
  const emailLink = `mailto:${lead.email}?subject=Re: Your Amplifyx Technologies Inquiry - ${lead.reference_number}`;
  
  // Format conversation history
  let conversationHtml = '';
  conversations.forEach(msg => {
    const roleClass = msg.role === 'user' ? 'user-message' : 'assistant-message';
    const roleLabel = msg.role === 'user' ? 'Prospect' : 'AI Assistant';
    conversationHtml += `
      <div class="${roleClass}" style="margin: 10px 0; padding: 10px; background: ${msg.role === 'user' ? '#f0f0f0' : '#e8f4ff'}; border-radius: 8px;">
        <strong>${roleLabel}:</strong><br>
        ${msg.content.replace(/\n/g, '<br>')}
      </div>
    `;
  });
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .lead-score { font-size: 48px; font-weight: bold; margin: 10px 0; }
    .priority-badge { display: inline-block; padding: 5px 15px; background: ${leadTemp.color}; color: white; border-radius: 20px; font-weight: bold; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
    .info-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .info-value { font-size: 16px; font-weight: 500; margin-top: 5px; }
    .cta-buttons { margin: 30px 0; text-align: center; }
    .cta-button { display: inline-block; padding: 12px 30px; margin: 0 10px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
    .cta-button.secondary { background: #6c757d; }
    .summary-box { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .conversation-box { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; max-height: 500px; overflow-y: auto; }
    .follow-up-box { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${leadTemp.emoji} New ${leadTemp.label} Lead Alert</h1>
      <div class="lead-score">${lead.score}/100</div>
      <span class="priority-badge">PRIORITY: ${leadTemp.priority}</span>
    </div>
    
    <div class="content">
      <h2>Lead Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${lead.name || 'Not provided'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Company</div>
          <div class="info-value">${lead.company || 'Not provided'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value"><a href="${emailLink}">${lead.email}</a></div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${lead.phone ? `<a href="${phoneLink}">${lead.phone}</a>` : 'Not provided'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Project Type</div>
          <div class="info-value">${lead.project_type || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Timeline</div>
          <div class="info-value">${lead.timeline || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Budget</div>
          <div class="info-value">${lead.budget || 'Not specified'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Reference</div>
          <div class="info-value">${lead.reference_number}</div>
        </div>
      </div>
      
      <div class="cta-buttons">
        <a href="${emailLink}" class="cta-button">📧 Send Email</a>
        ${lead.phone ? `<a href="${phoneLink}" class="cta-button">📞 Call Now</a>` : ''}
        <a href="https://supabase.com/dashboard/project/gwxkufgvcxkluyprovaf/editor/29386" class="cta-button secondary">📊 View in Supabase</a>
      </div>
      
      <div class="summary-box">
        <h3>📝 Conversation Summary</h3>
        <div>${summary.replace(/\n/g, '<br>')}</div>
      </div>
      
      <div class="follow-up-box">
        <h3>⏰ Recommended Follow-up</h3>
        <p><strong>${leadTemp.priority === 'IMMEDIATE' ? 'Contact within 1 hour' : 
                  leadTemp.priority === 'HIGH' ? 'Contact within 4 hours' :
                  leadTemp.priority === 'MEDIUM' ? 'Contact within 24 hours' :
                  'Contact within 48 hours'}</strong></p>
        <p>This lead has been automatically qualified with a score of ${lead.score}/100 based on budget, timeline, and engagement level.</p>
      </div>
      
      <div class="conversation-box">
        <h3>💬 Full Conversation Transcript</h3>
        ${conversationHtml}
      </div>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
      
      <p style="color: #666; font-size: 14px; text-align: center;">
        This notification was automatically generated by the Amplifyx AI Assistant.<br>
        Lead captured at ${new Date(lead.created_at).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })} AEDT
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Send email using your preferred service
async function sendAdminEmail({ to, subject, html, lead }) {
  // Option 1: Using Resend (recommended)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Amplifyx AI <notifications@amplifyx.com.au>',
          to: [to],
          subject: subject,
          html: html,
          reply_to: lead.email
        })
      });
      
      if (response.ok) {
        console.log('Admin notification sent via Resend');
        return true;
      } else {
        const error = await response.text();
        console.error('Resend API error:', error);
        return false;
      }
    } catch (error) {
      console.error('Failed to send via Resend:', error);
      return false;
    }
  }
  
  // Option 2: Using SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }]
          }],
          from: { 
            email: 'notifications@amplifyx.com.au',
            name: 'Amplifyx AI'
          },
          reply_to: {
            email: lead.email,
            name: lead.name || 'Lead'
          },
          subject: subject,
          content: [{
            type: 'text/html',
            value: html
          }]
        })
      });
      
      if (response.ok || response.status === 202) {
        console.log('Admin notification sent via SendGrid');
        return true;
      } else {
        const error = await response.text();
        console.error('SendGrid API error:', error);
        return false;
      }
    } catch (error) {
      console.error('Failed to send via SendGrid:', error);
      return false;
    }
  }
  
  console.error('No email service configured (need RESEND_API_KEY or SENDGRID_API_KEY)');
  return false;
}