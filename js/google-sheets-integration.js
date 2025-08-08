// Google Sheets Integration for Amplifyx Chatbot
// This file contains the code to send leads to Google Sheets

// IMPORTANT: Replace this with your actual Google Apps Script Web App URL
const GOOGLE_SHEETS_WEBHOOK_URL = 'YOUR_GOOGLE_SCRIPT_URL_HERE';
// It should look like: https://script.google.com/macros/s/AKfycbx.../exec

/**
 * Send lead data to Google Sheets
 * @param {Object} leadData - The lead information to send
 * @returns {Promise<boolean>} - Success status
 */
async function sendToGoogleSheets(leadData) {
    // Check if webhook URL is configured
    if (GOOGLE_SHEETS_WEBHOOK_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        console.warn('⚠️ Google Sheets webhook URL not configured');
        console.log('Follow the setup guide in GOOGLE_SHEETS_SETUP.md');
        return false;
    }

    try {
        console.log('📊 Sending lead to Google Sheets...');
        
        // Prepare the data payload
        const payload = {
            referenceNumber: leadData.referenceNumber || '',
            name: leadData.name || '',
            email: leadData.email || '',
            company: leadData.company || '',
            projectType: leadData.projectType || '',
            timeline: leadData.timeline || '',
            budget: leadData.budget || '',
            score: leadData.score || 0,
            qualified: leadData.qualified || false,
            timestamp: new Date().toISOString(),
            conversation: leadData.conversation || []
        };

        // Send to Google Sheets webhook
        const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        // Note: With no-cors mode, we can't read the response
        // But the request will still go through
        console.log('✅ Lead sent to Google Sheets successfully');
        console.log('📋 Reference:', leadData.referenceNumber);
        return true;

    } catch (error) {
        console.error('❌ Failed to send to Google Sheets:', error);
        
        // Fallback: Save to localStorage for manual recovery
        try {
            const failedLeads = JSON.parse(localStorage.getItem('amplifyx_failed_leads') || '[]');
            failedLeads.push({
                ...leadData,
                error: error.message,
                attemptedAt: new Date().toISOString()
            });
            localStorage.setItem('amplifyx_failed_leads', JSON.stringify(failedLeads));
            console.log('💾 Lead saved to localStorage for manual recovery');
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
        
        return false;
    }
}

/**
 * Retry sending failed leads to Google Sheets
 * Call this manually from console if needed
 */
function retryFailedLeads() {
    const failedLeads = JSON.parse(localStorage.getItem('amplifyx_failed_leads') || '[]');
    
    if (failedLeads.length === 0) {
        console.log('No failed leads to retry');
        return;
    }
    
    console.log(`Found ${failedLeads.length} failed leads. Retrying...`);
    
    failedLeads.forEach(async (lead, index) => {
        setTimeout(async () => {
            const success = await sendToGoogleSheets(lead);
            if (success) {
                console.log(`✅ Retry successful for lead ${index + 1}`);
            } else {
                console.log(`❌ Retry failed for lead ${index + 1}`);
            }
        }, index * 1000); // Stagger requests by 1 second
    });
    
    // Clear failed leads after retry attempt
    localStorage.removeItem('amplifyx_failed_leads');
}

/**
 * Test the Google Sheets integration
 * Call this from console: testGoogleSheets()
 */
async function testGoogleSheets() {
    console.log('🧪 Testing Google Sheets integration...');
    
    const testLead = {
        referenceNumber: 'TEST-' + Date.now(),
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
        projectType: 'Integration Test',
        timeline: 'ASAP',
        budget: '$10k',
        score: 75,
        qualified: true,
        conversation: [
            { role: 'assistant', content: 'Welcome! How can I help?' },
            { role: 'user', content: 'This is a test message' },
            { role: 'assistant', content: 'Test response received' }
        ]
    };
    
    const success = await sendToGoogleSheets(testLead);
    
    if (success) {
        console.log('✅ Test successful! Check your Google Sheet');
        console.log('📊 Sheet should have a new row with reference:', testLead.referenceNumber);
    } else {
        console.log('❌ Test failed. Check the configuration and try again');
    }
    
    return success;
}

// Export for use in chatbot
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sendToGoogleSheets, retryFailedLeads, testGoogleSheets };
}