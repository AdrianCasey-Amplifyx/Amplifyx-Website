# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Amplifyx Technologies website - a static single-page application with an AI-powered lead qualification chatbot. No build process or framework dependencies - pure HTML, CSS, and vanilla JavaScript.

## Architecture

### Core Components
1. **Main Website** (`index.html`, `js/main.js`, `css/styles.css`)
   - Vanilla JavaScript with no framework
   - Smooth scrolling, parallax effects, mobile-responsive design
   - No build step required

2. **AI Chatbot System** (`js/chatbot-ai.js`)
   - OpenAI GPT-3.5 integration via Vercel proxy
   - Lead qualification flow with confirmation step
   - EmailJS integration for notifications
   - Guard rails to keep conversations on-topic about Amplifyx services
   - NO fallback mode - AI-only or unavailable message

3. **Vercel API Proxy** (`api/chat.js`)
   - Edge function to secure OpenAI API key
   - CORS configured for all origins
   - Environment variable: `OPENAI_API_KEY`

### Configuration System
```javascript
// js/config-public.js - Used in production
window.AMPLIFYX_CONFIG = {
    apiProxyUrl: 'https://amplifyx-chatbot.vercel.app/api/chat',
    emailJS: { serviceId, templateId, userId }
}

// js/config.js - Local development only (git-ignored)
window.AMPLIFYX_CONFIG = {
    openaiApiKey: 'sk-...',
    emailJS: { serviceId, templateId, userId }
}
```

## Development Commands

### Local Development
```bash
# Start local server (no build needed)
python3 -m http.server 8000
# OR
npx http-server

# Test API locally
open test-api.html
```

### Deployment
```bash
# Deploy to GitHub Pages (primary hosting)
git add .
git commit -m "Your message"
git push origin main

# Deploy Vercel API proxy
vercel --prod

# Set Vercel environment variable
vercel env add OPENAI_API_KEY production
```

### IMPORTANT: Always Push AI Changes to GitHub Using CLI
**Any changes to the AI chatbot files MUST be pushed to GitHub using the command line for the live site to update:**
```bash
# After making AI-related changes to any of these files:
# - js/chatbot-ai.js
# - js/config-public.js
# - index.html
# - api/chat.js

# ALWAYS use these CLI commands to push changes:
git add .
git commit -m "Update AI chatbot [describe changes]"
git push origin main

# GitHub Pages will automatically deploy within 2-3 minutes
# Do NOT rely on any other method - use the CLI to ensure changes are deployed
```

## Critical Implementation Details

### Chatbot Requirements
- **MUST** use AI-powered responses (no keyword fallback)
- **MUST** show confirmation before submitting leads
- **MUST** collect: name, email, company, project type, timeline, budget
- **MUST** stay on-topic about Amplifyx services
- System prompt enforces guard rails for conversation

### Script Loading Order (index.html)
```html
<!-- Critical: Load in this exact order -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
<script src="js/config-public.js"></script>
<script src="js/main.js" defer></script>
<script src="js/chatbot-ai.js" defer></script>
```

### API Error Handling
- 401 Unauthorized: OpenAI key not configured on Vercel
- 500 Internal Server Error: Check Vercel logs
- CORS errors: Verify proxy URL is correct

## Deployment Architecture

1. **GitHub Pages** (amplifyx.com.au) - Static site hosting
2. **Vercel** (amplifyx-chatbot.vercel.app) - API proxy for OpenAI
3. **EmailJS** - Email notifications (client-side)

### DNS Configuration (Netlify)
```
Type: A    Host: @    Value: 185.199.108.153
Type: A    Host: @    Value: 185.199.109.153  
Type: A    Host: @    Value: 185.199.110.153
Type: A    Host: @    Value: 185.199.111.153
Type: CNAME Host: www  Value: adriancasey-amplifyxs.github.io
```

## Testing Checklist
- [ ] Chatbot button is visible and clickable
- [ ] AI responds intelligently (not showing "unavailable")
- [ ] Lead confirmation shows before submission
- [ ] Mobile view displays chatbot correctly
- [ ] Console shows no CORS or 401 errors
- [ ] API test page works: `open test-api.html`

