# API Proxy Setup for Production Chatbot

Since we can't expose your OpenAI API key in the frontend code (GitHub blocks it for security), you need to set up a proxy service. Here are your options:

## Option 1: Vercel Edge Functions (Recommended - Free)

1. **Create a Vercel account** at https://vercel.com/

2. **Create a new project** with this API endpoint:

Create `api/chat.js`:
```javascript
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'API request failed' });
  }
}
```

3. **Set environment variable** in Vercel:
   - Go to Settings → Environment Variables
   - Add: `OPENAI_API_KEY` = your actual API key

4. **Update chatbot** to use your proxy:
   ```javascript
   apiEndpoint: 'https://your-vercel-app.vercel.app/api/chat'
   ```

## Option 2: Netlify Functions (Also Free)

1. Create `netlify/functions/chat.js`:
```javascript
exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: event.body
    });

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API request failed' })
    };
  }
};
```

2. Deploy to Netlify with environment variable

## Option 3: Quick Workaround - Use Browser Extension

For immediate testing without a backend:

1. Install a CORS proxy browser extension
2. Store API key in localStorage: 
   ```javascript
   localStorage.setItem('amplifyx_api_key', 'your-key-here')
   ```
3. Update chatbot to read from localStorage

## Option 4: Use a Third-Party Service

Services like BuildShip or Pipedream provide API proxies:
- https://buildship.com/
- https://pipedream.com/

These handle the API key securely on their servers.

## Current Fallback

Without an API proxy, the chatbot will:
1. Work locally when you have config.js
2. Fall back to keyword-based responses on the live site
3. Still collect and email leads (once EmailJS is configured)

## Recommended Action

1. Set up Vercel (5 minutes)
2. Deploy the proxy function
3. Update your chatbot to use the proxy URL
4. Your chatbot will work with AI for all visitors!

This way, your API key stays secure on Vercel's servers, and your chatbot works perfectly on the live site.