// Chatbot Configuration
const CHATBOT_CONFIG = {
    // OpenAI settings
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7,
    
    // Rate limiting
    maxMessagesPerSession: 20,
    maxMessagesPerMinute: 5,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    
    // Spam detection thresholds
    minMessageLength: 3,
    maxMessageLength: 500,
    spamKeywords: ['viagra', 'casino', 'lottery', 'prince', 'inheritance'],
    
    // Email settings
    emailEndpoint: '/api/send-lead', // Will need backend endpoint
    recipientEmail: 'adrian@amplifyx.com.au'
};

// Chatbot State
class ChatbotState {
    constructor() {
        this.isOpen = false;
        this.messageCount = 0;
        this.sessionStartTime = null;
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
            confirmed: false
        };
        this.currentQuestion = 0;
        this.apiKey = null; // Will be set by user or environment
        this.awaitingConfirmation = false;
        this.editMode = false;
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
            confirmed: false
        };
        this.currentQuestion = 0;
        this.awaitingConfirmation = false;
        this.editMode = false;
    }
}

const chatbotState = new ChatbotState();

// Qualification Questions
const QUALIFICATION_QUESTIONS = [
    {
        id: 'initial',
        question: "Hi! I'm here to help you explore how Amplifyx can accelerate your product development with AI. 🚀\n\nWhat brings you here today?",
        quickActions: [
            "Need AI integration",
            "Looking for rapid prototyping",
            "Want fractional CTO",
            "Just exploring"
        ],
        field: null
    },
    {
        id: 'name',
        question: "Great! I'd love to learn more about your project. What's your name?",
        field: 'name',
        validation: (value) => value.length >= 2
    },
    {
        id: 'company',
        question: "Nice to meet you, {name}! What company or project are you working on?",
        field: 'company',
        validation: (value) => value.length >= 2
    },
    {
        id: 'email',
        question: "Thanks! What's the best email to reach you at? (We'll send you some helpful resources)",
        field: 'email',
        validation: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    {
        id: 'projectType',
        question: "What kind of AI solution are you looking to build?",
        quickActions: [
            "AI-powered features",
            "Process automation",
            "Data analysis & insights",
            "Custom AI model",
            "Not sure yet"
        ],
        field: 'projectType'
    },
    {
        id: 'timeline',
        question: "When are you looking to get started?",
        quickActions: [
            "ASAP",
            "Within 1 month",
            "1-3 months",
            "3-6 months",
            "Just researching"
        ],
        field: 'timeline'
    },
    {
        id: 'budget',
        question: "Finally, what's your budget range for this project?",
        quickActions: [
            "$10k-25k",
            "$25k-50k",
            "$50k-100k",
            "$100k+",
            "Not sure yet"
        ],
        field: 'budget'
    },
    {
        id: 'confirmation',
        question: null, // Will be generated dynamically
        quickActions: [
            "Yes, everything is correct ✅",
            "I need to edit something 📝"
        ],
        field: null,
        isConfirmation: true
    }
];

// DOM Elements
const chatbotContainer = document.getElementById('chatbot-container');
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotWindow = document.getElementById('chatbot-window');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotForm = document.getElementById('chatbot-form');
const chatbotInput = document.getElementById('chatbot-input');
const chatbotMinimize = document.getElementById('chatbot-minimize');
const chatIcon = chatbotToggle.querySelector('.chat-icon');
const closeIcon = chatbotToggle.querySelector('.close-icon');
const chatBadge = chatbotToggle.querySelector('.chat-badge');

// Initialize Chatbot
function initChatbot() {
    // Toggle chat window
    chatbotToggle.addEventListener('click', toggleChat);
    chatbotMinimize.addEventListener('click', toggleChat);
    
    // Handle form submission
    chatbotForm.addEventListener('submit', handleSubmit);
    
    // Privacy link
    document.getElementById('privacy-link').addEventListener('click', (e) => {
        e.preventDefault();
        addBotMessage("We take your privacy seriously. Your data is only used to understand your needs and provide relevant solutions. We never share your information without consent.");
    });
    
    // Check for API key in localStorage or prompt user
    checkApiKey();
}

// Check for API Key
function checkApiKey() {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
        chatbotState.apiKey = storedKey;
    }
}

