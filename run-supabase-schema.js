#!/usr/bin/env node

// Script to run SQL schema in Supabase using the Management API
const fs = require('fs');
const https = require('https');

// Configuration
const PROJECT_REF = 'gwxkufgvcxkluyprovaf';
const ACCESS_TOKEN = 'sbp_dd79466d1767c391f8e61a0655d5d9c0b7058611';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGt1Zmd2Y3hrbHV5cHJvdmFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY5NDM1MiwiZXhwIjoyMDcwMjcwMzUyfQ.BjU-O33ec3WtM3NxLQPw3JCYTeweGxBDONrZrj_zAx4';

// Read the SQL schema
const sqlSchema = fs.readFileSync('./supabase-schema.sql', 'utf8');

// Function to execute SQL via Supabase REST API
async function executeSql(sql) {
  const data = JSON.stringify({ query: sql });
  
  const options = {
    hostname: `${PROJECT_REF}.supabase.co`,
    port: 443,
    path: '/rest/v1/rpc/exec_sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve(responseData);
        } else {
          reject(`Error: ${res.statusCode} - ${responseData}`);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Alternative: Use fetch if available (Node 18+)
async function runSchema() {
  console.log('🚀 Running Supabase schema...');
  
  try {
    // Use the Supabase REST API directly
    const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        query: sqlSchema
      })
    });

    if (!response.ok) {
      // If RPC doesn't work, we'll need to use the Management API
      console.log('Direct SQL execution not available via REST API.');
      console.log('Using alternative method...');
      
      // Try Management API
      const mgmtResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: sqlSchema
        })
      });
      
      if (!mgmtResponse.ok) {
        const error = await mgmtResponse.text();
        throw new Error(`Management API error: ${error}`);
      }
      
      console.log('✅ Schema executed via Management API!');
    } else {
      console.log('✅ Schema executed successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error running schema:', error.message);
    console.log('\nPlease run the schema manually in the Supabase SQL editor:');
    console.log('https://supabase.com/dashboard/project/gwxkufgvcxkluyprovaf/sql/new');
  }
}

// Check if fetch is available
if (typeof fetch === 'undefined') {
  console.log('Fetch not available, installing node-fetch...');
  const { exec } = require('child_process');
  exec('npm install node-fetch', (error) => {
    if (error) {
      console.error('Could not install node-fetch:', error);
      console.log('\nPlease run the schema manually in the Supabase SQL editor:');
      console.log('https://supabase.com/dashboard/project/gwxkufgvcxkluyprovaf/sql/new');
    } else {
      global.fetch = require('node-fetch');
      runSchema();
    }
  });
} else {
  runSchema();
}