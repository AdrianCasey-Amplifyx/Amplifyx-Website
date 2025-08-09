#!/bin/bash

echo "🚀 Running Supabase Schema Setup..."
echo "=================================="

# Just open the SQL editor with instructions
open "https://supabase.com/dashboard/project/gwxkufgvcxkluyprovaf/sql/new"

echo ""
echo "📋 INSTRUCTIONS:"
echo "1. The SQL editor has opened in your browser"
echo "2. Copy the contents of: supabase-schema.sql"
echo "3. Paste into the SQL editor"
echo "4. Click 'Run' or press Cmd+Enter"
echo ""
echo "Opening the schema file for you to copy..."
echo ""

# Show the first part of the schema
head -30 supabase-schema.sql

echo ""
echo "... (221 lines total)"
echo ""
echo "The file is located at: $(pwd)/supabase-schema.sql"
echo ""

# Also copy to clipboard if possible
if command -v pbcopy &> /dev/null; then
    cat supabase-schema.sql | pbcopy
    echo "✅ Schema copied to clipboard! Just paste in the SQL editor."
else
    echo "Copy the schema from: supabase-schema.sql"
fi