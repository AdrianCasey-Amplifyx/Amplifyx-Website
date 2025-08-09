-- Amplifyx CRM Database Schema for Supabase
-- Run this entire script in the Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Sessions table (track unique visitors)
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,  -- Using TEXT to match our session ID format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Leads table (main customer data)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT REFERENCES sessions(id),
  reference_number TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  project_type TEXT,
  timeline TEXT,
  budget TEXT,
  score INTEGER DEFAULT 0,
  qualified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (chat history)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT REFERENCES sessions(id),
  lead_id UUID REFERENCES leads(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email queue table (for sending confirmations)
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_reference ON leads(reference_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);

-- Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Policies for service role (full access for your API)
CREATE POLICY "Service role has full access to sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role has full access to email_queue" ON email_queue
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create a new lead with conversation
CREATE OR REPLACE FUNCTION create_lead_with_conversation(
  p_session_id TEXT,
  p_reference_number TEXT,
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_company TEXT,
  p_project_type TEXT,
  p_timeline TEXT,
  p_budget TEXT,
  p_score INTEGER,
  p_qualified BOOLEAN,
  p_conversation JSONB
) RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
  v_message JSONB;
BEGIN
  -- Insert lead
  INSERT INTO leads (
    session_id, reference_number, name, email, phone, 
    company, project_type, timeline, budget, score, qualified
  ) VALUES (
    p_session_id, p_reference_number, p_name, p_email, p_phone,
    p_company, p_project_type, p_timeline, p_budget, p_score, p_qualified
  ) RETURNING id INTO v_lead_id;
  
  -- Insert conversation history
  FOR v_message IN SELECT * FROM jsonb_array_elements(p_conversation)
  LOOP
    INSERT INTO conversations (session_id, lead_id, role, content)
    VALUES (
      p_session_id,
      v_lead_id,
      v_message->>'role',
      v_message->>'content'
    );
  END LOOP;
  
  -- Queue confirmation email
  INSERT INTO email_queue (lead_id, to_email, subject, body)
  VALUES (
    v_lead_id,
    p_email,
    format('Thank you for contacting Amplifyx Technologies - Ref: %s', p_reference_number),
    format(E'Hi %s,\n\nThank you for your interest in our AI consulting services.\n\nYour reference number is: %s\n\nWe''ll be in touch within 24 hours to discuss your %s project in detail.\n\nBest regards,\nThe Amplifyx Technologies Team\n\nAdrian Casey\nFounder & AI Consultant\nadrian@amplifyx.com.au',
      COALESCE(p_name, 'there'),
      p_reference_number,
      COALESCE(p_project_type, 'AI')
    )
  );
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get lead statistics (for dashboard)
CREATE OR REPLACE FUNCTION get_lead_stats()
RETURNS TABLE (
  total_leads BIGINT,
  qualified_leads BIGINT,
  hot_leads BIGINT,
  today_leads BIGINT,
  this_week_leads BIGINT,
  avg_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_leads,
    COUNT(*) FILTER (WHERE qualified = true)::BIGINT as qualified_leads,
    COUNT(*) FILTER (WHERE score >= 70)::BIGINT as hot_leads,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as today_leads,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE))::BIGINT as this_week_leads,
    ROUND(AVG(score), 1) as avg_score
  FROM leads;
END;
$$ LANGUAGE plpgsql;

-- View for recent leads (useful for dashboard)
CREATE OR REPLACE VIEW recent_leads AS
SELECT 
  l.id,
  l.reference_number,
  l.name,
  l.email,
  l.phone,
  l.company,
  l.project_type,
  l.timeline,
  l.budget,
  l.score,
  l.qualified,
  l.status,
  l.created_at,
  COUNT(c.id) as message_count
FROM leads l
LEFT JOIN conversations c ON l.id = c.lead_id
GROUP BY l.id
ORDER BY l.created_at DESC
LIMIT 100;

-- View for email queue status
CREATE OR REPLACE VIEW email_queue_status AS
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;

-- Grant permissions for views
GRANT SELECT ON recent_leads TO anon, authenticated;
GRANT SELECT ON email_queue_status TO anon, authenticated;

-- Sample query to test the setup (you can run this after inserting data)
-- SELECT * FROM get_lead_stats();