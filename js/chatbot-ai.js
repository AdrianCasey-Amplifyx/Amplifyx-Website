// AI-Driven Chatbot with EmailJS Integration for Amplifyx Technologies
// This version uses OpenAI for natural conversation while maintaining lead qualification

// Configuration
const CHATBOT_CONFIG = {
    // OpenAI settings - uses proxy if available, direct API otherwise
    apiEndpoint: window.AMPLIFYX_CONFIG?.apiProxyUrl || 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 200,
    temperature: 0.7,
    
    // EmailJS settings (TO BE CONFIGURED)
    emailJS: {
        serviceId: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
        templateId: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
        userId: 'YOUR_USER_ID' // Replace with your EmailJS user ID
    },
    
    // Rate limiting
    maxMessagesPerSession: 30,
    maxMessagesPerMinute: 5,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    
    // Spam detection
    minMessageLength: 2,
    maxMessageLength: 500,
    spamKeywords: ['viagra', 'casino', 'lottery', 'prince', 'inheritance', 'crypto', 'nft'],
    
    // Lead settings
    recipientEmail: 'adrian@amplifyx.com.au'
};

// System prompt for AI with strict guard rails
const SYSTEM_PROMPT = `You are a professional lead qualification assistant for Amplifyx Technologies, an AI consultancy that helps companies with rapid prototyping, AI integration, and fractional product leadership.

YOUR PRIMARY GOAL: Qualify leads by naturally collecting the following information through conversation:
- Name
- Company/Organization
- Email address
- Project type or AI needs
- Timeline for implementation
- Budget range

IMPORTANT RULES:
1. Be professional, friendly, and enthusiastic about AI and product development
2. Keep ALL conversations focused on Amplifyx's services and the client's business needs
3. If asked about unrelated topics, politely redirect: "I appreciate your question, but I'm specifically here to help you explore how Amplifyx Technologies can accelerate your product development with AI. What aspect of AI integration interests you most?"
4. Never discuss: personal topics, competitors, general advice unrelated to business
5. Always emphasize Amplifyx's core offerings: AI integration, rapid prototyping, fractional CTO services, AI research, automation
6. Extract information naturally - don't make it feel like an interrogation
7. When you have enough information, let the user know you'll need to confirm their details

CONVERSATION STYLE:
- Use "we" when referring to Amplifyx Technologies
- Be conversational but professional
- Show genuine interest in their project
- Ask follow-up questions based on their responses
- Validate their challenges and explain how Amplifyx can help

AMPLIFYX VALUE PROPOSITIONS TO EMPHASIZE:
- We help ship products in weeks, not quarters
- Onshore talent at fraction of traditional cost
- Expert AI integration without the learning curve
- From concept to production seamlessly
- De-risk AI investments with proof of concepts`;

// Chatbot State Management
class ChatbotState {
    constructor() {
        this.isOpen = false;
        this.messageCount = 0;
        this.sessionStartTime = null;
        this.recentMessages = [];
        this.conversationHistory = [];
        // API key will be set from environment or config
        this.apiKey = null;
        this.emailJSConfigured = false;
        
        // Lead data tracking
        this.leadData = {
            name: '',
            company: '',
            email: '',
            projectType: '',
            timeline: '',
            budget: '',
            qualified: false,
            confirmed: false,
            referenceNumber: '',
            score: 0
        };
        
        // Field tracking for AI extraction
        this.fieldsCollected = {
            name: false,
            company: false,
            email: false,
            projectType: false,
            timeline: false,
            budget: false
        };
        
        // Conversation state
        this.awaitingConfirmation = false;
        this.conversationMode = 'ai'; // 'ai' or 'fallback'
    }
    
    reset() {
        this.messageCount = 0;
        this.sessionStartTime = Date.now();
        this.recentMessages = [];
        this.conversationHistory = [];
        this.leadData = {
            name: '',
            company: '',
            email: '',
            projectType: '',
            timeline: '',
            budget: '',
            qualified: false,
            confirmed: false,
            referenceNumber: '',
            score: 0
        };
        this.fieldsCollected = {
            name: false,
            company: false,
            email: false,
            projectType: false,
            timeline: false,
            budget: false
        };
        this.awaitingConfirmation = false;
    }
    
