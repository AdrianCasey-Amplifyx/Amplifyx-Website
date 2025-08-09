// AI-Driven Chatbot with EmailJS Integration for Amplifyx Technologies
// This version uses OpenAI for natural conversation while maintaining lead qualification

// Configuration
const CHATBOT_CONFIG = {
    // Secure API endpoint - uses server-side prompt and scoring
    apiEndpoint: window.AMPLIFYX_CONFIG?.secureApiUrl || 'https://amplifyx-chatbot.vercel.app/api/chat-secure',
    model: 'gpt-4o-mini', // Upgraded for better understanding
    maxTokens: 250,
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

// System prompt for AI with systematic yet flexible approach
const SYSTEM_PROMPT = `You are a professional consultation assistant for Amplifyx Technologies, an AI consultancy specializing in rapid prototyping, AI integration, fractional product leadership, and technical innovation.

CRITICAL RULES:
1. NEVER send any form of greeting (no "Hi", "Hello", "Welcome", etc.)
2. The conversation ALREADY has a greeting - do NOT add another one
3. When user selects a service option (like "AI Automation" or "Custom AI Chatbots"), respond by asking about their specific needs for that service
4. Go straight to addressing what the user said or selected

YOUR APPROACH: Follow a systematic but natural conversation flow:

1. UNDERSTAND THEIR NEED FIRST
   - Listen to what they actually want (don't assume)
   - Identify their specific challenge or goal
   - Show you understand by reflecting back their need

2. GATHER INFORMATION PROGRESSIVELY
   Phase 1: Identity & Context
   - Who they are (name and/or company)
   - Their role or relationship to the project
   
   Phase 2: Contact Details
   - Email (essential)
   - Phone (politely ask: "And could you share a phone number for follow-up?")
   
   Phase 3: Project Specifics
   - What exactly they need (in their words)
   - Timeline/urgency
   - Budget (if comfortable sharing)

3. SMART EXTRACTION RULES
   - If someone provides multiple pieces of info at once (e.g., "OnCore Services. adrianjcasey@gmail.com 0431481227"), acknowledge ALL of it
   - Extract names from email addresses if not explicitly provided
   - IMPORTANT: "I am not sure" is NOT a name - only extract actual names when user says "My name is X" or "I am X" (where X is clearly a name)
   - Don't re-ask for information already given
   - Accept information in any order

4. ELEGANT CONFIRMATION PROTOCOL
   - When you have enough information, naturally confirm: "Perfect! I've got all the information I need. Let me confirm what I've captured..."
   - Display the details in a clean format with appropriate emojis
   - End with: "If that's everything correct, I'll pass these details to our team and they'll be in touch with you shortly to discuss how we can help with your [specific project type]."
   - NEVER say "someone will contact" before confirmation
   - The system will automatically add confirmation buttons after your message

5. STRUCTURED DATA OUTPUT (HIDDEN)
   When showing confirmation, ALWAYS include hidden structured data at the end with ALL fields:
   <!--STRUCTURED_DATA:
   {
     "name": "Adrian Johns",
     "company": "Oncore Services",
     "email": "adrianjcasey@gmail.com",
     "phone": "0431481227",
     "projectType": "AI Integration into systems like Jira and CRM",
     "timeline": "Partner to lead the tech",
     "budget": "$100k annual",
     "score": 85
   }
   -->
   CRITICAL RULES:
   - Include ALL 8 fields EVERY TIME
   - ALWAYS check conversation history for phone numbers (format: 0431481227 or similar)
   - If user provided phone ANYWHERE in conversation, you MUST include it
   - If phone wasn't provided, use "phone": ""
   - Use actual names only (not "not sure" or similar phrases)
   - Order MUST be: name, company, email, phone, projectType, timeline, budget, score

6. PROJECT EVALUATION (INTERNAL SCORING)
   Assess the project opportunity (1-100) based on:
   - Budget size (larger = higher score)
   - Timeline urgency (ASAP/urgent = higher score)
   - Project complexity/fit with our services (better fit = higher score)
   - Clear decision-making authority (confirmed = higher score)
   Include this in the structured data's "score" field

7. CONVERSATION GUIDELINES
   - Be consultative and professional, not salesy
   - Show genuine interest in their project
   - Use their actual words when summarizing
   - Avoid terms like "lead", "qualify", or "sales"
   - Focus on "your project", "your requirements", "this opportunity"

8. PROFESSIONAL CLOSURE
   After confirmation, respond warmly:
   "Excellent! I've passed your information to our team. Someone will reach out to you within 24 hours to discuss your [specific need] in detail. 
   
   Thank you for considering Amplifyx Technologies for your AI initiatives!"

CORE SERVICES TO HIGHLIGHT (when relevant):
- Rapid MVP development (weeks, not quarters)
- AI integration and automation
- Fractional CTO/CPO services
- Technical specifications and architecture
- Product management and strategy

REMEMBER: You're a consultant helping understand their needs, not a salesperson qualifying leads.`;

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
            phone: '',  // Added phone field
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
            phone: false,  // Added phone field tracking
            projectType: false,
            timeline: false,
            budget: false
        };
        
        // Conversation state
        this.awaitingConfirmation = false;
        this.awaitingUpdate = false;
        this.submissionComplete = false;  // Track if already submitted
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
            phone: '',  // Added phone field
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
            phone: false,  // Added phone field tracking
            projectType: false,
            timeline: false,
            budget: false
        };
        this.awaitingConfirmation = false;
        this.awaitingUpdate = false;
        this.submissionComplete = false;  // Reset submission flag
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
    
    // Check if we have an API key OR a secure API endpoint
    const hasProxy = window.AMPLIFYX_CONFIG?.secureApiUrl;
    
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
    
    // Don't add greeting to conversation history - it confuses the AI
    // The greeting is only for display, not for AI context
    
    addBotMessage(initialMessage, [
        "AI Automation",
        "Custom AI Chatbots",
        "Rapid Prototyping",
        "AI Strategy Consulting",
        "Technical Assessment",
        "Just Exploring"
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
    // Block messages after submission is complete
    if (chatbotState.submissionComplete) {
        addBotMessage("Thank you! This consultation has been completed and your project details have been forwarded to our team. To start a new inquiry, please refresh the page.");
        return;
    }
    
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
    } else if (chatbotState.awaitingUpdate) {
        // Handle updates
        extractUpdateFromMessage(message);
        chatbotState.awaitingUpdate = false;
        // Let AI handle showing the updated confirmation naturally
    } else if (chatbotState.conversationMode === 'ai') {
        await handleAIConversation(message);
    }
    
    hideTypingIndicator();
}