// Prompt for API Key
function promptForApiKey() {
    addBotMessage("To enable AI-powered responses, you can provide your OpenAI API key. Your key will be stored locally and never sent to our servers.\n\nWould you like to add your API key?", 
        ["Yes, add API key", "No, continue without AI"]);
}

// Handle API Key Input
function handleApiKeyInput(message) {
    if (message.startsWith('sk-')) {
        // Store the API key securely in localStorage
        localStorage.setItem('openai_api_key', message);
        chatbotState.apiKey = message;
        addBotMessage("✅ API key saved successfully! AI responses are now enabled.");
        return true;
    }
    return false;
}

// Toggle Chat Window
function toggleChat() {
    chatbotState.isOpen = !chatbotState.isOpen;
    
    if (chatbotState.isOpen) {
        chatbotWindow.classList.add('active');
        chatIcon.style.display = 'none';
        closeIcon.style.display = 'block';
        chatBadge.style.display = 'none';
        
        // Start session if new
        if (!chatbotState.sessionStartTime) {
            chatbotState.reset();
            initConversation();
        }
        
        // Focus input
        setTimeout(() => chatbotInput.focus(), 300);
    } else {
        chatbotWindow.classList.remove('active');
        chatIcon.style.display = 'block';
        closeIcon.style.display = 'none';
    }
}

// Initialize Conversation
function initConversation() {
    // Clear messages
    chatbotMessages.innerHTML = '';
    
    // Add initial message with quick actions
    const question = QUALIFICATION_QUESTIONS[0];
    addBotMessage(question.question, question.quickActions);
}

// Handle Form Submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = chatbotInput.value.trim();
    if (!message) return;
    
    // Check rate limiting
    if (!checkRateLimit()) {
        addBotMessage("You're sending messages too quickly. Please wait a moment.");
        return;
    }
    
    // Check for spam
    if (isSpam(message)) {
        addBotMessage("Please provide a valid response.");
        return;
    }
    
    // Add user message
    addUserMessage(message);
    chatbotInput.value = '';
    
    // Process message
    await processUserMessage(message);
}

// Process User Message
async function processUserMessage(message) {
    // Add to conversation history
    chatbotState.conversationHistory.push({
        role: 'user',
        content: message
    });
    
    // Show typing indicator
    showTypingIndicator();
    
    // Check if we're in qualification flow
    if (chatbotState.currentQuestion < QUALIFICATION_QUESTIONS.length) {
        await handleQualificationFlow(message);
    } else {
        // Use AI for general conversation
        await handleAIResponse(message);
    }
    
    // Remove typing indicator
    hideTypingIndicator();
}

// Handle Qualification Flow
async function handleQualificationFlow(message) {
    // Check if we're in confirmation stage
    if (chatbotState.awaitingConfirmation) {
        await handleConfirmation(message);
        return;
    }
    
    // Check if we're in edit mode
    if (chatbotState.editMode) {
        await handleEditMode(message);
        return;
    }
    
    const currentQ = QUALIFICATION_QUESTIONS[chatbotState.currentQuestion];
    
    // Check if this is the confirmation step
    if (currentQ.isConfirmation) {
        showConfirmation();
        return;
    }
    
    // Store response if it has a field
    if (currentQ.field) {
        // Validate response
        if (currentQ.validation && !currentQ.validation(message)) {
            addBotMessage(`Please provide a valid ${currentQ.field}.`);
            return;
        }
        chatbotState.leadData[currentQ.field] = message;
    }
    
    // Move to next question
    chatbotState.currentQuestion++;
    
    if (chatbotState.currentQuestion < QUALIFICATION_QUESTIONS.length) {
        const nextQ = QUALIFICATION_QUESTIONS[chatbotState.currentQuestion];
        
        // Check if next is confirmation
        if (nextQ.isConfirmation) {
            showConfirmation();
        } else {
            let question = nextQ.question;
            
            // Replace placeholders
            question = question.replace('{name}', chatbotState.leadData.name || 'there');
            
            setTimeout(() => {
                addBotMessage(question, nextQ.quickActions);
            }, 500);
        }
    }
}

// Show Confirmation
function showConfirmation() {
    chatbotState.awaitingConfirmation = true;
    
    const confirmationMessage = `
Great! Let me confirm the details I've recorded:

📝 **Name:** ${chatbotState.leadData.name}
🏢 **Company:** ${chatbotState.leadData.company}
📧 **Email:** ${chatbotState.leadData.email}
🚀 **Project Type:** ${chatbotState.leadData.projectType}
⏱️ **Timeline:** ${chatbotState.leadData.timeline}
💰 **Budget:** ${chatbotState.leadData.budget}

Is everything correct?`;
    
    setTimeout(() => {
        addBotMessage(confirmationMessage, [
            "Yes, everything is correct ✅",
            "I need to edit something 📝"
        ]);
    }, 500);
}