    allFieldsCollected() {
        return Object.values(this.fieldsCollected).every(v => v === true);
    }
    
    getMissingFields() {
        return Object.entries(this.fieldsCollected)
            .filter(([_, collected]) => !collected)
            .map(([field, _]) => field);
    }
}

const chatbotState = new ChatbotState();

// DOM Elements
let chatbotContainer, chatbotToggle, chatbotWindow, chatbotMessages, 
    chatbotForm, chatbotInput, chatbotMinimize, chatIcon, closeIcon, chatBadge;

// Initialize Chatbot
function initChatbot() {
    // Get DOM elements
    chatbotContainer = document.getElementById('chatbot-container');
    chatbotToggle = document.getElementById('chatbot-toggle');
    chatbotWindow = document.getElementById('chatbot-window');
    chatbotMessages = document.getElementById('chatbot-messages');
    chatbotForm = document.getElementById('chatbot-form');
    chatbotInput = document.getElementById('chatbot-input');
    chatbotMinimize = document.getElementById('chatbot-minimize');
    chatIcon = chatbotToggle.querySelector('.chat-icon');
    closeIcon = chatbotToggle.querySelector('.close-icon');
    chatBadge = chatbotToggle.querySelector('.chat-badge');
    
    // Event listeners
    chatbotToggle.addEventListener('click', toggleChat);
    chatbotMinimize.addEventListener('click', toggleChat);
    chatbotForm.addEventListener('submit', handleSubmit);
    
    // Privacy link
    document.getElementById('privacy-link').addEventListener('click', (e) => {
        e.preventDefault();
        addBotMessage("We take your privacy seriously at Amplifyx Technologies. Your data is only used to understand your needs and provide relevant AI solutions. We never share your information without consent.");
    });
    
    // Check configurations
    checkConfigurations();
}

// Check API and EmailJS configurations
function checkConfigurations() {
    // Load API key from config
    if (window.AMPLIFYX_CONFIG && window.AMPLIFYX_CONFIG.openaiApiKey) {
        chatbotState.apiKey = window.AMPLIFYX_CONFIG.openaiApiKey;
    }
    
    // Check if EmailJS is configured
    if (window.AMPLIFYX_CONFIG && window.AMPLIFYX_CONFIG.emailJS) {
        const emailConfig = window.AMPLIFYX_CONFIG.emailJS;
        if (emailConfig.serviceId !== 'YOUR_SERVICE_ID') {
            chatbotState.emailJSConfigured = true;
            // Update config with values from external config
            CHATBOT_CONFIG.emailJS = emailConfig;
            // Initialize EmailJS
            if (typeof emailjs !== 'undefined') {
                emailjs.init(emailConfig.userId);
            }
        }
    }
}

// Toggle Chat Window
function toggleChat() {
    chatbotState.isOpen = !chatbotState.isOpen;
    
    if (chatbotState.isOpen) {
        chatbotWindow.classList.add('active');
        chatIcon.style.display = 'none';
        closeIcon.style.display = 'block';
        chatBadge.style.display = 'none';
        
        if (!chatbotState.sessionStartTime) {
            chatbotState.reset();
            initConversation();
        }
        
        setTimeout(() => chatbotInput.focus(), 300);
    } else {
        chatbotWindow.classList.remove('active');
        chatIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    }
}

// Initialize Conversation
async function initConversation() {
    chatbotMessages.innerHTML = '';
    
    // Check if we have an API key OR a proxy endpoint
    const hasProxy = window.AMPLIFYX_CONFIG?.apiProxyUrl;
    
    console.log('Checking AI availability:');
    console.log('- Config object:', window.AMPLIFYX_CONFIG);
    console.log('- Has proxy URL:', hasProxy);
    console.log('- Has API key:', !!chatbotState.apiKey);
    console.log('- API endpoint:', CHATBOT_CONFIG.apiEndpoint);
    
    if (chatbotState.apiKey || hasProxy) {
        // Start AI conversation (works with direct API or proxy)
        chatbotState.conversationMode = 'ai';
        await startAIConversation();
    } else {
        // No AI available - show professional error message
        chatbotState.conversationMode = 'unavailable';
        addBotMessage(
            "Sorry, the AI agent is not available at this time. Please try again later or contact us directly at adrian@amplifyx.com.au for immediate assistance."
        );
        // Disable input since AI is not available
        chatbotInput.disabled = true;
        chatbotInput.placeholder = "AI agent unavailable";
    }
}

