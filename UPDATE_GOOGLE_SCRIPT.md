# URGENT: Update Google Apps Script

## The Issue
Your Google Sheet is receiving data with misaligned columns because the script doesn't include the phone field. The phone number is appearing in the Company column, and everything after is shifted left by one column.

## How to Fix

1. **Open your Google Sheet:**
   https://docs.google.com/spreadsheets/d/12TaySxxboYefkcMFQmYxhgWUx1dyIQrc-QL13RDK2jQ/edit

2. **Open Apps Script:**
   - Click **Extensions** → **Apps Script**

3. **Replace the ENTIRE script with the code from:**
   `google-apps-script-updated.js`
   
   This updated script includes the phone field in the correct position.

4. **Save and Deploy:**
   - Click the **Save** button (disk icon)
   - Click **Deploy** → **Manage deployments**
   - Click the pencil icon to edit the deployment
   - In "Version" dropdown, select **"New version"**
   - Add description: "Added phone field to fix column alignment"
   - Click **Deploy**

5. **Test:**
   - Run the `testWebhook()` function in the Apps Script editor
   - Check that data appears in the correct columns:
     - Column C: Name
     - Column D: Email
     - Column E: Phone (NEW)
     - Column F: Company
     - Column G: Project Type
     - etc.

## What Changed
The updated script now includes:
```javascript
const row = [
  new Date().toLocaleString(),  // A: Timestamp
  data.referenceNumber || '',   // B: Reference
  data.name || '',              // C: Name
  data.email || '',             // D: Email
  data.phone || '',             // E: Phone (NEW - THIS WAS MISSING!)
  data.company || '',           // F: Company
  // ... rest of fields
];
```

## Verification
After updating, any new submissions should have:
- Phone numbers in column E
- Company names in column F
- All other data properly aligned

The existing misaligned rows can be manually fixed if needed.