// Handle Confirmation
async function handleConfirmation(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('yes') || lowerMessage.includes('correct') || lowerMessage.includes('✅')) {
        // User confirmed - proceed with completion
        chatbotState.leadData.confirmed = true;
        chatbotState.awaitingConfirmation = false;
        await completeQualification();
    } else if (lowerMessage.includes('edit') || lowerMessage.includes('change') || lowerMessage.includes('📝')) {
        // User wants to edit
        chatbotState.editMode = true;
        chatbotState.awaitingConfirmation = false;
        
        setTimeout(() => {
            addBotMessage("Which field would you like to edit?", [
                "Name",
                "Company",
                "Email",
                "Project Type",
                "Timeline",
                "Budget"
            ]);
        }, 500);
    } else {
        addBotMessage("Please confirm if the details are correct or if you'd like to edit something.", [
            "Yes, everything is correct ✅",
            "I need to edit something 📝"
        ]);
    }
}

// Handle Edit Mode
async function handleEditMode(message) {
    const lowerMessage = message.toLowerCase();
    
    // Map user input to field names
    const fieldMap = {
        'name': 'name',
        'company': 'company',
        'email': 'email',
        'project type': 'projectType',
        'project': 'projectType',
        'timeline': 'timeline',
        'budget': 'budget'
    };
    
    // Check if user selected a field to edit
    let fieldToEdit = null;
    for (const [key, value] of Object.entries(fieldMap)) {
        if (lowerMessage.includes(key)) {
            fieldToEdit = value;
            break;
        }
    }
    
    if (fieldToEdit) {
        // Store which field we're editing
        chatbotState.editingField = fieldToEdit;
        
        // Find the question for this field
        const question = QUALIFICATION_QUESTIONS.find(q => q.field === fieldToEdit);
        if (question) {
            let questionText = question.question;
            questionText = questionText.replace('{name}', chatbotState.leadData.name || 'there');
            
            // Ask for new value
            setTimeout(() => {
                addBotMessage(`Current ${fieldToEdit}: **${chatbotState.leadData[fieldToEdit]}**\n\n${questionText}`, question.quickActions || null);
            }, 500);
            
            // Set flag to capture next response as edit
            chatbotState.expectingEditValue = true;
        }
    } else if (chatbotState.expectingEditValue) {
        // This is the new value for the field being edited
        const fieldToEdit = chatbotState.editingField;
        const question = QUALIFICATION_QUESTIONS.find(q => q.field === fieldToEdit);
        
        // Validate if needed
        if (question && question.validation && !question.validation(message)) {
            addBotMessage(`Please provide a valid ${fieldToEdit}.`);
            return;
        }
        
        // Update the field
        chatbotState.leadData[fieldToEdit] = message;
        
        // Reset edit flags
        chatbotState.editMode = false;
        chatbotState.expectingEditValue = false;
        chatbotState.editingField = null;
        
        // Show confirmation again
        setTimeout(() => {
            addBotMessage(`✅ ${fieldToEdit} updated successfully!`);
            setTimeout(() => {
                showConfirmation();
            }, 1000);
        }, 500);
    } else {
        addBotMessage("Please select which field you'd like to edit:", [
            "Name",
            "Company",
            "Email",
            "Project Type",
            "Timeline",
            "Budget"
        ]);
    }
}

