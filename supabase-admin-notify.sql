-- Supabase Admin Notification Setup
-- This script adds email notification functionality for high-value leads
-- Run this in the Supabase SQL editor after the main schema is set up

-- Enable the HTTP extension for making external API calls
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

-- Function to send admin notification for high-value leads
CREATE OR REPLACE FUNCTION notify_admin_on_high_value_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_webhook_url TEXT;
  v_request_id BIGINT;
BEGIN
  -- Only notify for leads with score >= 70
  IF NEW.score >= 70 THEN
    -- Set the webhook URL (update this to your production URL)
    v_webhook_url := 'https://amplifyx-chatbot.vercel.app/api/admin-notify';
    
    -- Log the notification attempt
    RAISE NOTICE 'Sending admin notification for lead % with score %', NEW.id, NEW.score;
    
    -- Make async HTTP request to notification endpoint
    SELECT net.http_post(
      url := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'leadId', NEW.id,
        'referenceNumber', NEW.reference_number,
        'score', NEW.score,
        'timestamp', NOW()
      )
    ) INTO v_request_id;
    
    -- Log the request ID for debugging
    RAISE NOTICE 'Admin notification request ID: %', v_request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin notifications
DROP TRIGGER IF EXISTS trigger_admin_notification ON leads;
CREATE TRIGGER trigger_admin_notification
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_on_high_value_lead();

-- Function to manually trigger admin notification (for testing)
CREATE OR REPLACE FUNCTION send_admin_notification(p_lead_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lead RECORD;
  v_webhook_url TEXT;
  v_request_id BIGINT;
  v_result JSONB;
BEGIN
  -- Get lead details
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lead not found');
  END IF;
  
  -- Set the webhook URL
  v_webhook_url := 'https://amplifyx-chatbot.vercel.app/api/admin-notify';
  
  -- Make HTTP request
  SELECT net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'leadId', v_lead.id,
      'referenceNumber', v_lead.reference_number,
      'score', v_lead.score,
      'manual', true,
      'timestamp', NOW()
    )
  ) INTO v_request_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'requestId', v_request_id,
    'leadId', v_lead.id,
    'leadScore', v_lead.score,
    'message', 'Notification request sent'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for the service role
GRANT EXECUTE ON FUNCTION notify_admin_on_high_value_lead() TO service_role;
GRANT EXECUTE ON FUNCTION send_admin_notification(UUID) TO service_role;

-- Create a view for monitoring notification attempts (optional)
CREATE OR REPLACE VIEW admin_notification_log AS
SELECT 
  id,
  created,
  method,
  url,
  headers,
  body,
  response_status
FROM net._http_response
WHERE url LIKE '%admin-notify%'
ORDER BY created DESC
LIMIT 100;

-- Grant access to the monitoring view
GRANT SELECT ON admin_notification_log TO service_role;

-- Test the setup by checking if functions were created
SELECT 
  'notify_admin_on_high_value_lead' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'notify_admin_on_high_value_lead'
    ) THEN '✅ Created'
    ELSE '❌ Not found'
  END as status
UNION ALL
SELECT 
  'send_admin_notification' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'send_admin_notification'
    ) THEN '✅ Created'
    ELSE '❌ Not found'
  END as status
UNION ALL
SELECT 
  'trigger_admin_notification' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_admin_notification'
    ) THEN '✅ Created'
    ELSE '❌ Not found'
  END as status;

-- Instructions for testing:
-- 1. Run this entire script in Supabase SQL editor
-- 2. To test manually with an existing lead:
--    SELECT send_admin_notification('YOUR_LEAD_ID_HERE'::uuid);
-- 3. To view notification attempts:
--    SELECT * FROM admin_notification_log;