// Start AI Conversation
async function startAIConversation() {
    const initialMessage = "Welcome to Amplifyx Technologies! I'm here to help you explore how we can accelerate your product development with AI. What brings you here today?";
    
    // Add to conversation history
    chatbotState.conversationHistory.push({
        role: 'assistant',
        content: initialMessage
    });
    
    addBotMessage(initialMessage, [
        "Need AI integration",
        "Rapid prototyping",
        "Fractional CTO services",
        "Just exploring"
    ]);
}

// Handle Form Submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = chatbotInput.value.trim();
    if (!message) return;
    
    // Rate limiting
    if (!checkRateLimit()) {
        addBotMessage("Please wait a moment before sending another message.");
        return;
    }
    
    // Spam check
    if (isSpam(message)) {
        addBotMessage("Please provide a valid message related to your business needs.");
        return;
    }
    
    // Add user message
    addUserMessage(message);
    chatbotInput.value = '';
    
    // Process based on conversation mode
    await processUserMessage(message);
}

// Process User Message
async function processUserMessage(message) {
    // Add to history
    chatbotState.conversationHistory.push({
        role: 'user',
        content: message
    });
    
    showTypingIndicator();
    
    // Handle based on conversation state
    if (chatbotState.conversationMode === 'unavailable') {
        // Don't process messages when AI is unavailable
        hideTypingIndicator();
        return;
    } else if (chatbotState.awaitingConfirmation) {
        await handleConfirmation(message);
    } else if (chatbotState.conversationMode === 'ai') {
        await handleAIConversation(message);
    }
    
    hideTypingIndicator();
}

// Handle AI Conversation
async function handleAIConversation(message) {
    
    // Extract fields from message
    extractFieldsFromMessage(message);
    
    // Check if we have all required fields
    if (chatbotState.allFieldsCollected() && !chatbotState.awaitingConfirmation) {
        showConfirmation();
        return;
    }
    
    try {
        // Prepare context message
        let contextMessage = "";
        const missingFields = chatbotState.getMissingFields();
        if (missingFields.length > 0 && Math.random() > 0.7) { // Occasionally remind to collect missing info
            contextMessage = `\n\n[Context: Still need to collect: ${missingFields.join(', ')}. Work these into the conversation naturally.]`;
        }
        
        // Determine the correct API endpoint (proxy or direct)
        const apiEndpoint = window.AMPLIFYX_CONFIG?.apiProxyUrl || 
                          (chatbotState.apiKey ? 'https://api.openai.com/v1/chat/completions' : null);
        
        if (!apiEndpoint) {
            throw new Error('No API endpoint available');
        }
        
        // Make API call (works with proxy or direct)
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Only add Authorization header if using direct API (not proxy)
        if (!apiEndpoint.includes('vercel.app') && chatbotState.apiKey) {
            headers['Authorization'] = `Bearer ${chatbotState.apiKey}`;
        }
        
        const requestBody = {
            model: CHATBOT_CONFIG.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + contextMessage },
                ...chatbotState.conversationHistory.slice(-10) // Last 10 messages for context
            ],
            max_tokens: CHATBOT_CONFIG.maxTokens,
            temperature: CHATBOT_CONFIG.temperature
        };
        
        console.log('Making API request:');
        console.log('- URL:', apiEndpoint);
        console.log('- Headers:', headers);
        console.log('- Body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response body:', errorText);
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add to history
        chatbotState.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        // Extract any fields from AI's understanding
        extractFieldsFromAIResponse(aiResponse);
        
        addBotMessage(aiResponse);
        
        // Check again if we have all fields after AI response
        if (chatbotState.allFieldsCollected() && !chatbotState.awaitingConfirmation) {
            setTimeout(() => {
                showConfirmation();
            }, 1500);
        }
        
    } catch (error) {
        console.error('AI Error Details:');
        console.error('- Error message:', error.message);
        console.error('- Error object:', error);
        console.error('- API endpoint attempted:', window.AMPLIFYX_CONFIG?.apiProxyUrl || 'Direct OpenAI');
        
        // Show error message and disable chat
        addBotMessage("Sorry, the AI agent encountered an error and is temporarily unavailable. Please try again later or contact us directly at adrian@amplifyx.com.au.");
        chatbotInput.disabled = true;
        chatbotInput.placeholder = "AI agent unavailable";
    }
}

