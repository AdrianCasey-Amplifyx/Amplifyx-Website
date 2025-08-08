# EmailJS Setup Guide - Get Lead Emails in 5 Minutes

## Quick Setup (5 minutes)

### Step 1: Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Click "Sign Up Free"
3. Verify your email

### Step 2: Add Your Email Service
1. In EmailJS Dashboard, click "Email Services"
2. Click "Add New Service"
3. Choose your provider:
   - **Gmail** (recommended - easiest)
   - Outlook
   - Yahoo
   - Or connect via SMTP

4. For Gmail:
   - Click "Connect Account"
   - Sign in with Google
   - Allow permissions
   - Give it a name like "Amplifyx Leads"
   - Click "Create Service"
   - **Copy the Service ID** (looks like: `service_abc123`)

### Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Set up your template:

**Subject:**
```
New Lead: {{lead_name}} - Ref: {{reference_number}}
```

**From Name:**
```
Amplifyx Chatbot
```

**From Email:**
```
{{lead_email}}
```

**Reply To:**
```
{{lead_email}}
```

**To Email:**
```
adrian@amplifyx.com.au
```

**Content (HTML):**
```html
<h2>🎯 New Lead Submission</h2>

<table style="font-family: Arial, sans-serif; border-collapse: collapse; width: 100%;">
  <tr style="background: linear-gradient(135deg, #7B3FF2, #E94CFF); color: white;">
    <td style="padding: 15px;" colspan="2">
      <h3 style="margin: 0;">Lead Information - {{reference_number}}</h3>
    </td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; width: 30%; border-bottom: 1px solid #eee;">Status:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">
      <strong style="color: {{qualified}} === 'YES ✅' ? '#2ED573' : '#FFA502';">{{qualified}}</strong>
      (Score: {{score}}/100)
    </td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Name:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">{{lead_name}}</td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Email:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">
      <a href="mailto:{{lead_email}}">{{lead_email}}</a>
    </td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Company:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">{{company}}</td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Project Type:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">{{project_type}}</td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Timeline:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">{{timeline}}</td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Budget:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">{{budget}}</td>
  </tr>
  
  <tr>
    <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #eee;">Submitted:</td>
    <td style="padding: 10px; border-bottom: 1px solid #eee;">{{timestamp}}</td>
  </tr>
</table>

<h3 style="margin-top: 30px; color: #7B3FF2;">Conversation Transcript</h3>
<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-family: monospace; font-size: 12px;">{{conversation}}</div>

<p style="margin-top: 30px; padding: 15px; background: #E8F5E9; border-left: 4px solid #4CAF50;">
  <strong>Action Required:</strong> Follow up within 24 hours
</p>
```

4. Click "Save"
5. **Copy the Template ID** (looks like: `template_xyz789`)

### Step 4: Get Your User ID
1. Go to "Integration" in the sidebar
2. Under "API Keys" section
3. **Copy your User ID** (looks like: `user_ABC123XYZ`)

### Step 5: Update Your Chatbot Configuration
1. Open `/js/chatbot-ai.js`
2. Find these lines near the top (around line 10-14):
```javascript
emailJS: {
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    userId: 'YOUR_USER_ID'
}
```

3. Replace with your actual IDs:
```javascript
emailJS: {
    serviceId: 'service_abc123',  // Your actual service ID
    templateId: 'template_xyz789', // Your actual template ID
    userId: 'user_ABC123XYZ'       // Your actual user ID
}
```

4. Save the file

### Step 6: Test It!
1. Open your website
2. Click the chat button
3. Go through a test conversation:
   - Say "I need AI integration"
   - Give a test name: "Test User"
   - Company: "Test Company"
   - Email: your-email@example.com
   - Timeline: "ASAP"
   - Budget: "$50k"
4. Confirm the details
5. Check your email - you should receive the lead notification!

## Troubleshooting

### Not receiving emails?
1. Check spam folder
2. Verify all 3 IDs are correct
3. Check EmailJS dashboard for send history
4. Open browser console (F12) for errors

### Email quota
- Free tier: 200 emails/month
- Usually sufficient for lead generation
- Upgrade if needed

### Test without real email
1. Check browser console (F12)
2. Look for "LEAD SUBMISSION" logs
3. All leads are also saved to localStorage as backup

## Security Notes
- EmailJS IDs are safe to expose (they're public)
- No server or backend needed
- Emails sent directly from browser
- User email addresses are never exposed

## Customization

### Change recipient email
In `chatbot-ai.js`, find:
```javascript
recipientEmail: 'adrian@amplifyx.com.au'
```
Change to your preferred email.

### Modify email template
1. Go to EmailJS dashboard
2. Edit your template
3. Changes apply immediately

### Add SMS notifications (optional)
EmailJS supports SMS via Twilio integration for instant alerts.

## Backup System
Even if EmailJS fails, leads are saved in browser localStorage:
```javascript
// To retrieve saved leads from console:
JSON.parse(localStorage.getItem('amplifyx_leads'))
```

## Support
- EmailJS Docs: https://www.emailjs.com/docs/
- EmailJS Support: support@emailjs.com

Your chatbot is now ready to send you real email notifications for every lead! 🎉