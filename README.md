# Amplifyx Technologies Website

Professional single-page website for Amplifyx Technologies - AI-powered product development consultancy.

## 🚀 Features

- **Modern Dark Theme** with purple gradient accents
- **Fully Responsive** - Mobile-first design
- **Fast Performance** - Optimized for speed
- **SEO Optimized** - Meta tags, sitemap, structured data
- **Smooth Animations** - Intersection Observer & CSS animations
- **No Dependencies** - Pure HTML, CSS, and vanilla JavaScript

## 📁 Project Structure

```
amplifyx-website/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styles
├── js/
│   └── main.js         # JavaScript functionality
├── assets/
│   └── images/         # Images and icons
├── CNAME               # Custom domain configuration
├── robots.txt          # SEO robot instructions
└── sitemap.xml         # XML sitemap
```

## 🌐 Deployment Options

### Option 1: GitHub Pages (Recommended - Free)

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/amplifyx-website.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to Settings > Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Save

3. **Configure Custom Domain**
   - In GoDaddy DNS settings:
     - Add A records pointing to GitHub Pages IPs:
       ```
       185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
       ```
     - Add CNAME record: www -> YOUR_USERNAME.github.io

### Option 2: Netlify (Free tier)

1. **Deploy via Drag & Drop**
   - Visit [netlify.com](https://netlify.com)
   - Drag your project folder to deploy

2. **Configure Domain**
   - Site settings > Domain management
   - Add custom domain: amplifyx.com.au
   - Follow DNS configuration instructions

### Option 3: Vercel (Free tier)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Configure Domain**
   - Visit Vercel dashboard
   - Add domain in project settings

## 🎨 Adding Images

Place images in the `/assets/images/` directory:

- **Logo**: `logo.svg` or `logo.png` (200x50px recommended)
- **Favicon**: `favicon.ico` (32x32px)
- **OG Image**: `og-image.png` (1200x630px for social media)
- **Testimonial Avatars**: `avatar-1.jpg`, `avatar-2.jpg` (200x200px)

### Image Optimization Tips

1. Use [TinyPNG](https://tinypng.com) for compression
2. Convert to WebP format for better performance
3. Use responsive images with `<picture>` element
4. Add `loading="lazy"` to images below the fold

## 🔧 Customization

### Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
    --color-primary: #7B3FF2;
    --color-accent: #E94CFF;
    /* ... */
}
```

### Content
Update text content directly in `index.html`

### Fonts
Currently using Google Fonts (Inter). To change:
1. Update link in `index.html`
2. Change `--font-primary` in CSS

## 📊 Analytics

Add Google Analytics or other tracking:
```html
<!-- Add before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🤝 Contact Form Integration

Current setup redirects to Calendly. For form handling, consider:
- **Formspree**: formspree.io (free tier available)
- **Netlify Forms**: Built-in if hosting on Netlify
- **EmailJS**: emailjs.com for client-side email

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚦 Performance Tips

1. **Enable Gzip compression** on server
2. **Set cache headers** for static assets
3. **Use CDN** for global distribution
4. **Minify CSS/JS** for production

## 📄 License

© 2024 Amplifyx Technologies. All rights reserved.

## 🆘 Support

For deployment help or customization, contact Amplifyx Technologies.