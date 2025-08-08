// Public configuration for Amplifyx Chatbot
// This file is used when private config.js is not available (e.g., on GitHub Pages)
// For local development with API keys, use config.js instead

window.AMPLIFYX_CONFIG = window.AMPLIFYX_CONFIG || {
    // API key must be provided through other means for public deployment
    openaiApiKey: null,
    
    // EmailJS configuration (safe to expose - these are public IDs)
    emailJS: {
        serviceId: 'YOUR_SERVICE_ID',  // Add your EmailJS service ID here
        templateId: 'YOUR_TEMPLATE_ID', // Add your EmailJS template ID here
        userId: 'YOUR_USER_ID'         // Add your EmailJS user ID here
    },
    
    // Fallback mode when no API key is available
    fallbackMode: true,
    
    // Instructions for visitors
    setupInstructions: "This chatbot requires configuration. Please contact the website administrator."
};