// Quick test to verify Supabase connection
import fetch from 'node-fetch';

async function testSupabaseConnection() {
    const SUPABASE_URL = 'https://gwxkufgvcxkluyprovaf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2OTQzNTIsImV4cCI6MjA3MDI3MDM1Mn0.d4Eij6qtIhZABZxxNEYRIElbKbRwuD1bL595je4KJ88';
    
    console.log('Testing Supabase connection...');
    
    try {
        // Test 1: Check if Supabase is reachable
        const healthCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        console.log('✓ Supabase API is reachable:', healthCheck.status);
        
        // Test 2: Try to query the leads table
        const leadsResponse = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (leadsResponse.ok) {
            const data = await leadsResponse.json();
            console.log('✓ Leads table exists and is accessible');
            console.log('  Current lead count:', data.length > 0 ? 'Has data' : 'Empty table');
        } else {
            console.log('✗ Error accessing leads table:', leadsResponse.status, leadsResponse.statusText);
        }
        
        // Test 3: Check conversations table
        const convoResponse = await fetch(`${SUPABASE_URL}/rest/v1/conversations?select=*&limit=1`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (convoResponse.ok) {
            console.log('✓ Conversations table exists and is accessible');
        } else {
            console.log('✗ Error accessing conversations table:', convoResponse.status);
        }
        
    } catch (error) {
        console.error('✗ Connection error:', error.message);
    }
}

testSupabaseConnection();