// Extract Fields from Message
function extractFieldsFromMessage(message) {
    // Email extraction
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = message.match(emailRegex);
    if (emailMatch && !chatbotState.fieldsCollected.email) {
        chatbotState.leadData.email = emailMatch[0];
        chatbotState.fieldsCollected.email = true;
    }
    
    // Timeline extraction
    const timelineKeywords = {
        'asap': 'ASAP',
        'immediately': 'ASAP',
        'urgent': 'ASAP',
        'next week': 'Within 1 month',
        'this month': 'Within 1 month',
        'next month': '1-3 months',
        'quarter': '3-6 months',
        'next quarter': '3-6 months',
        'this year': '3-6 months',
        'exploring': 'Just researching',
        'researching': 'Just researching'
    };
    
    const lowerMessage = message.toLowerCase();
    for (const [keyword, value] of Object.entries(timelineKeywords)) {
        if (lowerMessage.includes(keyword) && !chatbotState.fieldsCollected.timeline) {
            chatbotState.leadData.timeline = value;
            chatbotState.fieldsCollected.timeline = true;
            break;
        }
    }
    
    // Budget extraction
    const budgetRegex = /\$?\d+k|\$\d{1,3},?\d{3,}|\d+k?\s*-\s*\d+k?/i;
    const budgetMatch = message.match(budgetRegex);
    if (budgetMatch && !chatbotState.fieldsCollected.budget) {
        chatbotState.leadData.budget = budgetMatch[0];
        chatbotState.fieldsCollected.budget = true;
    }
    
    // Name extraction (if message contains "I'm" or "My name is")
    const namePatterns = [
        /(?:i'm|i am|my name is|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i
    ];
    
    for (const pattern of namePatterns) {
        const nameMatch = message.match(pattern);
        if (nameMatch && !chatbotState.fieldsCollected.name) {
            chatbotState.leadData.name = nameMatch[1];
            chatbotState.fieldsCollected.name = true;
            break;
        }
    }
    
    // Company extraction
    const companyPatterns = [
        /(?:work at|from|with|represent|ceo of|founder of|work for)\s+([A-Z][A-Za-z0-9\s&.]+)/i,
        /(?:company|startup|business|organization) (?:is |called |named )?([A-Z][A-Za-z0-9\s&.]+)/i
    ];
    
    for (const pattern of companyPatterns) {
        const companyMatch = message.match(pattern);
        if (companyMatch && !chatbotState.fieldsCollected.company) {
            chatbotState.leadData.company = companyMatch[1].trim();
            chatbotState.fieldsCollected.company = true;
            break;
        }
    }
}

// Extract fields from AI response (for context awareness)
function extractFieldsFromAIResponse(response) {
    // AI might ask for specific fields, track what it's asking for
    const lowerResponse = response.toLowerCase();
    
    // Track if AI is asking for specific information
    if (lowerResponse.includes('your name') || lowerResponse.includes('may i ask who')) {
        // AI is asking for name
    }
    if (lowerResponse.includes('email') || lowerResponse.includes('reach you')) {
        // AI is asking for email
    }
    // Add more patterns as needed
}

// Show Confirmation
function showConfirmation() {
    chatbotState.awaitingConfirmation = true;
    
    const confirmationMessage = `
Excellent! Let me confirm the information I've collected:

📝 **Name:** ${chatbotState.leadData.name || '[Not provided]'}
🏢 **Company:** ${chatbotState.leadData.company || '[Not provided]'}
📧 **Email:** ${chatbotState.leadData.email || '[Not provided]'}
🚀 **Project:** ${chatbotState.leadData.projectType || 'AI Integration'}
⏱️ **Timeline:** ${chatbotState.leadData.timeline || '[Not provided]'}
💰 **Budget:** ${chatbotState.leadData.budget || '[To be discussed]'}

Is everything correct?`;
    
    setTimeout(() => {
        addBotMessage(confirmationMessage, [
            "Yes, looks good! ✅",
            "I need to update something 📝"
        ]);
    }, 500);
}

// Handle Confirmation
async function handleConfirmation(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('good') || lowerMessage.includes('✅')) {
        chatbotState.leadData.confirmed = true;
        chatbotState.awaitingConfirmation = false;
        await completeQualification();
    } else {
        chatbotState.awaitingConfirmation = false;
        addBotMessage("No problem! What would you like to update? Just type the correct information and I'll update it for you.");
    }
}

