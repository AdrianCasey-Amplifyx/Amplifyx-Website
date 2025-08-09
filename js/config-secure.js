// Secure public configuration for Amplifyx Chatbot
// This file contains ONLY public, non-sensitive configuration

window.AMPLIFYX_CONFIG = window.AMPLIFYX_CONFIG || {
    // Secure API endpoint (uses server-side prompt and scoring)
    secureApiUrl: 'https://amplifyx-chatbot.vercel.app/api/chat-secure',
    
    // Lead submission endpoint (saves to Supabase/Google Sheets)
    leadSubmitUrl: 'https://amplifyx-chatbot.vercel.app/api/lead-submit',
    
    // Public Supabase configuration (safe to expose - anon key only)
    supabase: {
        url: 'https://gwxkufgvcxkluyprovaf.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2OTQzNTIsImV4cCI6MjA3MDI3MDM1Mn0.d4Eij6qtIhZABZxxNEYRIElbKbRwuD1bL595je4KJ88'
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
        useSupabase: true, // Enable Supabase for lead storage
        useSecureApi: true, // Use server-side prompt and scoring
        enableAnalytics: false,
        debugMode: false
    }
};