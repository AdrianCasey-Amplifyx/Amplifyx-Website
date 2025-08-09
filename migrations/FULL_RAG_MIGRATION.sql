-- =====================================================
-- COMPLETE RAG SYSTEM MIGRATION FOR SUPABASE
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for storing document chunks with embeddings
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536), -- OpenAI text-embedding-ada-002 dimension
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast similarity search using cosine distance
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx 
ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Table for tracking source documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source TEXT,
    type TEXT, -- 'manual', 'faq', 'case_study', 'website', etc.
    chunk_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function for semantic search
CREATE OR REPLACE FUNCTION search_knowledge(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    metadata JSONB,
    category TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.content,
        kb.metadata,
        kb.category,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamps on knowledge_base
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at 
BEFORE UPDATE ON knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update timestamps on knowledge_documents
DROP TRIGGER IF EXISTS update_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER update_knowledge_documents_updated_at 
BEFORE UPDATE ON knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE knowledge_base IS 'Stores document chunks with vector embeddings for RAG system';
COMMENT ON TABLE knowledge_documents IS 'Tracks source documents that have been chunked and embedded';
COMMENT ON FUNCTION search_knowledge IS 'Performs semantic similarity search on knowledge base';

-- =====================================================
-- ALSO ADD SUMMARY COLUMN TO LEADS TABLE
-- =====================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS summary TEXT;
COMMENT ON COLUMN leads.summary IS 'AI-generated summary of the conversation with the lead';

-- =====================================================
-- VERIFY INSTALLATION
-- =====================================================

-- Check if vector extension is installed
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
        THEN '✅ Vector extension installed successfully'
        ELSE '❌ Vector extension NOT installed'
    END AS vector_status;

-- Check if tables were created
SELECT 
    '✅ Tables created: ' || string_agg(tablename, ', ') AS table_status
FROM pg_tables 
WHERE tablename IN ('knowledge_base', 'knowledge_documents')
AND schemaname = 'public';

-- Check if function was created
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_knowledge')
        THEN '✅ Search function created successfully'
        ELSE '❌ Search function NOT created'
    END AS function_status;

-- Show summary column status
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'leads' AND column_name = 'summary'
        )
        THEN '✅ Summary column added to leads table'
        ELSE '❌ Summary column NOT added'
    END AS summary_column_status;