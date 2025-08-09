// Public configuration for Amplifyx Chatbot
// This file is used when private config.js is not available (e.g., on GitHub Pages)
// For local development with API keys, use config.js instead

window.AMPLIFYX_CONFIG = window.AMPLIFYX_CONFIG || {
    // Vercel API proxy endpoint - this is the WORKING endpoint
    apiProxyUrl: 'https://amplifyx-chatbot.vercel.app/api/chat',
    
    // Supabase lead submission endpoint
    leadSubmitUrl: 'https://amplifyx-chatbot.vercel.app/api/lead-submit',
    
    // RAG system endpoints
    vectorSearchUrl: 'https://amplifyx-chatbot.vercel.app/api/vector-search',
    knowledgeManageUrl: 'https://amplifyx-chatbot.vercel.app/api/knowledge-manage',
    
    // EmailJS configuration (safe to expose - these are public IDs)
    emailJS: {
        serviceId: 'YOUR_SERVICE_ID',  // Add your EmailJS service ID here
        templateId: 'YOUR_TEMPLATE_ID', // Add your EmailJS template ID here
        userId: 'YOUR_USER_ID'         // Add your EmailJS user ID here
    }
};