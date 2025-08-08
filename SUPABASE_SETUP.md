# Supabase Setup Guide for Amplifyx CRM

## Why Supabase?
- **Security**: Server-side database, not exposed in browser
- **Privacy**: Each session is isolated
- **Real-time**: Live updates for your CRM dashboard
- **Built-in Auth**: Ready for future user logins
- **Email Triggers**: Automatic email confirmations

## Setup Steps

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Choose a strong database password
4. Select region: Sydney (ap-southeast-2) for Australian users

### 2. Database Schema

Run these SQL commands in the Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (track unique visitors)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Leads table (main customer data)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
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
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (chat history)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
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
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_reference ON leads(reference_number);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);

-- Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous users (chatbot visitors)
-- Sessions: Can only insert their own session
CREATE POLICY "Users can create sessions" ON sessions
  FOR INSERT WITH CHECK (true);

-- Leads: Can only insert/view their own leads (by session)
CREATE POLICY "Users can create leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (session_id::text = current_setting('app.session_id', true));

-- Conversations: Can insert and view own conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (session_id::text = current_setting('app.session_id', true));

-- Admin policies (for you to view all data)
-- You'll need to create an admin role and assign it to your user
```

### 3. Database Functions

```sql
-- Function to create a new lead with conversation
CREATE OR REPLACE FUNCTION create_lead_with_conversation(
  p_session_id UUID,
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
    'Thank you for contacting Amplifyx Technologies',
    format('Hi %s,\n\nThank you for your interest in our AI consulting services.\n\nYour reference number is: %s\n\nWe''ll be in touch within 24 hours to discuss your %s project.\n\nBest regards,\nAmplifyx Technologies',
      COALESCE(p_name, 'there'),
      p_reference_number,
      COALESCE(p_project_type, 'AI')
    )
  );
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to send email notifications for hot leads
CREATE OR REPLACE FUNCTION notify_hot_lead() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score >= 70 THEN
    -- This would integrate with your email service
    -- For now, just log it
    RAISE NOTICE 'Hot lead alert: % - Score: %', NEW.email, NEW.score;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hot_lead_notification
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_hot_lead();
```

### 4. Environment Variables

Add to your Vercel project:
```
SUPABASE_URL=your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key (for admin operations)
```

### 5. Email Service Integration

For email confirmations, you can use:
- **Resend** (recommended - great developer experience)
- **SendGrid** (more features, more complex)
- **Supabase Edge Functions** (built-in)

### 6. Client SDK Setup

Install Supabase client:
```bash
npm install @supabase/supabase-js
```

## Benefits Over Google Sheets

1. **Proper Database**: Structured data, relationships, indexes
2. **Security**: Row-level security, encrypted data
3. **Scalability**: Handles thousands of leads efficiently
4. **Real-time**: Live updates without polling
5. **Analytics**: SQL queries for insights
6. **Automation**: Database triggers for workflows
7. **API**: RESTful API out of the box
8. **Backups**: Automatic daily backups

## Migration Path

1. Export existing Google Sheets data as CSV
2. Import into Supabase using the dashboard
3. Update website to use new Supabase backend
4. Test thoroughly before switching over
5. Keep Google Sheets as backup for 30 days

## CRM Dashboard

Supabase provides a built-in dashboard, or you can build a custom one:
- View all leads
- Filter by status/score
- Search functionality
- Export capabilities
- Email tracking
- Conversation history

## Cost

- **Free tier**: 500MB database, 2GB storage, 50,000 API requests/month
- **Pro tier**: $25/month for more resources
- Your current usage would fit comfortably in the free tier