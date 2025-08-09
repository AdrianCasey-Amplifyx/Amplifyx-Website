# 🚀 Supabase Quick Start Guide

## What You'll Get
✅ Every conversation saved completely  
✅ Perfect structured data extraction  
✅ Automatic email confirmations  
✅ Reference numbers for each lead  
✅ Professional CRM dashboard  

## Step 1: Create Supabase Account (5 mins)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new project:
   - **Project name**: `amplifyx-crm`
   - **Database Password**: (save this securely!)
   - **Region**: Sydney (ap-southeast-2)
   - **Plan**: Free tier is fine

## Step 2: Run Database Setup (2 mins)

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy ALL contents from `supabase-schema.sql` file
4. Paste into the SQL editor
5. Click **Run** (or press Cmd+Enter)
6. You should see "Success. No rows returned"

## Step 3: Get Your API Keys (1 min)

1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the left menu
3. Copy these values:
   - **Project URL**: `https://YOUR_PROJECT.supabase.co`
   - **Anon Key**: `eyJhbGci...` (public key - safe to expose)
   - **Service Key**: `eyJhbGci...` (secret - keep secure!)

## Step 4: Add Keys to Vercel (2 mins)

1. Go to https://vercel.com/dashboard
2. Select your `amplifyx-chatbot` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
SUPABASE_URL = your-project-url-here
SUPABASE_ANON_KEY = your-anon-key-here  
SUPABASE_SERVICE_KEY = your-service-key-here
```

5. Click **Save** for each

## Step 5: Redeploy to Activate (1 min)

Run in terminal:
```bash
vercel --prod
```

## Step 6: Test It!

1. Open your website
2. Start a chat with the bot
3. Provide your details
4. Confirm submission
5. You'll get a reference number like `AMP-LN3K4M8`

## Step 7: View Your Leads

### Option A: Supabase Dashboard (Easy)
1. In Supabase, click **Table Editor**
2. Select `leads` table
3. You'll see all your leads with full details!

### Option B: SQL Query (Advanced)
In SQL Editor, run:
```sql
-- View recent leads with scores
SELECT 
  reference_number,
  name,
  email,
  company,
  project_type,
  score,
  created_at
FROM leads
ORDER BY created_at DESC;

-- View all conversations
SELECT 
  l.reference_number,
  c.role,
  c.content,
  c.created_at
FROM conversations c
JOIN leads l ON c.lead_id = l.id
ORDER BY c.created_at;
```

## What's Happening Behind the Scenes

When someone uses your chatbot:

1. **Chat begins** → Session created with unique ID
2. **AI responds** → Extracts data into structured format
3. **User confirms** → Data sent to Supabase:
   - Lead record created with all fields
   - Full conversation saved
   - Email queued for sending
   - Reference number generated
4. **You get**:
   - Complete lead info in database
   - Full chat transcript
   - Automatic scoring
   - Ready for CRM features

## Verify Everything Works

Check these in Supabase Table Editor:
- [ ] `sessions` table has entries
- [ ] `leads` table shows lead data
- [ ] `conversations` table has chat messages
- [ ] `email_queue` table has pending emails

## Next Steps

### Enable Email Sending (Optional)
1. Sign up at https://resend.com
2. Add domain verification
3. Get API key
4. Add to Vercel: `RESEND_API_KEY`
5. We'll create email sender function

### Build CRM Dashboard (Optional)
- Use Supabase's built-in dashboard OR
- Build custom with Next.js
- Real-time updates
- Export capabilities

## Troubleshooting

**No data appearing?**
- Check Vercel env variables are set
- Redeploy after adding variables
- Check browser console for errors

**Can't create tables?**
- Make sure you're in SQL Editor
- Run the entire script at once
- Check for error messages

**Reference number not showing?**
- Ensure structured data is extracted
- Check network tab for API responses
- Verify Supabase credentials

## Cost
- **Supabase Free Tier**: 
  - 500MB database
  - 2GB storage
  - 50MB file uploads
  - Enough for ~100,000 leads
- **When to upgrade**: 
  - Only if you exceed 500MB
  - That's roughly 100,000+ detailed leads

## Support
- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Your implementation is ready to scale!

---

**You're all set!** Your chatbot now saves to a professional database with perfect data structure. Every conversation is logged, every field is mapped correctly, and you have a foundation for a complete CRM system. 🎉