-- Add summary column to leads table
-- This stores an AI-generated summary of the conversation

ALTER TABLE leads ADD COLUMN IF NOT EXISTS summary TEXT;

-- Optional: Add comment to describe the column
COMMENT ON COLUMN leads.summary IS 'AI-generated summary of the conversation with the lead';