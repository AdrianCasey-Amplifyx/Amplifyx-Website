# Google Sheets Lead Database Setup

## Quick Setup (10 minutes)

### Step 1: Create Your Lead Database Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: "Amplifyx Leads Database"
4. Set up the following columns in Row 1:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Reference | Name | Email | Company | Project Type | Timeline | Budget | Score | Qualified | Status | Conversation |

### Step 2: Create Google Apps Script Web App

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete any existing code
3. Copy and paste this code:

```javascript
// Google Apps Script - Lead Collection Webhook
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Format conversation for readability
    const conversation = data.conversation ? 
      data.conversation.map(msg => 
        `[${msg.role.toUpperCase()}]: ${msg.content}`
      ).join('\n\n') : '';
    
    // Prepare the row data
    const row = [
      new Date().toLocaleString(),           // Timestamp
      data.referenceNumber || '',            // Reference
      data.name || '',                       // Name
      data.email || '',                      // Email
      data.company || '',                    // Company
      data.projectType || '',                // Project Type
      data.timeline || '',                   // Timeline
      data.budget || '',                     // Budget
      data.score || 0,                       // Score
      data.qualified ? 'YES' : 'NO',         // Qualified
      'New',                                  // Status (you can update manually)
      conversation                           // Full Conversation
    ];
    
    // Append the row to the sheet
    sheet.appendRow(row);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        'status': 'success',
        'message': 'Lead saved successfully',
        'reference': data.referenceNumber
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        'status': 'error',
        'message': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify setup
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      'status': 'ready',
      'message': 'Amplifyx Lead Collection Webhook is active'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Click **Save** (💾 icon)
5. Name the project: "Amplifyx Lead Webhook"

### Step 3: Deploy as Web App

1. Click **Deploy → New Deployment**
2. Click the gear icon ⚙️ → **Web app**
3. Configure:
   - **Description**: "Amplifyx Lead Collection"
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click **Deploy**
5. **IMPORTANT**: Copy the Web App URL (looks like):
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
6. Click **Done**

### Step 4: Update Your Chatbot

Add this code to your `js/chatbot-ai.js` file in the `sendLeadEmail` function (around line 624, after localStorage):

```javascript
// Send to Google Sheets
try {
    const googleSheetUrl = 'YOUR_GOOGLE_SCRIPT_URL_HERE'; // Paste your Web App URL
    
    const leadData = {
        referenceNumber: chatbotState.leadData.referenceNumber,
        name: chatbotState.leadData.name,
        email: chatbotState.leadData.email,
        company: chatbotState.leadData.company,
        projectType: chatbotState.leadData.projectType,
        timeline: chatbotState.leadData.timeline,
        budget: chatbotState.leadData.budget,
        score: chatbotState.leadData.score,
        qualified: chatbotState.leadData.qualified,
        conversation: chatbotState.conversationHistory
    };
    
    fetch(googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData)
    }).then(() => {
        console.log('✅ Lead sent to Google Sheets');
    }).catch(error => {
        console.error('❌ Google Sheets error:', error);
    });
} catch (error) {
    console.error('Failed to send to Google Sheets:', error);
}
```

### Step 5: Test Your Setup

1. Open your Web App URL in a browser
   - Should see: `{"status":"ready","message":"Amplifyx Lead Collection Webhook is active"}`

2. Test with the chatbot:
   - Go through a full conversation
   - Submit the lead
   - Check your Google Sheet - the lead should appear!

## Advanced Features

### Add Email Notifications

In Google Apps Script, add this after `sheet.appendRow(row);`:

```javascript
// Send email notification for high-value leads
if (data.score >= 70) {
    MailApp.sendEmail({
        to: 'adrian@amplifyx.com.au',
        subject: `🔥 HOT LEAD: ${data.name} - ${data.company}`,
        htmlBody: `
            <h2>High Priority Lead Alert</h2>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Company:</strong> ${data.company}</p>
            <p><strong>Budget:</strong> ${data.budget}</p>
            <p><strong>Timeline:</strong> ${data.timeline}</p>
            <p><strong>Score:</strong> ${data.score}/100</p>
            <hr>
            <p><a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">View in Sheet</a></p>
        `
    });
}
```

### Auto-Format Your Sheet

Add conditional formatting:
1. Select the Score column
2. Format → Conditional formatting
3. Color scale: Red (0) to Green (100)

For Qualified column:
1. Select column
2. Format → Conditional formatting
3. If text is "YES" → Green background
4. If text is "NO" → Orange background

### Create a Dashboard

1. Click **Insert → Chart**
2. Create charts for:
   - Leads over time (line chart)
   - Lead sources (pie chart)
   - Qualification rate (gauge)
   - Timeline distribution (bar chart)

## Troubleshooting

### Not seeing leads in the sheet?
1. Check browser console for errors
2. Verify the Web App URL is correct
3. Make sure deployment is set to "Anyone"
4. Re-deploy if needed (Deploy → Manage Deployments → Edit → Version: New → Deploy)

### CORS errors?
- The `mode: 'no-cors'` should handle this
- If issues persist, check that Web App access is set to "Anyone"

### Want to update the script?
1. Make changes in Apps Script
2. Save the project
3. Deploy → Manage Deployments
4. Edit → Version: "New"
5. Update

## Benefits of This Approach

✅ **Free**: No API costs or limits  
✅ **Real-time**: Instant lead capture  
✅ **Secure**: Data stays in your Google account  
✅ **Accessible**: View from anywhere  
✅ **Collaborative**: Share with team members  
✅ **Automated**: Can trigger emails, Slack, etc.  
✅ **Historical**: Full conversation history preserved  
✅ **Exportable**: Easy to export to CRM later  

## Optional: Connect to Zapier

Your Google Sheet can trigger Zapier workflows to:
- Add leads to CRM (HubSpot, Salesforce, etc.)
- Send Slack notifications
- Create Trello cards
- Add to email sequences
- Update Notion databases

## Next Steps

1. Set up the Google Sheet
2. Deploy the Apps Script
3. Update your chatbot code
4. Test with a real conversation
5. Check your sheet for the lead!

Your lead database is now ready! 🎉