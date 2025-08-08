# Chatbot Setup Guide

## Overview
The lead qualification chatbot has been successfully implemented with the following features:

### ✅ Completed Features
1. **Floating Chat Widget** - Purple gradient design matching Amplifyx branding
2. **Lead Qualification Flow** - 8-step qualification process with confirmation:
   - Name
   - Company
   - Email
   - Project Type
   - Timeline
   - Budget
   - **Details Confirmation** - Shows all collected data for user verification
   - **Edit Capability** - Users can modify any field before final submission
3. **Spam Detection** - Multiple layers of protection:
   - Message length validation
   - Spam keyword filtering
   - Special character ratio checks
   - Repeated character detection
4. **Rate Limiting** - Prevents abuse:
   - Max 20 messages per session
   - Max 5 messages per minute
   - 30-minute session timeout
5. **Lead Scoring** - Automatic qualification based on responses
6. **Quick Action Buttons** - Pre-filled responses for better UX
7. **Mobile Responsive** - Full-screen on mobile devices
8. **Typing Indicators** - Shows when bot is "thinking"

## Email Integration Setup

Since this is a static website, you'll need to set up email sending through one of these options:

### Option 1: EmailJS (Recommended for Quick Setup)
1. Sign up at https://www.emailjs.com/
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template
4. Get your User ID and Service ID
5. Update the `sendLeadEmail()` function in `chatbot.js`:

```javascript
// Add EmailJS library to index.html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>

// In chatbot.js, update sendLeadEmail():
async function sendLeadEmail() {
    emailjs.init("YOUR_USER_ID");
    
    const templateParams = {
        to_email: 'adrian@amplifyx.com.au',
        from_name: chatbotState.leadData.name,
        from_email: chatbotState.leadData.email,
        company: chatbotState.leadData.company,
        project_type: chatbotState.leadData.projectType,
        timeline: chatbotState.leadData.timeline,
        budget: chatbotState.leadData.budget,
        qualified: chatbotState.leadData.qualified ? 'Yes' : 'No',
        conversation: chatbotState.conversationHistory.map(m => 
            `${m.role}: ${m.content}`
        ).join('\n')
    };
    
    try {
        await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
        console.log('Lead email sent successfully');
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}
```

### Option 2: Netlify Functions (If hosting on Netlify)
1. Create a `netlify/functions/send-lead.js` file
2. Use SendGrid or another email service
3. Deploy to Netlify

### Option 3: Custom Backend
Create a simple Express.js server with nodemailer:

```javascript
// server.js
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    }
});

app.post('/api/send-lead', async (req, res) => {
    const { leadData, conversationHistory } = req.body;
    
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'adrian@amplifyx.com.au',
        subject: `New Lead: ${leadData.name} from ${leadData.company}`,
        html: `
            <h2>New Lead Information</h2>
            <p><strong>Name:</strong> ${leadData.name}</p>
            <p><strong>Email:</strong> ${leadData.email}</p>
            <p><strong>Company:</strong> ${leadData.company}</p>
            <p><strong>Project Type:</strong> ${leadData.projectType}</p>
            <p><strong>Timeline:</strong> ${leadData.timeline}</p>
            <p><strong>Budget:</strong> ${leadData.budget}</p>
            <p><strong>Qualified:</strong> ${leadData.qualified ? 'Yes' : 'No'}</p>
            <h3>Conversation History</h3>
            <pre>${JSON.stringify(conversationHistory, null, 2)}</pre>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
```

## OpenAI API Integration

To enable AI responses after the qualification flow:

1. **Get an OpenAI API Key**:
   - Sign up at https://platform.openai.com/
   - Create an API key in your account settings
   - Add usage limits to control costs

2. **Add the API Key** (Three secure options):
   
   **Option A: Through the Chat Interface (Recommended)**
   - After completing the qualification flow, the bot will prompt you to add an API key
   - Simply paste your key when prompted
   - The key is stored securely in localStorage and never sent to servers
   
   **Option B: Via Browser Console**:
   ```javascript
   localStorage.setItem('openai_api_key', 'your-api-key-here');
   ```
   
   **Option C: Environment Variables (Production)**:
   - Use a backend proxy to handle API calls
   - Store keys in environment variables
   - Never expose keys in frontend code

**⚠️ SECURITY WARNING**: 
- NEVER hardcode API keys in your source code
- NEVER commit API keys to version control
- If a key is accidentally exposed, revoke it immediately in your OpenAI dashboard
- Use environment variables or secure key management services in production

3. **Cost Controls Already Implemented**:
   - Max 150 tokens per response
   - Rate limiting (5 messages/minute)
   - Session limits (20 messages max)
   - 30-minute session timeout

## Testing the Chatbot

1. Open the website in your browser
2. Wait 3 seconds for the chat button to appear
3. Click the purple chat button in the bottom-right
4. Go through the qualification flow:
   - Answer the initial question
   - Provide your name
   - Enter company name
   - Provide email
   - Select project type
   - Choose timeline
   - Select budget range
5. **Review and confirm your details**:
   - The bot will show all collected information
   - Choose "Yes, everything is correct ✅" to proceed
   - Or choose "I need to edit something 📝" to modify any field
6. After confirmation:
   - You'll receive a reference number (e.g., AMP-KX8N9P2)
   - The bot confirms your email address where Adrian will contact you
   - Option to add OpenAI API key for continued AI conversation
7. Check browser console for complete lead data (until email backend is set up)

## Lead Scoring Logic

Leads are automatically scored and qualified:
- **Timeline**: ASAP (30pts), Within 1 month (25pts), 1-3 months (20pts), 3-6 months (10pts)
- **Budget**: $100k+ (30pts), $50k-100k (25pts), $25k-50k (20pts), $10k-25k (15pts)
- **Project Type**: Defined project (20pts)
- **Company**: Provided (10pts)
- **Email**: Valid (10pts)

**Qualification Threshold**: 60+ points = Qualified lead

## Customization

### Change Colors
Edit `css/chatbot.css`:
```css
.chatbot-toggle {
    background: linear-gradient(135deg, #7B3FF2 0%, #E94CFF 100%);
}
```

### Modify Questions
Edit the `QUALIFICATION_QUESTIONS` array in `js/chatbot.js`

### Adjust Rate Limits
Modify `CHATBOT_CONFIG` in `js/chatbot.js`:
```javascript
maxMessagesPerSession: 20,
maxMessagesPerMinute: 5,
```

## Security Notes

1. **Never expose API keys in frontend code** - Use environment variables or backend proxy
2. **Implement CORS** properly if using a backend
3. **Sanitize all user inputs** before sending emails
4. **Use HTTPS** in production
5. **Consider GDPR compliance** for EU users

## Next Steps

1. Set up email integration (EmailJS recommended for quick setup)
2. Add OpenAI API key for AI responses
3. Test thoroughly with different scenarios
4. Monitor usage and adjust rate limits as needed
5. Consider adding analytics to track conversion rates