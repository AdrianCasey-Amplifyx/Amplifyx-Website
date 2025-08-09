# Email Service Setup for Admin Notifications

## Overview
The system now sends rich HTML email notifications to adrian@amplifyx.com.au when high-value leads (score ≥ 70) are captured.

## Email Service Options

### Option 1: Resend (Recommended - Easiest)
1. Sign up at https://resend.com
2. Add and verify your domain (amplifyx.com.au)
3. Get your API key from the dashboard
4. Add to Vercel:
   ```bash
   vercel env add RESEND_API_KEY production
   # Paste your API key when prompted
   ```

### Option 2: SendGrid
1. Sign up at https://sendgrid.com
2. Verify your sender domain (amplifyx.com.au)
3. Create an API key with "Mail Send" permissions
4. Add to Vercel:
   ```bash
   vercel env add SENDGRID_API_KEY production
   # Paste your API key when prompted
   ```

## What the Email Includes

### Lead Information
- Name, Company, Email, Phone
- Project type, Timeline, Budget
- Lead score and qualification status
- Reference number

### Lead Temperature Indicators
- 🔥 **HOT** (85-100): Contact within 1 hour
- 🌡️ **WARM** (70-84): Contact within 4 hours
- 💫 **QUALIFIED** (50-69): Contact within 24 hours
- ❄️ **COLD** (0-49): Contact within 48 hours

### Conversation Analysis
- Summary of key discussion points
- First and last messages from prospect
- Identified interests (automation, AI, integration, etc.)
- Full conversation transcript

### Call-to-Action Buttons
- **📧 Send Email** - Pre-filled mailto link with reference number
- **📞 Call Now** - Click-to-call link (if phone provided)
- **📊 View in Supabase** - Direct link to database record

## Setup Steps

1. **Choose and configure email service** (Resend or SendGrid)

2. **Set environment variable in Vercel**:
   ```bash
   # For Resend
   vercel env add RESEND_API_KEY production
   
   # OR for SendGrid
   vercel env add SENDGRID_API_KEY production
   ```

3. **Run Supabase trigger setup**:
   - Go to Supabase SQL editor
   - Run the contents of `supabase-admin-notify.sql`
   - This creates automatic triggers for high-value leads

4. **Deploy the changes**:
   ```bash
   vercel --prod
   ```

## Testing

### Test with existing lead:
```sql
-- In Supabase SQL editor
SELECT send_admin_notification('YOUR_LEAD_ID_HERE'::uuid);
```

### View notification attempts:
```sql
SELECT * FROM admin_notification_log;
```

### Test with new lead:
Submit a test lead with high value indicators:
- Mention urgent timeline ("ASAP", "urgent")
- Include budget ("$75,000")
- Provide all contact details

## Email Delivery Checklist

- [ ] Email service API key set in Vercel
- [ ] Domain verified with email service
- [ ] SPF/DKIM records configured (for deliverability)
- [ ] Supabase trigger installed
- [ ] Test email received successfully

## Troubleshooting

### Email not sending:
1. Check Vercel logs: `vercel logs`
2. Verify API key is set: `vercel env ls production`
3. Check Supabase logs for trigger execution

### Email going to spam:
1. Verify domain authentication (SPF, DKIM)
2. Check sender reputation with email service
3. Ensure from address uses your domain

## Customization

To modify email content, edit `/api/admin-notify.js`:
- `formatAdminEmail()` - HTML template
- `generateConversationSummary()` - Summary logic
- `getLeadTemperature()` - Scoring thresholds