// Complete Qualification
async function completeQualification() {
    // Only proceed if confirmed
    if (!chatbotState.leadData.confirmed) {
        showConfirmation();
        return;
    }
    
    // Calculate lead score
    const score = calculateLeadScore();
    chatbotState.leadData.qualified = score >= 60;
    
    // Generate reference number
    const referenceNumber = 'AMP-' + Date.now().toString(36).toUpperCase();
    chatbotState.leadData.referenceNumber = referenceNumber;
    
    // Send lead to email
    await sendLeadEmail();
    
    // Thank you message with reference number
    const message = chatbotState.leadData.qualified
        ? `🎉 Perfect! Your information has been recorded successfully.\n\n**Reference Number:** ${referenceNumber}\n\nThank you, ${chatbotState.leadData.name}! Based on your responses, you're a great fit for our services. Adrian will reach out to you at **${chatbotState.leadData.email}** within 24 hours to discuss your project in detail.\n\nIn the meantime, feel free to ask me any questions about Amplifyx!`
        : `✅ Your information has been recorded successfully.\n\n**Reference Number:** ${referenceNumber}\n\nThank you for your interest, ${chatbotState.leadData.name}! We'll review your requirements and contact you at **${chatbotState.leadData.email}** soon with the best way forward.\n\nFeel free to ask me any questions about our services!`;
    
    setTimeout(() => {
        addBotMessage(message);
        
        // Check if user wants to add API key for continued conversation
        if (!chatbotState.apiKey) {
            setTimeout(() => {
                promptForApiKey();
            }, 2000);
        }
    }, 500);
}

// Calculate Lead Score
function calculateLeadScore() {
    let score = 0;
    
    // Timeline scoring
    if (chatbotState.leadData.timeline === 'ASAP') score += 30;
    else if (chatbotState.leadData.timeline === 'Within 1 month') score += 25;
    else if (chatbotState.leadData.timeline === '1-3 months') score += 20;
    else if (chatbotState.leadData.timeline === '3-6 months') score += 10;
    
    // Budget scoring
    if (chatbotState.leadData.budget === '$100k+') score += 30;
    else if (chatbotState.leadData.budget === '$50k-100k') score += 25;
    else if (chatbotState.leadData.budget === '$25k-50k') score += 20;
    else if (chatbotState.leadData.budget === '$10k-25k') score += 15;
    
    // Project type scoring
    if (chatbotState.leadData.projectType && 
        chatbotState.leadData.projectType !== 'Not sure yet') {
        score += 20;
    }
    
    // Company provided
    if (chatbotState.leadData.company) score += 10;
    
    // Valid email
    if (chatbotState.leadData.email) score += 10;
    
    return score;
}

// Send Lead Email
async function sendLeadEmail() {
    // Log the complete lead data with confirmation status
    console.log('=== LEAD SUBMISSION ===');
    console.log('Lead Data:', chatbotState.leadData);
    console.log('Confirmed:', chatbotState.leadData.confirmed);
    console.log('Reference:', chatbotState.leadData.referenceNumber);
    console.log('Timestamp:', new Date().toISOString());
    console.log('=====================');
    
    // You could use a service like EmailJS or your own backend
    // Example with fetch to backend:
    /*
    try {
        const response = await fetch(CHATBOT_CONFIG.emailEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: CHATBOT_CONFIG.recipientEmail,
                leadData: chatbotState.leadData,
                conversationHistory: chatbotState.conversationHistory
            })
        });
        
        if (!response.ok) {
            console.error('Failed to send lead email');
        }
    } catch (error) {
        console.error('Error sending lead:', error);
    }
    */
    
    // For demonstration, we'll show an alert
    if (chatbotState.leadData.qualified) {
        console.log(`QUALIFIED LEAD: ${chatbotState.leadData.name} from ${chatbotState.leadData.company}`);
    }
}

