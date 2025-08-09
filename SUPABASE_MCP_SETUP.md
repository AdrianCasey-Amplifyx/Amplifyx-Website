# 🔌 Supabase MCP Server Setup for Claude

## Quick Overview
The MCP (Model Context Protocol) server lets Claude directly interact with your Supabase database - creating tables, querying data, and managing your database without you having to leave the chat!

## Step 1: Create Your Supabase Project

1. Go to https://supabase.com
2. Sign up / Login
3. Click **New Project**
4. Fill in:
   - **Name**: `amplifyx-crm`
   - **Database Password**: (save this!)
   - **Region**: Sydney (ap-southeast-2)
   - **Plan**: Free

5. Once created, you'll see your project dashboard

## Step 2: Get Your Project Reference

1. In your Supabase dashboard, look at the URL
2. It will be: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
3. Copy the part after `/project/` - that's your project reference
   - Example: `xyzabc123def`

## Step 3: Create Personal Access Token

1. Click your profile icon (top right)
2. Go to **Account Settings**
3. Select **Access Tokens** tab
4. Click **Generate New Token**
5. Name it: `Claude MCP Server`
6. Click **Generate Token**
7. **COPY IT NOW** - you won't see it again!

## Step 4: Update Claude Configuration

I'll update your Claude config to add the Supabase MCP server. You'll need to provide:
- Your project reference (from Step 2)
- Your personal access token (from Step 3)

The configuration will look like this:
```json
{
  "mcpServers": {
    "Zapier MCP": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://actions.zapier.com/mcp/sk-ak-c9PtBhE6v00qyrmatXNwK6iqnB/sse"
      ]
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=YOUR_PROJECT_REF_HERE"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

## Step 5: What You Can Do with MCP

Once connected, you can ask Claude to:
- **Create tables**: "Create the leads table in Supabase"
- **Query data**: "Show me all leads from today"
- **Update schemas**: "Add a notes field to the leads table"
- **Run SQL**: "Run this SQL query in Supabase"
- **Check status**: "Show me the database statistics"

## Security Notes

- We're using `--project-ref` to limit access to just your project
- We can add `--read-only` if you only want Claude to read data
- The token is stored locally on your machine only

## Ready?

Once you have:
1. ✅ Project reference (like `xyzabc123def`)
2. ✅ Personal access token (like `sbp_abc123...`)

Tell me and I'll update your Claude configuration!

## Alternative: Manual Setup

If you prefer to do it manually:

1. Open this file:
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. Add the Supabase server configuration (shown above)

3. Restart Claude desktop app

4. You should see "Supabase" in the MCP servers list!

## Testing the Connection

Once configured, try asking:
- "Can you connect to my Supabase database?"
- "Show me the tables in Supabase"
- "Create the tables from supabase-schema.sql"

The MCP server will handle all the database operations directly!