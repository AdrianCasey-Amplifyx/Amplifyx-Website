// AI-Driven Chatbot with EmailJS Integration for Amplifyx Technologies
// This version uses OpenAI for natural conversation while maintaining lead qualification

// Configuration
const CHATBOT_CONFIG = {
    // OpenAI settings - uses proxy if available, direct API otherwise
    apiEndpoint: window.AMPLIFYX_CONFIG?.apiProxyUrl || 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o', // Best model for understanding context
    maxTokens: 400, // Increased for confirmation messages
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

// System prompt for AI - Optimized for token efficiency
const SYSTEM_PROMPT = `You are a consultation assistant for Amplifyx Technologies, an AI consultancy in Brisbane, Australia.

CRITICAL RULES:
1. Never greet (no Hi/Hello). User already saw greeting. Go straight to their request.
2. Do NOT generate reference numbers (like AMP-XXXXX). The system generates these automatically.
3. NEVER make up information you don't know. If asked about something not listed below, say "I don't have that specific information, but I can connect you with our team who can help."
4. When you see "RELEVANT COMPANY INFORMATION FROM KNOWLEDGE BASE" in the context, USE IT as your primary source of truth about Amplifyx - this overrides the general information below.

WHAT YOU KNOW:
- Company: Amplifyx Technologies (AI consultancy)
- Services: AI automation, custom chatbots, rapid prototyping, AI strategy consulting
- Location: Brisbane, Australia
- Focus: Helping businesses implement AI solutions
- Process: Initial consultation → Proposal → Implementation

WHAT YOU DON'T KNOW (redirect to team):
- Job applications/careers/HR matters → "For career opportunities, I'll need to connect you with our team directly."
- Specific team members or departments → "I can have the right person from our team contact you about this."
- Office addresses/visiting → "I'll have someone from our team provide those details."
- Specific pricing → Only mention "depends on project scope" and collect their requirements
- Technical implementation details → "Our technical team can discuss implementation specifics with you."

CONVERSATION FLOW:
1. Understand their specific need
2. Gather: name, company, email, phone, project details, timeline, budget
3. When you have enough info, show a clear summary and say "If this information is correct, I'll pass it to our team"

For any questions you cannot answer, respond with: "I don't have that specific information, but let me collect your details and have someone from our team provide you with accurate information."

Keep responses concise and professional. Focus on understanding their AI project needs or connecting them with the team.`;

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
        // Generate unique session ID for this chat session
        this.sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
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
        // Generate new session ID for the new conversation
        this.sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
    
    // Don't add greeting to conversation history - it confuses the AI
    // The greeting is only for display, not for AI context
    
    addBotMessage(initialMessage, [
        "Book a Discovery Call",
        "Learn More About Amplifyx",
        "Something Else"
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
        // Use RAG to augment the message with knowledge base context
        let augmentedUserMessage = userMessage;
        let ragContext = "";
        
        if (window.RAGHelper && window.RAGHelper.augmentMessageWithRAG) {
            console.log('🔍 Using RAG to search knowledge base...');
            const ragResult = await window.RAGHelper.augmentMessageWithRAG(userMessage, chatbotState.conversationHistory);
            if (ragResult.context) {
                console.log('📚 Found relevant knowledge, adding to context');
                ragContext = ragResult.context;
            }
        } else {
            console.log('⚠️ RAG Helper not available');
        }
        
        // Prepare context message
        let contextMessage = ragContext;
        const missingFields = chatbotState.getMissingFields();
        if (missingFields.length > 0 && Math.random() > 0.7) { // Occasionally remind to collect missing info
            contextMessage += `\n\n[Context: Still need to collect: ${missingFields.join(', ')}. Work these into the conversation naturally.]`;
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
        
        // Clean conversation history to prevent issues
        const cleanHistory = chatbotState.conversationHistory
            .slice(-8) // Reduce to last 8 messages to prevent token overflow
            .map(msg => ({
                role: msg.role,
                content: msg.content.substring(0, 1000) // Truncate very long messages
            }));
        
        const requestBody = {
            model: CHATBOT_CONFIG.model,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT + contextMessage },
                ...cleanHistory
            ],
            max_tokens: CHATBOT_CONFIG.maxTokens,
            temperature: CHATBOT_CONFIG.temperature
        };
        
        console.log('Making API request:');
        console.log('- URL:', apiEndpoint);
        console.log('- Model:', requestBody.model);
        console.log('- Message count:', requestBody.messages.length);
        console.log('- Total characters:', JSON.stringify(requestBody).length);
        console.log('- Request body:', JSON.stringify(requestBody, null, 2));
        
        let requestBodyString;
        try {
            requestBodyString = JSON.stringify(requestBody);
        } catch (e) {
            console.error('Failed to stringify request body:', e);
            throw new Error('Invalid request data');
        }
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: requestBodyString
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response headers:', response.headers);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', {
                status: response.status,
                body: errorText,
                model: requestBody.model,
                messageCount: requestBody.messages.length
            });
            
            // Try to parse error for better debugging
            let errorMessage = `API request failed: ${response.status}`;
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                // Use default error message
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        let aiResponse = data.choices[0].message.content;
        
        // Add to history
        chatbotState.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        // Extract any fields from AI's understanding
        extractFieldsFromAIResponse(aiResponse);
        
        // Skip structured data extraction - it's causing JSON parsing issues
        // The AI will naturally show the confirmation in plain text instead
        
        // Remove any structured data tags if they appear
        aiResponse = aiResponse.replace(/<!--STRUCTURED_DATA:[\s\S]*?-->/g, '');
        
        addBotMessage(aiResponse);
        
        // Debug: Log what fields we have
        console.log('Fields collected:', chatbotState.fieldsCollected);
        console.log('Lead data:', chatbotState.leadData);
        console.log('📱 Phone status - Collected:', chatbotState.fieldsCollected.phone, 'Value:', chatbotState.leadData.phone);
        
        // Check if AI is asking for confirmation
        const lowerResponse = aiResponse.toLowerCase();
        const isAIAskingForConfirmation = 
            lowerResponse.includes('if this information is correct') ||
            lowerResponse.includes('if this is correct') ||
            lowerResponse.includes('pass it to our team') ||
            lowerResponse.includes('pass these to our team') ||
            lowerResponse.includes('confirm these details') ||
            lowerResponse.includes('is this correct');
        
        // If AI is asking for confirmation, add buttons and set state
        if (isAIAskingForConfirmation && !chatbotState.submissionComplete && !chatbotState.awaitingConfirmation) {
            console.log('✅ AI is asking for confirmation - adding buttons');
            
            // Generate reference number NOW, before showing confirmation
            if (!chatbotState.leadData.referenceNumber) {
                const referenceNumber = 'AMP-' + Date.now().toString(36).toUpperCase();
                chatbotState.leadData.referenceNumber = referenceNumber;
                console.log('📝 Generated Reference Number:', referenceNumber);
            }
            
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
        console.error('- Error stack:', error.stack);
        console.error('- API endpoint attempted:', window.AMPLIFYX_CONFIG?.apiProxyUrl || 'Direct OpenAI');
        console.error('- Conversation history length:', chatbotState.conversationHistory.length);
        console.error('- Last message:', message);
        
        // Show error message but don't disable chat completely - let user retry
        addBotMessage("Sorry, I encountered an error processing your message. Please try again or rephrase your request. If the issue persists, contact us at adrian@amplifyx.com.au.");
        // Don't disable input - let user retry
        // chatbotInput.disabled = true;
        // chatbotInput.placeholder = "AI agent unavailable";
    }
}

