// Configuration template for Amplifyx Chatbot
// Instructions:
// 1. Copy this file and rename to: config.js
// 2. Add your actual API keys
// 3. NEVER commit config.js to GitHub (it's in .gitignore)

window.AMPLIFYX_CONFIG = {
    // Your OpenAI API key - powers the chatbot for all visitors
    openaiApiKey: 'YOUR_OPENAI_API_KEY_HERE',
    
    // EmailJS configuration (optional - for email notifications)
    emailJS: {
        serviceId: 'YOUR_SERVICE_ID',
        templateId: 'YOUR_TEMPLATE_ID', 
        userId: 'YOUR_USER_ID'
    }
};