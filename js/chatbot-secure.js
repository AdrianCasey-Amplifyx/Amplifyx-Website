// Secure Chatbot Implementation - No exposed prompts or scoring
// This version uses server-side logic for all sensitive operations

// Configuration (public settings only)
const CHATBOT_CONFIG = {
    // API endpoint - now uses secure version
    apiEndpoint: window.AMPLIFYX_CONFIG?.secureApiUrl || '/api/chat-secure',
    
    // Rate limiting (client-side check)
    maxMessagesPerSession: 30,
    maxMessagesPerMinute: 5,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    
    // UI settings
    minMessageLength: 2,
    maxMessageLength: 500,
};

// Generate unique session ID for this visitor
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Secure Chatbot State (no sensitive data)
class SecureChatbotState {
    constructor() {
        this.sessionId = generateSessionId();
        this.isOpen = false;
        this.messageCount = 0;
        this.sessionStartTime = Date.now();
        this.conversationHistory = [];
        this.awaitingConfirmation = false;
        this.submissionComplete = false;
        
        // Only store what's needed for UI
        this.capturedData = {
            hasName: false,
            hasEmail: false,
            hasPhone: false,
            hasCompany: false,
            hasProject: false
        };
        
        console.log('New session started:', this.sessionId);
    }
    
    reset() {
        // Keep session ID, just reset conversation
        this.messageCount = 0;
        this.conversationHistory = [];
        this.awaitingConfirmation = false;
        this.submissionComplete = false;
        this.capturedData = {
            hasName: false,
            hasEmail: false,
            hasPhone: false,
            hasCompany: false,
            hasProject: false
        };
    }
}

const chatbotState = new SecureChatbotState();

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
    chatIcon = chatbotToggle?.querySelector('.chat-icon');
    closeIcon = chatbotToggle?.querySelector('.close-icon');
    chatBadge = chatbotToggle?.querySelector('.chat-badge');
    
    if (!chatbotContainer) {
        console.error('Chatbot container not found');
        return;
    }
    
    // Event listeners
    chatbotToggle.addEventListener('click', toggleChatbot);
    chatbotMinimize.addEventListener('click', minimizeChatbot);
    chatbotForm.addEventListener('submit', handleSubmit);
    
    // Add welcome message
    setTimeout(() => {
        addBotMessage("Welcome to Amplifyx Technologies! I'm here to help you explore how we can accelerate your product development with AI. What brings you here today?");
    }, 1000);
}

// Toggle chatbot window
function toggleChatbot() {
    if (chatbotState.isOpen) {
        closeChatbot();
    } else {
        openChatbot();
    }
}

function openChatbot() {
    chatbotState.isOpen = true;
    chatbotWindow.classList.add('active');
    chatIcon.style.display = 'none';
    closeIcon.style.display = 'block';
    chatBadge.style.display = 'none';
    chatbotInput.focus();
    
    if (!chatbotState.sessionStartTime) {
        chatbotState.sessionStartTime = Date.now();
    }
}

function closeChatbot() {
    chatbotState.isOpen = false;
    chatbotWindow.classList.remove('active');
    chatIcon.style.display = 'block';
    closeIcon.style.display = 'none';
}

function minimizeChatbot() {
    closeChatbot();
}

