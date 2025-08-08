// Secure public configuration for Amplifyx Chatbot
// This file contains ONLY public, non-sensitive configuration

window.AMPLIFYX_CONFIG = window.AMPLIFYX_CONFIG || {
    // Secure API endpoint (uses server-side prompt and scoring)
    secureApiUrl: 'https://amplifyx-chatbot.vercel.app/api/chat-secure',
    
    // Public Supabase configuration (safe to expose - anon key only)
    supabase: {
        url: 'YOUR_SUPABASE_PROJECT_URL', // e.g., https://abc123.supabase.co
        anonKey: 'YOUR_SUPABASE_ANON_KEY' // This is safe to expose (public key)
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
        useSupabase: false, // Set to true when ready to migrate
        useSecureApi: true, // Use server-side prompt and scoring
        enableAnalytics: false,
        debugMode: false
    }
};