// Complete Qualification
async function completeQualification() {
    // Calculate lead score
    chatbotState.leadData.score = calculateLeadScore();
    chatbotState.leadData.qualified = chatbotState.leadData.score >= 60;
    
    // Generate reference number
    const referenceNumber = 'AMP-' + Date.now().toString(36).toUpperCase();
    chatbotState.leadData.referenceNumber = referenceNumber;
    
    // Send email
    await sendLeadEmail();
    
    // Thank you message
    const message = chatbotState.leadData.qualified
        ? `🎉 Perfect! Your information has been submitted successfully.\n\n**Reference Number:** ${referenceNumber}\n\nThank you, ${chatbotState.leadData.name || 'there'}! Based on our conversation, Amplifyx Technologies can definitely help accelerate your AI initiatives. Our team will reach out to you at **${chatbotState.leadData.email}** within 24 hours to discuss next steps.\n\nIs there anything else you'd like to know about our services?`
        : `✅ Thank you for your interest in Amplifyx Technologies!\n\n**Reference Number:** ${referenceNumber}\n\nWe've received your information and our team will review your requirements. We'll contact you at **${chatbotState.leadData.email}** soon with the best way forward.\n\nFeel free to ask me any questions about our AI consulting services!`;
    
    addBotMessage(message);
}

// Calculate Lead Score
function calculateLeadScore() {
    let score = 0;
    
    // Timeline scoring
    const timelineScores = {
        'ASAP': 30,
        'Within 1 month': 25,
        '1-3 months': 20,
        '3-6 months': 10,
        'Just researching': 5
    };
    score += timelineScores[chatbotState.leadData.timeline] || 0;
    
    // Budget scoring
    if (chatbotState.leadData.budget) {
        if (chatbotState.leadData.budget.includes('100k') || chatbotState.leadData.budget.includes('100,000')) score += 30;
        else if (chatbotState.leadData.budget.includes('50k') || chatbotState.leadData.budget.includes('50,000')) score += 25;
        else if (chatbotState.leadData.budget.includes('25k') || chatbotState.leadData.budget.includes('25,000')) score += 20;
        else if (chatbotState.leadData.budget.includes('10k') || chatbotState.leadData.budget.includes('10,000')) score += 15;
    }
    
    // Field completion scoring
    if (chatbotState.leadData.name) score += 10;
    if (chatbotState.leadData.company) score += 10;
    if (chatbotState.leadData.email) score += 15;
    if (chatbotState.leadData.projectType) score += 10;
    
    return score;
}