// Extract all data from conversation using AI
async function extractDataWithAI(conversationHistory) {
    console.log('🤖 Using AI to extract structured data from conversation...');
    
    // Create extraction prompt
    const extractionPrompt = `Extract the following information from this conversation. Return ONLY valid JSON with these exact fields (use empty string "" if not found):

{
  "name": "full name of the person",
  "company": "company or organization name",
  "email": "email address",
  "phone": "phone number",
  "projectType": "what they need help with (be specific)",
  "timeline": "when they need it (ASAP, 1-3 months, etc)",
  "budget": "budget amount or range",
  "summary": "2-3 sentence summary of their needs and situation"
}

IMPORTANT: 
- Extract actual values from the conversation
- For projectType, be specific about what they want
- For summary, describe their situation and needs concisely
- Return ONLY the JSON object, no other text`;

    try {
        const apiEndpoint = window.AMPLIFYX_CONFIG?.apiProxyUrl || 'https://api.openai.com/v1/chat/completions';
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (!apiEndpoint.includes('vercel.app') && chatbotState.apiKey) {
            headers['Authorization'] = `Bearer ${chatbotState.apiKey}`;
        }
        
        // Prepare conversation text
        const conversationText = conversationHistory
            .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
            .join('\n\n');
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { 
                        role: 'system', 
                        content: extractionPrompt 
                    },
                    { 
                        role: 'user', 
                        content: conversationText 
                    }
                ],
                max_tokens: 500,
                temperature: 0.1 // Low temperature for consistent extraction
            })
        });
        
        if (!response.ok) {
            throw new Error(`Extraction API failed: ${response.status}`);
        }
        
        const data = await response.json();
        const extractedText = data.choices[0].message.content;
        
        // Parse the JSON response
        try {
            const extractedData = JSON.parse(extractedText);
            console.log('✅ Successfully extracted data:', extractedData);
            return extractedData;
        } catch (parseError) {
            console.error('Failed to parse extraction response:', extractedText);
            // Try to extract JSON from the response if it contains other text
            const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const extractedData = JSON.parse(jsonMatch[0]);
                console.log('✅ Extracted data from response:', extractedData);
                return extractedData;
            }
            throw parseError;
        }
        
    } catch (error) {
        console.error('❌ AI extraction failed:', error);
        // Return empty structure on failure
        return {
            name: '',
            company: '',
            email: '',
            phone: '',
            projectType: '',
            timeline: '',
            budget: '',
            summary: ''
        };
    }
}

