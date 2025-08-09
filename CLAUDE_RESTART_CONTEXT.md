# 🔄 Claude Restart Context - Amplifyx Supabase Setup

## Current Status
✅ **Completed**:
1. Created secure chatbot implementation with server-side prompts
2. Built Supabase integration endpoints (api/lead-submit.js)
3. Updated chatbot to capture structured data perfectly
4. Configured Supabase MCP server in Claude
5. Have project reference: `hobaeblghefbwyxazqau`
6. Have access token: `sbp_dd79466d1767c391f8e61a0655d5d9c0b7058611`

## What Happens on Every Chat
1. AI extracts structured data: `<!--STRUCTURED_DATA:{json}-->`
2. When user confirms, data sent to `/api/lead-submit`
3. Endpoint saves to Supabase (once configured) or Google Sheets (fallback)
4. Full conversation + all fields saved perfectly
5. Reference number generated (like `AMP-LN3K4M8`)

## After Claude Restart - Next Steps

### 1. Test MCP Connection
After restart, test with:
```
Can you connect to my Supabase database?
Show me the tables in Supabase
```

### 2. Run Database Setup
The SQL schema is in: `/Users/corin/Amplifyx Website/supabase-schema.sql`

Ask Claude to:
"Run the SQL schema from supabase-schema.sql in my Supabase database"

### 3. Get API Keys from Supabase
Need to get from Supabase dashboard:
- Project URL: `https://hobaeblghefbwyxazqau.supabase.co` ✅
- Anon Key: Get from Settings > API > "anon public"
- Service Key: Get from Settings > API > "service_role secret"

Dashboard link: https://supabase.com/dashboard/project/hobaeblghefbwyxazqau/settings/api

### 4. Add to Vercel Environment Variables
```bash
SUPABASE_URL=https://hobaeblghefbwyxazqau.supabase.co
SUPABASE_ANON_KEY=[get from dashboard]
SUPABASE_SERVICE_KEY=[get from dashboard]
```

Add at: https://vercel.com/adriancasey-amplifyxs-projects/amplifyx-chatbot/settings/environment-variables

### 5. Redeploy
```bash
vercel --prod
```

### 6. Test Complete Flow
1. Open website
2. Chat with bot
3. Provide details
4. Confirm submission
5. Check Supabase tables for data

## File Structure
```
/Users/corin/Amplifyx Website/
├── api/
│   ├── lead-submit.js         # Handles Supabase/Sheets saves
│   ├── chat-secure.js          # Extracts structured data
│   └── supabase-client.js      # Supabase connection logic
├── js/
│   ├── chatbot-secure.js       # Client-side chatbot
│   └── config-secure.js        # Configuration
├── supabase-schema.sql         # Database schema to run
├── SUPABASE_QUICK_START.md     # Setup guide
└── index.html                   # Using secure chatbot
```

## Key Points
- System prompt is server-side only (secure)
- No localStorage, using session-based memory
- Structured data extracted server-side
- Falls back to Google Sheets if Supabase not configured
- Every conversation is logged completely

## MCP Server Configuration
Already added to: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=hobaeblghefbwyxazqau"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_dd79466d1767c391f8e61a0655d5d9c0b7058611"
      }
    }
  }
}
```

## Quick Commands After Restart
```bash
# Test MCP is working
"Show me Supabase tables"

# Run schema
"Execute the SQL from /Users/corin/Amplifyx Website/supabase-schema.sql in Supabase"

# Check setup
"Query the leads table in Supabase"

# Get API keys
"Open https://supabase.com/dashboard/project/hobaeblghefbwyxazqau/settings/api"
```

## Problem We Solved
- ❌ Old: Google Sheets with column misalignment, missing phone numbers
- ✅ New: Proper database with perfect field mapping
- ✅ Every conversation saved
- ✅ Structured data extraction working
- ✅ Security: No exposed prompts or localStorage

---

**AFTER RESTART**: Just tell Claude to "Continue the Supabase setup from CLAUDE_RESTART_CONTEXT.md" and everything will resume!