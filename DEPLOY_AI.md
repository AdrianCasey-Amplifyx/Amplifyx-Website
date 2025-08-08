# Deploy AI Chatbot in 5 Minutes with Vercel

## Quick Setup Steps:

### 1. Install Vercel CLI (1 minute)
```bash
npm install -g vercel
```

### 2. Deploy to Vercel (2 minutes)
Run this command in your project folder:
```bash
vercel
```

Follow the prompts:
- Login/signup when prompted
- Choose "Deploy to Vercel"
- Project name: `amplifyx-chatbot`
- Link to existing project? No
- Which directory? `./` (current)
- Override settings? No

### 3. Add Your API Key (1 minute)
```bash
vercel env add OPENAI_API_KEY
```
- Choose "Production"
- Paste your OpenAI API key (starts with sk-proj-)
- Press enter

### 4. Deploy with Environment Variable (1 minute)
```bash
vercel --prod
```

### 5. Get Your API URL
After deployment, you'll get a URL like:
```
https://amplifyx-chatbot.vercel.app
```

Your API endpoint will be:
```
https://amplifyx-chatbot.vercel.app/api/chat
```

### 6. Update Your Chatbot
Edit `js/config-public.js`:
```javascript
window.AMPLIFYX_CONFIG = {
    // Your Vercel API endpoint
    apiProxyUrl: 'https://amplifyx-chatbot.vercel.app/api/chat',
    
    // ... rest of config
};
```

### 7. Update chatbot-ai.js to use proxy
Change line ~8 from:
```javascript
apiEndpoint: 'https://api.openai.com/v1/chat/completions',
```
To:
```javascript
apiEndpoint: window.AMPLIFYX_CONFIG?.apiProxyUrl || 'https://api.openai.com/v1/chat/completions',
```

### Done! 🎉
Your chatbot now has full AI capabilities on the live site, with your API key secure on Vercel's servers.

## Test It
1. Visit https://amplifyx.com.au
2. Click the chat button
3. You'll get AI-powered responses!

## Cost Control
- Vercel free tier: 100GB bandwidth/month (plenty for chatbot)
- Only charged for OpenAI API usage
- Monitor usage in OpenAI dashboard

## Troubleshooting
If not working:
1. Check Vercel logs: `vercel logs`
2. Verify environment variable: `vercel env ls`
3. Ensure CORS allows your domain