// Extract Fields from Message (legacy regex method - kept as fallback)
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
    confirmBtn.onclick = () => {
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
    
    // Extract structured data from conversation using AI
    const extractedData = await extractDataWithAI(chatbotState.conversationHistory);
    
    // Update lead data with AI-extracted values (override regex extraction)
    if (extractedData.name) chatbotState.leadData.name = extractedData.name;
    if (extractedData.company) chatbotState.leadData.company = extractedData.company;
    if (extractedData.email) chatbotState.leadData.email = extractedData.email;
    if (extractedData.phone) chatbotState.leadData.phone = extractedData.phone;
    if (extractedData.projectType) chatbotState.leadData.projectType = extractedData.projectType;
    if (extractedData.timeline) chatbotState.leadData.timeline = extractedData.timeline;
    if (extractedData.budget) chatbotState.leadData.budget = extractedData.budget;
    
    // Add the summary (new field)
    chatbotState.leadData.summary = extractedData.summary || '';
    
    console.log('📊 Extracted data from AI:', extractedData);
    console.log('📝 Summary extracted:', extractedData.summary);
    console.log('📊 Final lead data after AI extraction:', chatbotState.leadData);
    
    // Use AI score if available, otherwise calculate
    if (chatbotState.leadData.aiScore) {
        chatbotState.leadData.score = chatbotState.leadData.aiScore;
        console.log('Using AI project score:', chatbotState.leadData.aiScore);
    } else {
        chatbotState.leadData.score = calculateLeadScore();
        console.log('Using calculated score:', chatbotState.leadData.score);
    }
    chatbotState.leadData.qualified = chatbotState.leadData.score >= 60;
    
    // Generate reference number if not already generated
    if (!chatbotState.leadData.referenceNumber) {
        const referenceNumber = 'AMP-' + Date.now().toString(36).toUpperCase();
        chatbotState.leadData.referenceNumber = referenceNumber;
        console.log('📝 Generated Reference Number in completeQualification:', referenceNumber);
    }
    const referenceNumber = chatbotState.leadData.referenceNumber;
    
    // Submit to Supabase first
    const supabaseResult = await submitLeadToSupabase();
    if (supabaseResult) {
        console.log('✅ Lead saved to Supabase database');
    } else {
        console.log('⚠️ Supabase submission failed, using localStorage backup only');
    }
    
    // Send email notification
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

// Submit Lead to Supabase Database
async function submitLeadToSupabase() {
    try {
        console.log('📤 Submitting lead to Supabase...');
        console.log('Session ID:', chatbotState.sessionId);
        
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
                summary: chatbotState.leadData.summary || '',
                qualified: chatbotState.leadData.qualified,
                score: chatbotState.leadData.score,
                referenceNumber: chatbotState.leadData.referenceNumber
            },
            conversation: chatbotState.conversationHistory.slice(-20) // Last 20 messages
        };
        
        console.log('📤 Summary being sent to Supabase:', submissionData.structuredData.summary);
        
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
            console.log('✅ Lead submitted to Supabase successfully!');
            console.log('Lead ID:', result.leadId);
            return result;
        } else {
            const errorText = await response.text();
            console.error('❌ Supabase submission failed:', errorText);
            // Don't throw - allow fallback to localStorage
        }
    } catch (error) {
        console.error('❌ Error submitting to Supabase:', error);
        // Don't throw - allow fallback to localStorage
    }
    
    return null;
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