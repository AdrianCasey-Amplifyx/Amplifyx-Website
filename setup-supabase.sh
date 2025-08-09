#!/bin/bash

# Supabase Setup Script for Amplifyx
# This script helps set up Supabase without restarting Claude

echo "🚀 Amplifyx Supabase Setup Script"
echo "=================================="
echo ""

# Project details
PROJECT_REF="hobaeblghefbwyxazqau"
PROJECT_URL="https://hobaeblghefbwyxazqau.supabase.co"
ACCESS_TOKEN="sbp_dd79466d1767c391f8e61a0655d5d9c0b7058611"

echo "📋 Project Details:"
echo "  Project Ref: $PROJECT_REF"
echo "  Project URL: $PROJECT_URL"
echo ""

# Step 1: Get API Keys
echo "Step 1: Getting API Keys from Supabase..."
echo "Opening Supabase API settings page..."
open "https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
echo ""
echo "⚠️  IMPORTANT: Copy these keys from the page that opened:"
echo "  1. anon (public) key - for SUPABASE_ANON_KEY"
echo "  2. service_role (secret) key - for SUPABASE_SERVICE_KEY"
echo ""
read -p "Press Enter after copying the keys..."

# Step 2: Get the keys from user
echo ""
read -p "Paste the anon (public) key: " ANON_KEY
read -p "Paste the service_role (secret) key: " SERVICE_KEY

# Step 3: Add to Vercel
echo ""
echo "Step 2: Adding to Vercel Environment Variables..."
echo ""
echo "Add these to Vercel Dashboard:"
echo "https://vercel.com/adriancasey-amplifyxs-projects/amplifyx-chatbot/settings/environment-variables"
echo ""
echo "SUPABASE_URL=$PROJECT_URL"
echo "SUPABASE_ANON_KEY=$ANON_KEY"
echo "SUPABASE_SERVICE_KEY=$SERVICE_KEY"
echo ""
read -p "Press Enter after adding to Vercel..."

# Step 4: Update local config
echo ""
echo "Step 3: Updating local configuration..."
cat > js/config-secure.js << EOF
// Secure public configuration for Amplifyx Chatbot
// This file contains ONLY public, non-sensitive configuration

window.AMPLIFYX_CONFIG = window.AMPLIFYX_CONFIG || {
    // Secure API endpoint (uses server-side prompt and scoring)
    secureApiUrl: 'https://amplifyx-chatbot.vercel.app/api/chat-secure',
    
    // Lead submission endpoint (saves to Supabase/Google Sheets)
    leadSubmitUrl: 'https://amplifyx-chatbot.vercel.app/api/lead-submit',
    
    // Public Supabase configuration (safe to expose - anon key only)
    supabase: {
        url: '$PROJECT_URL',
        anonKey: '$ANON_KEY'
    },
    
    // Email service configuration (for client-side email forms if needed)
    emailService: {
        provider: 'resend', // or 'sendgrid'
        publicKey: 'YOUR_PUBLIC_KEY' // If your email service uses public keys
    },
    
    // Analytics (optional)
    analytics: {
        googleAnalytics: 'YOUR_GA_ID',
        mixpanel: 'YOUR_MIXPANEL_TOKEN'
    },
    
    // Feature flags
    features: {
        useSupabase: true, // Set to true when ready to migrate
        useSecureApi: true, // Use server-side prompt and scoring
        enableAnalytics: false,
        debugMode: false
    }
};
EOF

echo "✅ Local config updated"

# Step 5: Deploy
echo ""
echo "Step 4: Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Run the SQL schema in Supabase SQL Editor"
echo "2. Test the chatbot on your website"
echo "3. Check Supabase tables for captured data"
echo ""
echo "SQL Schema file: supabase-schema.sql"