// Handle AI Conversation
async function handleAIConversation(message) {
    
    // Extract fields from message
    extractFieldsFromMessage(message);
    
    // Extract project type from conversation context if not set
    if (!chatbotState.leadData.projectType && message.length > 10) {
        const lowerMessage = message.toLowerCase();
        
        // Look for specific project mentions
        if (lowerMessage.includes('product manager') || lowerMessage.includes('pm')) {
            chatbotState.leadData.projectType = 'Product Management';
        } else if (lowerMessage.includes('chatbot') || lowerMessage.includes('chat bot')) {
            chatbotState.leadData.projectType = 'AI Chatbot';
        } else if (lowerMessage.includes('prototype') || lowerMessage.includes('mvp')) {
            chatbotState.leadData.projectType = 'Rapid Prototyping';
        } else if (lowerMessage.includes('cto') || lowerMessage.includes('technical lead')) {
            chatbotState.leadData.projectType = 'Fractional CTO';
        } else if (lowerMessage.includes('ai') || lowerMessage.includes('machine learning')) {
            chatbotState.leadData.projectType = 'AI Integration';
        } else if (lowerMessage.includes('specs') || lowerMessage.includes('requirements')) {
            chatbotState.leadData.projectType = 'Requirements & Specifications';
        }
        
        // If we found a project type, mark it as collected
        if (chatbotState.leadData.projectType) {
            chatbotState.fieldsCollected.projectType = true;
        }
    }
    
    // Let AI handle confirmation naturally when all fields are collected
    // Don't force a confirmation screen
    
    try {
        // Prepare context message
        let contextMessage = "";
        const missingFields = chatbotState.getMissingFields();
        if (missingFields.length > 0 && Math.random() > 0.7) { // Occasionally remind to collect missing info
            contextMessage = `\n\n[Context: Still need to collect: ${missingFields.join(', ')}. Work these into the conversation naturally.]`;
        }
        
        // Determine the correct API endpoint (secure endpoint)
        const apiEndpoint = window.AMPLIFYX_CONFIG?.secureApiUrl || 
                          CHATBOT_CONFIG.apiEndpoint;
        
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
        
        // Extract structured data if present
        const structuredDataMatch = aiResponse.match(/<!--STRUCTURED_DATA:([\s\S]*?)-->/);
        if (structuredDataMatch) {
            console.log('🔍 FOUND STRUCTURED DATA IN AI RESPONSE');
            try {
                const structuredData = JSON.parse(structuredDataMatch[1].trim());
                console.log('📊 STRUCTURED DATA FROM AI:', structuredData);
                
                // ALWAYS update ALL fields from structured data (ensure phone is never undefined)
                chatbotState.leadData.name = structuredData.name || chatbotState.leadData.name || '';
                chatbotState.leadData.company = structuredData.company || chatbotState.leadData.company || '';
                chatbotState.leadData.email = structuredData.email || chatbotState.leadData.email || '';
                // Phone must always have a value to prevent column shift
                chatbotState.leadData.phone = structuredData.phone || chatbotState.leadData.phone || '';
                chatbotState.leadData.projectType = structuredData.projectType || chatbotState.leadData.projectType || '';
                chatbotState.leadData.timeline = structuredData.timeline || chatbotState.leadData.timeline || '';
                chatbotState.leadData.budget = structuredData.budget || chatbotState.leadData.budget || '';
                
                // Store AI score
                if (structuredData.score) {
                    chatbotState.leadData.aiScore = structuredData.score;
                    chatbotState.leadData.score = structuredData.score; // Use AI score directly
                }
                
                // Mark all provided fields as collected
                if (structuredData.name !== null && structuredData.name !== undefined) chatbotState.fieldsCollected.name = true;
                if (structuredData.company !== null && structuredData.company !== undefined) chatbotState.fieldsCollected.company = true;
                if (structuredData.email !== null && structuredData.email !== undefined) chatbotState.fieldsCollected.email = true;
                if (structuredData.phone !== null && structuredData.phone !== undefined) chatbotState.fieldsCollected.phone = true;
                if (structuredData.projectType !== null && structuredData.projectType !== undefined) chatbotState.fieldsCollected.projectType = true;
                if (structuredData.timeline !== null && structuredData.timeline !== undefined) chatbotState.fieldsCollected.timeline = true;
                if (structuredData.budget !== null && structuredData.budget !== undefined) chatbotState.fieldsCollected.budget = true;
                
                console.log('✅ LEAD DATA AFTER STRUCTURED UPDATE:', chatbotState.leadData);
                
            } catch (e) {
                console.error('❌ Failed to parse structured data:', e);
                console.error('Raw data that failed:', structuredDataMatch[1]);
            }
            
            // Remove the structured data from the displayed message
            aiResponse = aiResponse.replace(/<!--STRUCTURED_DATA:[\s\S]*?-->/g, '');
        } else {
            console.log('⚠️ NO STRUCTURED DATA FOUND IN AI RESPONSE');
            console.log('AI Response sample:', aiResponse.substring(0, 200));
        }
        
        addBotMessage(aiResponse);
        
        // Debug: Log what fields we have
        console.log('Fields collected:', chatbotState.fieldsCollected);
        console.log('Lead data:', chatbotState.leadData);
        console.log('📱 Phone status - Collected:', chatbotState.fieldsCollected.phone, 'Value:', chatbotState.leadData.phone);
        
        // Check if AI is asking for confirmation
        const lowerResponse = aiResponse.toLowerCase();
        const isAIAskingForConfirmation = 
            lowerResponse.includes('is this correct') ||
            lowerResponse.includes('is this information correct') ||
            lowerResponse.includes('is everything correct') ||
            lowerResponse.includes('if that\'s everything correct') ||
            lowerResponse.includes('if that\'s correct') ||
            lowerResponse.includes("if that's everything correct") ||
            lowerResponse.includes("i'll pass these details");
        
        // If AI is asking for confirmation, add buttons and set state
        if (isAIAskingForConfirmation && !chatbotState.submissionComplete && !chatbotState.awaitingConfirmation) {
            console.log('✅ AI is asking for confirmation - adding buttons');
            console.log('📋 Current Lead Data:', chatbotState.leadData);
            chatbotState.awaitingConfirmation = true;
            
            // Add confirmation buttons after a short delay
            setTimeout(() => {
                addConfirmationButtons();
            }, 500);
        }
        
    } catch (error) {
        console.error('AI Error Details:');
        console.error('- Error message:', error.message);
        console.error('- Error object:', error);
        console.error('- API endpoint attempted:', window.AMPLIFYX_CONFIG?.secureApiUrl || 'Direct OpenAI');
        
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
    
    // Name extraction - only when explicitly stated (not "I am not sure", etc.)
    const namePatterns = [
        /(?:my name is|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+here/i,
        /(?:it's|its)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:from|at|with)/i // "It's John from..."
    ];
    
    // Special case: "I am [Name]" but NOT "I am not" or "I am unsure" etc.
    const iAmPattern = /i(?:'m| am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*$/i;
    const iAmMatch = message.match(iAmPattern);
    if (iAmMatch && !message.toLowerCase().includes('not') && !message.toLowerCase().includes('unsure')) {
        namePatterns.push(iAmPattern);
    }
    
    // List of words that are definitely NOT names
    const notNames = ['not', 'sure', 'unsure', 'uncertain', 'maybe', 'possibly', 'probably', 'definitely'];
    
    for (const pattern of namePatterns) {
        const nameMatch = message.match(pattern);
        if (nameMatch && !chatbotState.fieldsCollected.name) {
            const potentialName = nameMatch[1];
            // Check if this is actually a name (not "not sure" etc.)
            const isNotName = notNames.some(word => potentialName.toLowerCase().includes(word));
            
            if (!isNotName && potentialName.length > 1) {
                chatbotState.leadData.name = potentialName;
                chatbotState.fieldsCollected.name = true;
                console.log('👤 Name extracted:', potentialName);
                break;
            }
        }
    }
    
    // Phone number extraction (Australian and international formats)
    const phoneRegex = /(?:\+?61|0)?4\d{8}|\d{10}|\+\d{1,3}\s?\d{4,14}/;
    const phoneMatch = message.match(phoneRegex);
    if (phoneMatch && !chatbotState.fieldsCollected.phone) {
        chatbotState.leadData.phone = phoneMatch[0];
        chatbotState.fieldsCollected.phone = true;  // CRITICAL: Mark as collected!
        console.log('📱 Phone extracted:', chatbotState.leadData.phone);
    }
    
    // Company extraction - improved to handle various formats
    const companyPatterns = [
        /(?:work at|from|with|represent|ceo of|founder of|work for)\s+([A-Z][A-Za-z0-9\s&.]+)/i,
        /(?:company|startup|business|organization) (?:is |called |named )?([A-Z][A-Za-z0-9\s&.]+)/i,
        /^([A-Z][A-Za-z0-9\s&.]+)\.\s+[\w@]/i, // "OnCore Services. email@..."
        /^([A-Z][A-Za-z0-9\s&.]+)(?:\s+services|\s+industries|\s+solutions|\s+technologies)/i // Company with common suffixes
    ];
    
    // Special handling for messages with company and email together
    if (lowerMessage.includes('@') && !chatbotState.fieldsCollected.company) {
        // Look for company name before the email
        const beforeEmail = message.split(/[\s,]+(?=\S+@)/)[0];
        if (beforeEmail && beforeEmail.length > 2) {
            // Clean up and use as company name if it looks like one
            const cleanCompany = beforeEmail.replace(/[.,\s]+$/, '').trim();
            if (cleanCompany && /^[A-Z]/i.test(cleanCompany) && !cleanCompany.includes('@')) {
                chatbotState.leadData.company = cleanCompany;
                chatbotState.fieldsCollected.company = true;
            }
        }
    }
    
    // Try patterns if company not found yet
    if (!chatbotState.fieldsCollected.company) {
        for (const pattern of companyPatterns) {
            const companyMatch = message.match(pattern);
            if (companyMatch) {
                chatbotState.leadData.company = companyMatch[1].trim();
                chatbotState.fieldsCollected.company = true;
                break;
            }
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

// Submit Lead to Supabase
async function submitLeadToSupabase() {
    try {
        console.log('📤 Submitting lead to Supabase...');
        
        // Prepare submission data
        const submissionData = {
            sessionId: chatbotState.sessionId,
            structuredData: {
                name: chatbotState.leadData.name || '',
                email: chatbotState.leadData.email || '',
                phone: chatbotState.leadData.phone || '',
                company: chatbotState.leadData.company || '',
                projectType: chatbotState.leadData.projectType || '',
                timeline: chatbotState.leadData.timeline || '',
                budget: chatbotState.leadData.budget || '',
                score: chatbotState.leadData.score || 0
            },
            conversation: chatbotState.conversationHistory
        };
        
        console.log('Submission data:', submissionData);
        
        // Get the lead submission endpoint
        const leadSubmitUrl = window.AMPLIFYX_CONFIG?.leadSubmitUrl || 'https://amplifyx-chatbot.vercel.app/api/lead-submit';
        
        // Submit to API
        const response = await fetch(leadSubmitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': chatbotState.sessionId
            },
            body: JSON.stringify(submissionData)
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Lead submitted successfully:', result);
            chatbotState.submissionComplete = true;
            chatbotState.leadData.referenceNumber = result.referenceNumber;
            return result;
        } else {
            const error = await response.text();
            console.error('❌ Lead submission failed:', error);
            throw new Error(error);
        }
    } catch (error) {
        console.error('Failed to submit lead:', error);
        // Continue with conversation even if submission fails
        addBotMessage("I've noted your information. Our team will be in touch soon!");
    }
}

// Add confirmation buttons only (AI handles the text display)
function addConfirmationButtons() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'quick-actions';
    actionsDiv.style.marginTop = '0'; // No gap since AI already showed the message
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'quick-action-btn';
    confirmBtn.textContent = "Yes, that's correct ✅";
    confirmBtn.onclick = async () => {
        // Submit the lead to Supabase
        await submitLeadToSupabase();
        chatbotInput.value = "Yes, that's correct ✅";
        handleSubmit(new Event('submit'));
    };
    
    const updateBtn = document.createElement('button');
    updateBtn.className = 'quick-action-btn';
    updateBtn.textContent = "I need to update something 📝";
    updateBtn.onclick = () => {
        chatbotInput.value = "I need to update something 📝";
        handleSubmit(new Event('submit'));
    };
    
    actionsDiv.appendChild(confirmBtn);
    actionsDiv.appendChild(updateBtn);
    messageDiv.appendChild(actionsDiv);
    
    chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Handle Confirmation
async function handleConfirmation(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('correct') || lowerMessage.includes('good') || 
        lowerMessage.includes('right') || lowerMessage.includes('perfect') || lowerMessage.includes('✅') ||
        lowerMessage.includes("that's correct") || lowerMessage.includes("looks good")) {
        chatbotState.leadData.confirmed = true;
        chatbotState.awaitingConfirmation = false;
        await completeQualification();
    } else if (lowerMessage.includes('update') || lowerMessage.includes('change') || lowerMessage.includes('wrong') || 
               lowerMessage.includes('incorrect') || lowerMessage.includes('📝')) {
        // User wants to update something
        chatbotState.awaitingConfirmation = false;
        chatbotState.awaitingUpdate = true;
        addBotMessage("What would you like to update? You can say things like:\n• 'My company is XYZ Corp'\n• 'Email is john@example.com'\n• 'Timeline is next month'\nJust type the correct information.");
    } else {
        // Try to extract updates from the message itself
        const updateExtracted = extractUpdateFromMessage(message);
        
        if (updateExtracted) {
            // Let AI show the updated confirmation naturally
            addBotMessage("I've updated that information. Let me confirm the details again.");
            chatbotState.awaitingConfirmation = true;
        } else {
            chatbotState.awaitingUpdate = true;
            addBotMessage("I'll update that for you. Please provide the correct information.");
        }
    }
}

// Extract updates from correction messages
function extractUpdateFromMessage(message) {
    let updated = false;
    const lowerMessage = message.toLowerCase();
    
    // Check for company updates
    if (lowerMessage.includes('company') || lowerMessage.includes('work at')) {
        const companyMatch = message.match(/(?:company is|work at|from)\s+([A-Z][A-Za-z0-9\s&.]+)/i);
        if (companyMatch) {
            chatbotState.leadData.company = companyMatch[1].trim();
            chatbotState.fieldsCollected.company = true;
            updated = true;
        }
    }
    
    // Check for name updates
    if (lowerMessage.includes('name is') || lowerMessage.includes("i'm")) {
        const nameMatch = message.match(/(?:name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        if (nameMatch) {
            chatbotState.leadData.name = nameMatch[1].trim();
            chatbotState.fieldsCollected.name = true;
            updated = true;
        }
    }
    
    // Check for email updates
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const emailMatch = message.match(emailRegex);
    if (emailMatch) {
        chatbotState.leadData.email = emailMatch[0];
        chatbotState.fieldsCollected.email = true;
        updated = true;
    }
    
    // Check for timeline updates
    if (lowerMessage.includes('timeline') || lowerMessage.includes('start') || lowerMessage.includes('need')) {
        extractFieldsFromMessage(message); // Reuse existing extraction
        updated = true;
    }
    
    return updated;
}

// Complete Qualification
async function completeQualification() {
    // Prevent duplicate submissions
    if (chatbotState.submissionComplete) {
        console.log('⚠️ Submission already completed for this conversation');
        addBotMessage("I've already submitted your information. Is there anything else I can help you with?");
        return;
    }
    
    // Mark as submitted BEFORE any async operations to prevent race conditions
    chatbotState.submissionComplete = true;
    
    // Use AI score if available, otherwise calculate
    if (chatbotState.leadData.aiScore) {
        chatbotState.leadData.score = chatbotState.leadData.aiScore;
        console.log('Using AI project score:', chatbotState.leadData.aiScore);
    } else {
        chatbotState.leadData.score = calculateLeadScore();
        console.log('Using calculated score:', chatbotState.leadData.score);
    }
    chatbotState.leadData.qualified = chatbotState.leadData.score >= 60;
    
    // Generate reference number
    const referenceNumber = 'AMP-' + Date.now().toString(36).toUpperCase();
    chatbotState.leadData.referenceNumber = referenceNumber;
    
    // Send email
    await sendLeadEmail();
    
    // Professional completion message
    const message = chatbotState.leadData.qualified
        ? `🎉 Excellent! I've successfully passed your information to our team.\n\n**Reference Number:** ${referenceNumber}\n\nThank you, ${chatbotState.leadData.name || 'there'}! Based on our conversation about your ${chatbotState.leadData.projectType || 'AI project'}, someone from Amplifyx Technologies will reach out to you at **${chatbotState.leadData.email}** within 24 hours to discuss how we can help bring your vision to life.\n\nThank you for considering Amplifyx Technologies for your AI initiatives!\n\n*This consultation has been completed. To start a new inquiry, please refresh the page.*`
        : `✅ Thank you for your interest in Amplifyx Technologies!\n\n**Reference Number:** ${referenceNumber}\n\nI've passed your project details to our team. Someone will review your requirements and reach out to you at **${chatbotState.leadData.email}** soon to discuss the best path forward.\n\nWe appreciate you taking the time to explore how we can help with your technology needs.\n\n*This consultation has been completed. To start a new inquiry, please refresh the page.*`;
    
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
    
    // Log lead submission for debugging
    console.log('✅ Lead saved locally:', {
        referenceNumber: chatbotState.leadData.referenceNumber,
        name: chatbotState.leadData.name,
        email: chatbotState.leadData.email,
        score: chatbotState.leadData.score,
        qualified: chatbotState.leadData.qualified
    });
    
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