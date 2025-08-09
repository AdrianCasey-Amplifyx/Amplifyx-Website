// Check if any leads have been saved to Supabase
import fetch from 'node-fetch';

async function checkSupabaseLeads() {
    const SUPABASE_URL = 'https://gwxkufgvcxkluyprovaf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2OTQzNTIsImV4cCI6MjA3MDI3MDM1Mn0.d4Eij6qtIhZABZxxNEYRIElbKbRwuD1bL595je4KJ88';
    
    console.log('Checking Supabase leads...\n');
    
    try {
        // Get all leads
        const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const leads = await response.json();
            
            if (leads.length === 0) {
                console.log('No leads found in the database.');
            } else {
                console.log(`Found ${leads.length} lead(s):\n`);
                
                leads.forEach((lead, index) => {
                    console.log(`Lead #${index + 1}:`);
                    console.log(`  ID: ${lead.id}`);
                    console.log(`  Name: ${lead.name || 'Not provided'}`);
                    console.log(`  Email: ${lead.email}`);
                    console.log(`  Company: ${lead.company || 'Not provided'}`);
                    console.log(`  Project: ${lead.project_type || 'Not specified'}`);
                    console.log(`  Score: ${lead.score}`);
                    console.log(`  Created: ${new Date(lead.created_at).toLocaleString()}`);
                    console.log(`  Reference: ${lead.reference_number || 'N/A'}`);
                    console.log('---');
                });
            }
        } else {
            console.error('Error fetching leads:', response.status, response.statusText);
            const error = await response.text();
            console.error('Error details:', error);
        }
        
    } catch (error) {
        console.error('Connection error:', error.message);
    }
}

checkSupabaseLeads();