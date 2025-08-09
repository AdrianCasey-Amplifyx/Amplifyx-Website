#!/bin/bash

# Vercel Environment Variables Setup for Supabase

echo "Setting up Vercel environment variables..."

# Set the environment variables
echo "https://gwxkufgvcxkluyprovaf.supabase.co" | vercel env add SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2OTQzNTIsImV4cCI6MjA3MDI3MDM1Mn0.d4Eij6qtIhZABZxxNEYRIElbKbRwuD1bL595je4KJ88" | vercel env add SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY5NDM1MiwiZXhwIjoyMDcwMjcwMzUyfQ.BjU-O33ec3WtM3NxLQPw3JCYTeweGxBDONrZrj_zAx4" | vercel env add SUPABASE_SERVICE_KEY production

echo "Environment variables added!"