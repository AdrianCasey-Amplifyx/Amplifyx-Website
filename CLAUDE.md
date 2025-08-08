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