// Rate limiting
function checkRateLimit() {
    const now = Date.now();
    const minuteAgo = now - 60000;
    
    // Check session timeout
    if (now - chatbotState.sessionStartTime > CHATBOT_CONFIG.sessionTimeout) {
        chatbotState.reset();
        addBotMessage("Session expired. Starting a new conversation.");
        return true;
    }
    
    // Check message limits
    if (chatbotState.messageCount >= CHATBOT_CONFIG.maxMessagesPerSession) {
        return false;
    }
    
    // Simple rate limit check
    const recentMessages = chatbotState.conversationHistory.filter(
        msg => msg.timestamp > minuteAgo && msg.role === 'user'
    );
    
    return recentMessages.length < CHATBOT_CONFIG.maxMessagesPerMinute;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    const message = chatbotInput.value.trim();
    if (!message) return;
    
    // Check message length
    if (message.length < CHATBOT_CONFIG.minMessageLength || 
        message.length > CHATBOT_CONFIG.maxMessageLength) {
        addBotMessage("Please enter a message between 2 and 500 characters.");
        return;
    }
    
    // Rate limiting
    if (!checkRateLimit()) {
        addBotMessage("Please wait a moment before sending another message.");
        return;
    }
    
    // Block messages after submission
    if (chatbotState.submissionComplete) {
        addBotMessage("Thank you! This consultation has been completed. To start a new inquiry, please refresh the page.");
        return;
    }
    
    // Add user message
    addUserMessage(message);
    chatbotInput.value = '';
    
    // Process message
    await processUserMessage(message);
}

// Process user message with server
async function processUserMessage(message) {
    // Add to history
    chatbotState.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: Date.now()
    });
    
    chatbotState.messageCount++;
    showTypingIndicator();
    
    try {
        // Send to secure API endpoint
        const response = await fetch(CHATBOT_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': chatbotState.sessionId
            },
            body: JSON.stringify({
                messages: chatbotState.conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                extractedData: {} // Server will extract from conversation
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Add to history
        chatbotState.conversationHistory.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now()
        });
        
        // Remove any hidden structured data from display
        const displayResponse = aiResponse.replace(/<!--STRUCTURED_DATA:[\s\S]*?-->/g, '');
        
        hideTypingIndicator();
        addBotMessage(displayResponse);
        
        // Check if AI is asking for confirmation
        if (isConfirmationMessage(aiResponse)) {
            chatbotState.awaitingConfirmation = true;
            setTimeout(() => {
                addConfirmationButtons();
            }, 500);
        }
        
        // Check if server indicated completion
        if (data.serverScore && data.serverScore >= 0) {
            console.log('Lead scored server-side:', data.serverScore);
        }
        
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        addBotMessage("I'm having trouble connecting right now. Please try again in a moment or contact us directly at adrian@amplifyx.com.au");
    }
}

// Check if message is asking for confirmation
function isConfirmationMessage(message) {
    const lowerMessage = message.toLowerCase();
    return (
        lowerMessage.includes('is this correct') ||
        lowerMessage.includes('is everything correct') ||
        lowerMessage.includes("if that's everything correct") ||
        lowerMessage.includes("i'll pass these details")
    );
}

// Add confirmation buttons
function addConfirmationButtons() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'quick-actions';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'quick-action-btn';
    confirmBtn.textContent = "Yes, that's correct ✅";
    confirmBtn.onclick = () => {
        handleConfirmation(true);
    };
    
    const updateBtn = document.createElement('button');
    updateBtn.className = 'quick-action-btn';
    updateBtn.textContent = "I need to update something 📝";
    updateBtn.onclick = () => {
        handleConfirmation(false);
    };
    
    actionsDiv.appendChild(confirmBtn);
    actionsDiv.appendChild(updateBtn);
    messageDiv.appendChild(actionsDiv);
    
    chatbotMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Handle confirmation
async function handleConfirmation(confirmed) {
    if (confirmed) {
        chatbotInput.value = "Yes, that's correct ✅";
        chatbotState.submissionComplete = true;
    } else {
        chatbotInput.value = "I need to update something 📝";
    }
    
    handleSubmit(new Event('submit'));
}

// UI Helper Functions
function addBotMessage(text, quickActions = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot';
    
    let content = '<div class="message-content">';
    const paragraphs = text.split('\n\n');
    paragraphs.forEach(p => {
        if (p.trim()) {
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initChatbot();
    
    // Show chat button after delay
    setTimeout(() => {
        if (chatbotContainer) {
            chatbotContainer.style.opacity = '0';
            chatbotContainer.style.display = 'block';
            setTimeout(() => {
                chatbotContainer.style.transition = 'opacity 0.5s ease';
                chatbotContainer.style.opacity = '1';
            }, 100);
        }
    }, 3000);
});