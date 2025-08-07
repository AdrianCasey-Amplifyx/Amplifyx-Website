# Deployment Guide for Amplifyx Website

## Quick Start - Deploy to Netlify (Recommended)

### Step 1: Deploy the Website (5 minutes)

1. **Go to [Netlify Drop](https://app.netlify.com/drop)**
2. **Drag and drop** your entire `Amplifyx Website` folder onto the page
3. Your site will be live immediately at a temporary URL (e.g., `amazing-site-123.netlify.app`)

### Step 2: Create a Free Netlify Account

1. Click "Sign up" on Netlify
2. Sign up with GitHub, GitLab, or Email
3. Claim your site (it will appear in your dashboard)

### Step 3: Connect Your Domain (amplifyx.com.au)

#### In Netlify:
1. Go to your site dashboard
2. Click **"Domain settings"**
3. Click **"Add custom domain"**
4. Enter `amplifyx.com.au`
5. Click **"Verify"** then **"Add domain"**

#### In GoDaddy:
1. Log in to your GoDaddy account
2. Go to **"My Products"** → Find your domain → **"DNS"**
3. Remove any existing A records and CNAME records for @ and www
4. Add these DNS records:

   **For the root domain (amplifyx.com.au):**
   - Type: A
   - Name: @
   - Value: 75.2.60.5
   - TTL: 1 hour

   **For www subdomain:**
   - Type: CNAME
   - Name: www
   - Value: [your-site-name].netlify.app
   - TTL: 1 hour

5. Save all changes

### Step 4: Enable HTTPS (Automatic)

Once DNS propagates (5-30 minutes), Netlify will automatically:
- Provision an SSL certificate
- Enable HTTPS for your domain
- Set up redirects from HTTP to HTTPS

## Alternative: GitHub Pages Deployment

### Step 1: Create GitHub Repository

```bash
# In your Amplifyx Website folder
git init
git add .
git commit -m "Initial website commit"
```

### Step 2: Create Repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name it `amplifyx-website`
3. Keep it public
4. Don't initialize with README
5. Click "Create repository"

### Step 3: Push Your Code

```bash
git remote add origin https://github.com/YOUR_USERNAME/amplifyx-website.git
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository Settings
2. Scroll to "Pages" section
3. Source: Deploy from a branch
4. Branch: main, folder: / (root)
5. Click Save

### Step 5: Configure GoDaddy DNS for GitHub Pages

Add these A records in GoDaddy DNS:
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

Add CNAME record:
- Name: www
- Value: YOUR_USERNAME.github.io

## Testing Your Site

### Local Testing
1. Open `index.html` directly in your browser
2. Or use a local server:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Node.js
   npx http-server
   ```

### Mobile Testing
- Open your deployed site on your phone
- Test the hamburger menu
- Check all sections load properly
- Verify smooth scrolling works

## Adding Real Content

### Images to Add:
1. **Company Logo**: Replace `assets/images/logo.svg` with your actual logo
2. **Favicon**: 
   - Open `favicon-generator.html` in browser
   - Download the generated favicon
   - Convert at [favicon.io](https://favicon.io)
3. **Testimonial Photos**: Add to `assets/images/testimonials/`
4. **Social Media Preview**: Add `og-image.png` (1200x630px)

### Content to Update:
1. Replace placeholder testimonials with real customer quotes
2. Update service descriptions if needed
3. Add real Calendly link (replace `https://calendly.com/amplifyx`)
4. Update footer social media links

## Performance Optimization

### Before Going Live:
1. **Compress Images**: Use [TinyPNG](https://tinypng.com)
2. **Minify CSS/JS** (optional):
   - [CSS Minifier](https://cssminifier.com)
   - [JS Minifier](https://javascript-minifier.com)
3. **Test Speed**: [PageSpeed Insights](https://pagespeed.web.dev)

## Monitoring

### Free Analytics Options:
1. **Google Analytics**:
   - Get tracking code from [analytics.google.com](https://analytics.google.com)
   - Add before `</head>` in index.html

2. **Netlify Analytics** (if using Netlify):
   - Available in site dashboard
   - Privacy-friendly, no cookies

## Support

### DNS Propagation Check:
- [whatsmydns.net](https://whatsmydns.net) - Check if your domain is pointing correctly

### Common Issues:
- **Site not loading**: Wait 30 minutes for DNS propagation
- **HTTPS not working**: Make sure DNS is fully propagated first
- **Images not showing**: Check file paths are correct (case-sensitive)

## Next Steps

1. ✅ Deploy to Netlify/GitHub Pages
2. ✅ Connect domain
3. ✅ Wait for DNS propagation
4. ✅ Test on multiple devices
5. 🎯 Add real content and images
6. 🚀 Share with the world!

---

**Estimated Time**: 15-30 minutes (including DNS propagation wait time)

**Cost**: $0 (using free tier of Netlify or GitHub Pages)