## Known Issues & Solutions

### "AI agent unavailable" on live site
1. Check browser console for 401/500 errors
2. Verify OPENAI_API_KEY is set on Vercel
3. Redeploy Vercel function if needed
4. Clear browser cache (Cmd+Shift+R)

### Chatbot not clickable
- Ensure scripts load in correct order (see Script Loading Order above)
- Check for JavaScript errors in console

### API key exposed in Git
- Use js/config-public.js for production
- Never commit js/config.js (it's git-ignored)
- Use Vercel environment variables for API key

## User Requirements Summary
Based on conversation history, the user (Adrian from Amplifyx) requires:
- AI-only chatbot (no fallback mode)
- Lead confirmation before submission
- Professional, on-topic conversations
- No API key prompts for visitors
- Mobile-friendly interface
- Real email notifications for leads

## CURRENT STATUS (As of Jan 10, 2025 - 1:45 AM Brisbane Time)

### ✅ COMPLETED IN LATEST SESSION:
1. **Fixed chatbot hallucination issues** 
   - Updated system prompt with strict anti-hallucination rules
   - Bot now says "I don't have that information" instead of making things up
   
2. **Implemented complete RAG system with Supabase:**
   - Enabled pgvector extension in database
   - Created knowledge_base and knowledge_documents tables
   - Built API endpoints: generate-embeddings, knowledge-manage, vector-search
   - Created admin interface at admin-knowledge.html
   - Integrated RAG helper functions (js/rag-helper.js)
   - Updated chatbot to use GPT-4o model (not 4o-mini)
   
3. **UI/UX Improvements:**
   - Fixed mobile responsiveness - chatbot now fullscreen on mobile
   - Added safe area insets for mobile browser UI
   - Simplified initial buttons to just 3 options:
     - "Book a Discovery Call"
     - "Learn More About Amplifyx"  
     - "Something Else"
   
4. **Lead Management Enhancements:**
   - Added conversation summary field to leads table
   - AI now extracts and summarizes conversations
   - Fixed reference number consistency issues
   - Improved data extraction using AI instead of regex

5. **Knowledge Base Content:**
   - Created comprehensive knowledge-base-content.md
   - Updated location from Melbourne to Brisbane
   - Added detailed service examples (chatbot complexity, automation cases)
   - Added industry experience details
   - Clarified pricing structure

### 🔴 IMMEDIATE NEXT TASK - CRITICAL:
**POPULATE THE KNOWLEDGE BASE WITH EMBEDDINGS**

After restarting Claude with write-access MCP server, execute this:
1. Read all sections from knowledge-base-content.md
2. Split into logical chunks (max 1500 chars each)
3. For each chunk:
   - Call generate-embeddings API to create vector
   - Store in knowledge_base table with category
4. Categories to use:
   - company (overview, values, contact)
   - services (what we offer)
   - process (how we work)
   - pricing (costs and packages)
   - faq (questions and answers)
   - technical (architecture, stack)
   - case_study (examples, automation cases)

### 📝 MCP Server Status:
- **Previous:** Read-only mode (--read-only flag)
- **Current:** Reconfigured for write access
- **Command:** `npx @supabase/mcp-server-supabase@latest --project-ref=gwxkufgvcxkluyprovaf`
- **Action Required:** Restart Claude to apply changes

### 🎯 After Knowledge Base Population:
The chatbot will:
- Use vector search to find relevant information
- Provide accurate answers about Amplifyx
- Know about Brisbane location, industries served, pricing
- Stop hallucinating about careers pages, HR departments, etc.
- Reference actual service examples and case studies

### 📂 Key Files for Reference:
- `/knowledge-base-content.md` - All company information to be embedded
- `/migrations/FULL_RAG_MIGRATION.sql` - Database schema (already applied)
- `/api/knowledge-manage.js` - Endpoint to add knowledge with embeddings
- `/js/rag-helper.js` - RAG integration for chatbot
- `/populate-knowledge-base.html` - Web tool (needs server) or can be done programmatically