// Handle AI Response (after qualification)
async function handleAIResponse(message) {
    // Check if user is providing API key
    if (message.toLowerCase().includes('add api key') || message.toLowerCase().includes('yes')) {
        addBotMessage("Please paste your OpenAI API key below. It will be stored securely in your browser and never sent to our servers.");
        chatbotState.expectingApiKey = true;
        return;
    }
    
    // Check if this is an API key
    if (chatbotState.expectingApiKey) {
        if (handleApiKeyInput(message)) {
            chatbotState.expectingApiKey = false;
            return;
        } else {
            addBotMessage("That doesn't appear to be a valid OpenAI API key. API keys start with 'sk-'. Please try again or type 'skip' to continue without AI.");
            return;
        }
    }
    
    // Check if API key is available
    if (!chatbotState.apiKey) {
        addBotMessage("AI responses are currently unavailable. However, I can help you with information about Amplifyx! Try asking about our services, process, or how we can help with your AI needs.");
        return;
    }
    
    try {
        // Prepare context about Amplifyx
        const systemPrompt = `You are an AI assistant for Amplifyx Technologies, an AI consultancy that helps companies integrate AI, build prototypes, and provide fractional CTO services. 
        Keep responses concise, helpful, and focused on Amplifyx's services: AI integration, rapid prototyping, fractional product leadership, AI research, micro-automations, and AI-powered development.
        The user has already provided their contact information. Be helpful but encourage them to wait for Adrian's call for detailed project discussions.`;
        
        // Make API call to OpenAI
        const response = await fetch(CHATBOT_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${chatbotState.apiKey}`
            },
            body: JSON.stringify({
                model: CHATBOT_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...chatbotState.conversationHistory.slice(-5) // Last 5 messages for context
                ],
                max_tokens: CHATBOT_CONFIG.maxTokens,
                temperature: CHATBOT_CONFIG.temperature
            })
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add AI response to conversation
        chatbotState.conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        setTimeout(() => {
            addBotMessage(aiResponse);
        }, 500);
        
    } catch (error) {
        console.error('AI Response Error:', error);
        
        // Fallback responses
        const fallbackResponses = [
            "I can help you learn more about Amplifyx's services. We specialize in AI integration, rapid prototyping, and providing fractional CTO expertise. What specific area interests you?",
            "Adrian will be able to discuss your project needs in detail during your call. In the meantime, you can explore our website to see case studies and testimonials from our clients.",
            "We've helped many startups and enterprises integrate AI successfully. Our approach focuses on rapid prototyping and practical implementation. What challenges are you facing with your current project?"
        ];
        
        const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        setTimeout(() => {
            addBotMessage(randomResponse);
        }, 500);
    }
}

// Check Rate Limiting
function checkRateLimit() {
    const now = Date.now();
    
    // Check session timeout
    if (chatbotState.sessionStartTime && 
        now - chatbotState.sessionStartTime > CHATBOT_CONFIG.sessionTimeout) {
        chatbotState.reset();
        initConversation();
        return false;
    }
    
    // Check total message count
    if (chatbotState.messageCount >= CHATBOT_CONFIG.maxMessagesPerSession) {
        return false;
    }
    
    // Check messages per minute
    chatbotState.recentMessages = chatbotState.recentMessages.filter(
        timestamp => now - timestamp < 60000
    );
    
    if (chatbotState.recentMessages.length >= CHATBOT_CONFIG.maxMessagesPerMinute) {
        return false;
    }
    
    // Add current message timestamp
    chatbotState.recentMessages.push(now);
    chatbotState.messageCount++;
    
    return true;
}

// Spam Detection
function isSpam(message) {
    // Check message length
    if (message.length < CHATBOT_CONFIG.minMessageLength || 
        message.length > CHATBOT_CONFIG.maxMessageLength) {
        return true;
    }
    
    // Check for spam keywords
    const lowerMessage = message.toLowerCase();
    for (const keyword of CHATBOT_CONFIG.spamKeywords) {
        if (lowerMessage.includes(keyword)) {
            return true;
        }
    }
    
    // Check for excessive special characters or numbers
    const specialCharRatio = (message.match(/[^a-zA-Z0-9\s]/g) || []).length / message.length;
    if (specialCharRatio > 0.5) {
        return true;
    }
    
    // Check for repeated characters
    if (/(.)\1{4,}/.test(message)) {
        return true;
    }
    
    return false;
}

// Add Bot Message
function addBotMessage(text, quickActions = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    
    let content = '<div class="message-content">';
    
    // Split text into paragraphs
    const paragraphs = text.split('\n\n');
    paragraphs.forEach(p => {
        if (p.trim()) {
            content += `<p>${p.trim()}</p>`;
        }
    });
    
    content += '</div>';
    messageDiv.innerHTML = content;
    
    // Add quick actions if provided
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

// Add User Message
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

// Show Typing Indicator
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

// Hide Typing Indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll to Bottom
function scrollToBottom() {
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// Show notification badge
function showNotification() {
    if (!chatbotState.isOpen) {
        chatBadge.style.display = 'block';
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initChatbot();
    
    // Show chat button after 3 seconds
    setTimeout(() => {
        chatbotContainer.style.opacity = '0';
        chatbotContainer.style.display = 'block';
        setTimeout(() => {
            chatbotContainer.style.transition = 'opacity 0.5s ease';
            chatbotContainer.style.opacity = '1';
        }, 100);
    }, 3000);
    
    // Show notification after 10 seconds if not opened
    setTimeout(() => {
        if (!chatbotState.isOpen) {
            showNotification();
        }
    }, 10000);
});