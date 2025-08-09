// Test email notification with existing lead
import fetch from 'node-fetch';

async function testEmailNotification() {
    console.log('Testing email notification system...\n');
    
    // First, let's get a recent high-scoring lead from Supabase
    const SUPABASE_URL = 'https://gwxkufgvcxkluyprovaf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2OTQzNTIsImV4cCI6MjA3MDI3MDM1Mn0.d4Eij6qtIhZABZxxNEYRIElbKbRwuD1bL595je4KJ88';
    
    try {
        // Get a high-scoring lead
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&score=gte.70&order=created_at.desc&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const leads = await response.json();
            
            if (leads.length === 0) {
                console.log('No high-scoring leads found. Creating a test lead...');
                
                // Create a test lead
                const testLead = {
                    session_id: 'test-' + Date.now(),
                    reference_number: 'TEST-' + Date.now().toString(36).toUpperCase(),
                    name: 'Test Notification User',
                    email: 'test@amplifyx.com',
                    phone: '+61 412 345 678',
                    company: 'Test Company Pty Ltd',
                    project_type: 'AI automation for customer service',
                    timeline: 'Within 1 month',
                    budget: '$75,000',
                    score: 85,
                    qualified: true
                };
                
                const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(testLead)
                });
                
                if (createResponse.ok) {
                    const newLead = await createResponse.json();
                    console.log('Created test lead:', newLead[0].reference_number);
                    await triggerNotification(newLead[0]);
                } else {
                    console.error('Failed to create test lead:', await createResponse.text());
                }
            } else {
                const lead = leads[0];
                console.log(`Found existing lead: ${lead.name} (${lead.reference_number})`);
                console.log(`Score: ${lead.score}, Company: ${lead.company}`);
                await triggerNotification(lead);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function triggerNotification(lead) {
    console.log('\nTriggering email notification...');
    
    try {
        const response = await fetch('https://amplifyx-chatbot.vercel.app/api/admin-notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                leadId: lead.id,
                referenceNumber: lead.reference_number
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Notification endpoint called successfully');
            console.log('Response:', result);
            
            if (!result.success) {
                console.log('\n⚠️  Email service not configured yet!');
                console.log('To receive emails, you need to:');
                console.log('1. Sign up for Resend.com (free tier available)');
                console.log('2. Get your API key');
                console.log('3. Run: vercel env add RESEND_API_KEY production');
                console.log('4. Paste your API key');
                console.log('5. Redeploy: vercel --prod');
            }
        } else {
            const error = await response.text();
            console.error('❌ Notification failed:', error);
            
            if (error.includes('Database configuration missing')) {
                console.log('\n⚠️  Email service not configured in Vercel!');
                console.log('The API endpoint exists but needs email service setup.');
            }
        }
    } catch (error) {
        console.error('Failed to call notification endpoint:', error);
    }
}

testEmailNotification();