// Google Apps Script - Lead Collection Webhook for Amplifyx
// Copy this entire file and paste it into your Google Apps Script editor
// Extensions → Apps Script in your Google Sheet

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
    
    // Send email notification for high-value leads (score >= 70)
    if (data.score >= 70) {
      try {
        MailApp.sendEmail({
          to: 'adrian@amplifyx.com.au',
          subject: `🔥 HOT LEAD: ${data.name} - ${data.company} (Score: ${data.score})`,
          htmlBody: `
            <h2>High Priority Lead Alert</h2>
            <p><strong>Reference:</strong> ${data.referenceNumber}</p>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            <p><strong>Company:</strong> ${data.company}</p>
            <p><strong>Project:</strong> ${data.projectType}</p>
            <p><strong>Budget:</strong> ${data.budget}</p>
            <p><strong>Timeline:</strong> ${data.timeline}</p>
            <p><strong>Score:</strong> ${data.score}/100</p>
            <hr>
            <p><strong>View in Sheet:</strong> <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">Open Spreadsheet</a></p>
          `
        });
        console.log('Email notification sent for high-value lead');
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }
    
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
      'message': 'Amplifyx Lead Collection Webhook is active',
      'sheet': SpreadsheetApp.getActiveSpreadsheet().getName()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Manual test function - run this in the Apps Script editor to test
function testWebhook() {
  // Create test data
  const testData = {
    postData: {
      contents: JSON.stringify({
        referenceNumber: 'TEST-' + new Date().getTime(),
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
        projectType: 'AI Integration',
        timeline: 'ASAP',
        budget: '$50k',
        score: 75,
        qualified: true,
        conversation: [
          { role: 'assistant', content: 'Welcome! How can I help?' },
          { role: 'user', content: 'I need AI integration' },
          { role: 'assistant', content: 'Great! Let me help you with that.' }
        ]
      })
    }
  };
  
  // Call the doPost function
  const result = doPost(testData);
  
  // Log the result
  console.log('Test result:', result.getContent());
  
  // Check the spreadsheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastRowData = sheet.getRange(lastRow, 1, 1, 12).getValues()[0];
  console.log('Last row added:', lastRowData);
  
  return 'Test complete - check your spreadsheet!';
}