// Send Lead Email using EmailJS
async function sendLeadEmail() {
    // Log to console (always)
    console.log('=== LEAD SUBMISSION ===');
    console.log('Lead Data:', chatbotState.leadData);
    console.log('Score:', chatbotState.leadData.score);
    console.log('Qualified:', chatbotState.leadData.qualified);
    console.log('Reference:', chatbotState.leadData.referenceNumber);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Conversation:', chatbotState.conversationHistory);
    console.log('=======================');
    
    // Save to localStorage as backup
    const leads = JSON.parse(localStorage.getItem('amplifyx_leads') || '[]');
    leads.push({
        ...chatbotState.leadData,
        timestamp: new Date().toISOString(),
        conversation: chatbotState.conversationHistory
    });
    localStorage.setItem('amplifyx_leads', JSON.stringify(leads));
    
    // Send to Google Sheets if available
    if (typeof sendToGoogleSheets === 'function') {
        sendToGoogleSheets({
            ...chatbotState.leadData,
            conversation: chatbotState.conversationHistory
        });
    }
    
    // Send email if EmailJS is configured
    if (chatbotState.emailJSConfigured && typeof emailjs !== 'undefined') {
        try {
            const templateParams = {
                to_email: CHATBOT_CONFIG.recipientEmail,
                reference_number: chatbotState.leadData.referenceNumber,
                lead_name: chatbotState.leadData.name || 'Not provided',
                lead_email: chatbotState.leadData.email || 'Not provided',
                company: chatbotState.leadData.company || 'Not provided',
                project_type: chatbotState.leadData.projectType || 'AI Integration',
                timeline: chatbotState.leadData.timeline || 'Not specified',
                budget: chatbotState.leadData.budget || 'To be discussed',
                qualified: chatbotState.leadData.qualified ? 'YES ✅' : 'NO',
                score: chatbotState.leadData.score,
                conversation: chatbotState.conversationHistory
                    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                    .join('\n\n'),
                timestamp: new Date().toLocaleString()
            };
            
            await emailjs.send(
                CHATBOT_CONFIG.emailJS.serviceId,
                CHATBOT_CONFIG.emailJS.templateId,
                templateParams
            );
            
            console.log('✅ Email sent successfully!');
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            // Continue anyway - lead is saved in localStorage
        }
    } else {
        console.log('⚠️ EmailJS not configured - lead saved to localStorage only');
    }
}

// Fallback mode removed - AI only or unavailable message

// Rate Limiting
function checkRateLimit() {
    const now = Date.now();
    
    if (chatbotState.sessionStartTime && 
        now - chatbotState.sessionStartTime > CHATBOT_CONFIG.sessionTimeout) {
        chatbotState.reset();
        initConversation();
        return false;
    }
    
    if (chatbotState.messageCount >= CHATBOT_CONFIG.maxMessagesPerSession) {
        return false;
    }
    
    chatbotState.recentMessages = chatbotState.recentMessages.filter(
        timestamp => now - timestamp < 60000
    );
    
    if (chatbotState.recentMessages.length >= CHATBOT_CONFIG.maxMessagesPerMinute) {
        return false;
    }
    
    chatbotState.recentMessages.push(now);
    chatbotState.messageCount++;
    
    return true;
}

// Spam Detection
function isSpam(message) {
    if (message.length < CHATBOT_CONFIG.minMessageLength || 
        message.length > CHATBOT_CONFIG.maxMessageLength) {
        return true;
    }
    
    const lowerMessage = message.toLowerCase();
    for (const keyword of CHATBOT_CONFIG.spamKeywords) {
        if (lowerMessage.includes(keyword)) {
            return true;
        }
    }
    
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
    if (specialCharRatio > 0.6) {
        return true;
    }
    
    if (/(.)\1{4,}/.test(message)) {
        return true;
    }
    
    return false;
}

// UI Helper Functions
function addBotMessage(text, quickActions = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    
    let content = '<div class="message-content">';
    const paragraphs = text.split('\n\n');
    paragraphs.forEach(p => {
        if (p.trim()) {
            // Convert **text** to <strong>
            p = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            content += `<p>${p.trim()}</p>`;
        }
    });
    content += '</div>';
    messageDiv.innerHTML = content;
    
    if (quickActions && quickActions.length > 0) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'quick-actions';
        
        quickActions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'quick-action-btn';
            button.textContent = action;
            button.onclick = () => {
                chatbotInput.value = action;
                handleSubmit(new Event('submit'));
            };
            actionsDiv.appendChild(button);
        });
        
        messageDiv.appendChild(actionsDiv);
    }
    
    chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user';
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${text}</p>
        </div>
    `;
    
    chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    
    chatbotMessages.appendChild(typingDiv);
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function showNotification() {
    if (!chatbotState.isOpen) {
        chatBadge.style.display = 'block';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initChatbot();
    
    // Show chat button after delay
    setTimeout(() => {
        chatbotContainer.style.opacity = '0';
        chatbotContainer.style.display = 'block';
        setTimeout(() => {
            chatbotContainer.style.transition = 'opacity 0.5s ease';
            chatbotContainer.style.opacity = '1';
        }, 100);
    }, 3000);
    
    // Show notification after 10 seconds
    setTimeout(() => {
        if (!chatbotState.isOpen) {
            showNotification();
        }
    }, 10000);
});