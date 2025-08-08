# Security Migration Guide

## Current Security Issues & Solutions

### 🔴 Critical Issues Fixed:

1. **System Prompt Exposure** → Moved to server-side (`api/system-prompt.js`)
2. **LocalStorage Privacy** → Replaced with session-based memory
3. **Scoring Logic Exposure** → Moved to server-side calculation
4. **CORS Too Permissive** → Restricted to specific domains
5. **No Session Isolation** → Added unique session IDs

## Migration Steps

### Phase 1: Immediate Security Fixes (Do Now)

1. **Deploy Secure API Endpoint**
   ```bash
   # In Vercel dashboard, set environment variable:
   OPENAI_API_KEY=your-key-here
   
   # Deploy the new secure endpoint
   vercel --prod
   ```

2. **Update Website to Use Secure Chatbot**
   ```html
   <!-- In index.html, replace: -->
   <script src="js/chatbot-ai.js" defer></script>
   
   <!-- With: -->
   <script src="js/config-secure.js"></script>
   <script src="js/chatbot-secure.js" defer></script>
   ```

3. **Remove Sensitive Files from Git**
   ```bash
   # Remove old insecure files
   git rm js/chatbot-ai.js
   git rm js/config.js
   git rm js/config-public.js
   
   # Add to .gitignore
   echo "js/chatbot-ai.js" >> .gitignore
   echo "js/config.js" >> .gitignore
   
   git commit -m "Remove exposed system prompt and scoring logic"
   git push
   ```

### Phase 2: Supabase Migration (Next Week)

1. **Set Up Supabase**
   - Follow `SUPABASE_SETUP.md`
   - Run SQL schema scripts
   - Configure environment variables

2. **Update Vercel Environment**
   ```
   SUPABASE_URL=your-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

3. **Deploy Supabase Integration**
   - Update API to save to Supabase
   - Test with a few leads
   - Monitor for issues

4. **Migrate Historical Data**
   - Export Google Sheets as CSV
   - Import to Supabase via dashboard
   - Verify data integrity

### Phase 3: Email Automation (Week 3)

1. **Choose Email Provider**
   - **Resend** (recommended): Simple, developer-friendly
   - **SendGrid**: More features, higher complexity
   - **Supabase Functions**: Built-in, no extra service

2. **Set Up Email Templates**
   - Confirmation email
   - Hot lead notification
   - Weekly summary

3. **Configure Triggers**
   - On lead creation → Send confirmation
   - On hot lead (score > 70) → Notify admin
   - Daily → Process email queue

### Phase 4: CRM Dashboard (Week 4)

1. **Option A: Use Supabase Dashboard**
   - Built-in, no coding required
   - Good for basic needs

2. **Option B: Build Custom Dashboard**
   ```bash
   # Create Next.js admin panel
   npx create-next-app@latest amplifyx-crm
   cd amplifyx-crm
   npm install @supabase/supabase-js
   ```

3. **Features to Include**
   - Lead list with filters
   - Conversation viewer
   - Lead scoring details
   - Export functionality
   - Email tracking

## Testing Checklist

### Security Tests
- [ ] System prompt not visible in browser DevTools
- [ ] No localStorage with sensitive data
- [ ] Session isolation working
- [ ] CORS properly restricted
- [ ] API key not exposed

### Functionality Tests
- [ ] Chatbot responds correctly
- [ ] Confirmation flow works
- [ ] Data saves to database
- [ ] Email confirmations sent
- [ ] Session timeout works

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Chatbot response time < 2 seconds
- [ ] No memory leaks
- [ ] Works on mobile

## Rollback Plan

If issues arise:

1. **Quick Rollback**
   ```bash
   # Revert to previous version
   git revert HEAD
   git push
   
   # In Vercel, rollback to previous deployment
   ```

2. **Keep Backups**
   - Export Google Sheets daily for 30 days
   - Keep old chatbot code in `legacy/` folder
   - Document all environment variables

## Benefits After Migration

### Security
- ✅ No exposed business logic
- ✅ Session isolation
- ✅ Server-side validation
- ✅ Encrypted data storage

### Privacy
- ✅ No shared localStorage
- ✅ GDPR compliant
- ✅ Data retention policies
- ✅ User data isolation

### Features
- ✅ Real-time CRM
- ✅ Email automation
- ✅ Analytics dashboard
- ✅ A/B testing ready

### Scalability
- ✅ Handle 1000s of leads
- ✅ Fast queries
- ✅ Automatic backups
- ✅ API rate limiting

## Cost Comparison

### Current (Google Sheets)
- Google Sheets: Free (with limits)
- Vercel: Free tier
- **Total: $0/month**

### New (Supabase)
- Supabase: Free tier (500MB database)
- Vercel: Free tier
- Email service: ~$20/month (optional)
- **Total: $0-20/month**

## Support

If you need help:
1. Check Supabase docs: https://supabase.com/docs
2. Check Vercel docs: https://vercel.com/docs
3. Email me for consultation on the migration

## Timeline

- **Week 1**: Security fixes (immediate)
- **Week 2**: Supabase setup
- **Week 3**: Email automation
- **Week 4**: CRM dashboard
- **Week 5**: Testing & optimization

Total migration time: ~1 month working part-time