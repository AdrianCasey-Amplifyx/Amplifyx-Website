// RAG (Retrieval-Augmented Generation) Helper Functions
// Integrates vector search with the chatbot for accurate responses

// Search knowledge base for relevant information
async function searchKnowledge(query, matchCount = 3) {
    try {
        const searchUrl = window.AMPLIFYX_CONFIG?.vectorSearchUrl || 
                         'https://amplifyx-chatbot.vercel.app/api/vector-search';
        
        const response = await fetch(searchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                matchThreshold: 0.3,  // Lower threshold to ensure results are returned
                matchCount: matchCount
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Vector search failed:', response.status, errorText);
            return null;
        }
        
        const data = await response.json();
        console.log(`Vector search returned ${data.results?.length || 0} results`);
        return data.results || [];
        
    } catch (error) {
        console.error('Error searching knowledge base:', error);
        return null;
    }
}

// Format search results as context for the AI
function formatKnowledgeContext(results) {
    if (!results || results.length === 0) {
        return '';
    }
    
    const context = results
        .map((result, index) => {
            const relevance = Math.round(result.similarity * 100);
            const title = result.title || `Source ${index + 1}`;
            return `[${title} - ${relevance}% relevant]:\n${result.content}`;
        })
        .join('\n\n');
    
    return `\n\nRELEVANT COMPANY INFORMATION FROM KNOWLEDGE BASE:\n${context}\n\nIMPORTANT: Use the above verified information to answer the user's question accurately. This information is from Amplifyx's official knowledge base.`;
}

// Augment the user's message with relevant context
async function augmentMessageWithRAG(userMessage, conversationHistory) {
    // Skip RAG for basic greetings or very short messages
    if (userMessage.length < 10 || /^(hi|hello|hey|thanks|bye)$/i.test(userMessage.trim())) {
        return {
            augmentedMessage: userMessage,
            context: null,
            sources: []
        };
    }
    
    // Search for relevant knowledge
    console.log('🔍 Searching knowledge base for:', userMessage);
    const searchResults = await searchKnowledge(userMessage);
    
    // Handle both null (error) and empty array (no results) cases
    if (!searchResults) {
        console.log('⚠️ Knowledge base search failed, continuing without context');
        return {
            augmentedMessage: userMessage,
            context: null,
            sources: []
        };
    }
    
    if (searchResults.length === 0) {
        console.log('📚 No relevant knowledge found (may need lower threshold)');
        return {
            augmentedMessage: userMessage,
            context: null,
            sources: []
        };
    }
    
    console.log(`📚 Found ${searchResults.length} relevant knowledge entries`);
    
    // Format the context
    const context = formatKnowledgeContext(searchResults);
    
    // Create augmented message
    const augmentedMessage = userMessage + context;
    
    return {
        augmentedMessage: augmentedMessage,
        context: context,
        sources: searchResults.map(r => ({
            content: r.content,
            similarity: r.similarity,
            category: r.category
        }))
    };
}

// Enhanced system prompt for RAG
const RAG_SYSTEM_PROMPT = `You are a consultation assistant for Amplifyx Technologies, an AI consultancy in Brisbane, Australia.

CRITICAL RULES:
1. Never greet (no Hi/Hello). User already saw greeting. Go straight to their request.
2. Do NOT generate reference numbers (like AMP-XXXXX). The system generates these automatically.
3. When you receive RELEVANT COMPANY INFORMATION in the user message, use it as the source of truth.
4. If information is provided in the context, use it. If not, follow the standard rules about not making things up.

USING CONTEXT:
- When context is provided (marked as "RELEVANT COMPANY INFORMATION"), prioritize this information
- The context includes relevance percentages - higher percentages mean more relevant
- Always base your answers on the provided context when available
- If context doesn't fully answer the question, you can still say you'll connect them with the team

STANDARD KNOWLEDGE (when no context provided):
- Company: Amplifyx Technologies (AI consultancy)
- Services: AI automation, custom chatbots, rapid prototyping, AI strategy consulting
- Location: Brisbane, Australia
- Focus: Helping businesses implement AI solutions

CONVERSATION FLOW:
1. Check if context answers the user's question
2. If yes, provide accurate answer based on context
3. If no, follow standard flow: understand need, gather details, or redirect to team
4. When you have enough info for a lead, show summary and confirm

Keep responses concise and professional. Prioritize accuracy using provided context.`;

// Export functions for use in chatbot
window.RAGHelper = {
    searchKnowledge,
    formatKnowledgeContext,
    augmentMessageWithRAG,
    RAG_SYSTEM_PROMPT
};