# 🚀 Hov3x Deployment Guide

Complete step-by-step guide to deploy Hov3x Chrome Extension with secure API key protection.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Deploy Cloudflare Worker (Backend)](#step-1-deploy-cloudflare-worker-backend)
3. [Step 2: Configure Extension](#step-2-configure-extension)
4. [Step 3: Test Locally](#step-3-test-locally)
5. [Step 4: Prepare for Chrome Web Store](#step-4-prepare-for-chrome-web-store)
6. [Step 5: Submit to Chrome Web Store](#step-5-submit-to-chrome-web-store)
7. [Step 6: Post-Deployment](#step-6-post-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Cost Analysis](#cost-analysis)

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Gemini API Key** - Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)
- ✅ **Cloudflare Account** - Create free account at [Cloudflare](https://dash.cloudflare.com/)
- ✅ **Chrome Web Store Developer Account** - $5 one-time fee at [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- ✅ **Extension Icons** - 16x16, 48x48, 128x128 PNG files (already in `/icons` folder)
- ✅ **Email Address** - For privacy policy and support
- ✅ **GitHub Account** (Optional) - For issue tracking and feedback

---

## Step 1: Deploy Cloudflare Worker (Backend)

This step deploys a secure proxy server that hides your Gemini API key from users.

### 1.1 Create Cloudflare Account

1. Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Click **Sign Up** (it's FREE)
3. Verify your email

### 1.2 Create Worker

1. In Cloudflare Dashboard, navigate to **Workers & Pages**
2. Click **Create Application**
3. Click **Create Worker**
4. Name it something like: `hov3x-api-proxy`
5. Click **Deploy** (we'll edit the code next)

### 1.3 Edit Worker Code

1. After deployment, click **Edit Code**
2. **Delete** all the placeholder code
3. **Copy** the entire contents of `backend/cloudflare-worker.js`
4. **Paste** it into the Cloudflare editor
5. Click **Save and Deploy**

### 1.4 Add API Key as Secret

**IMPORTANT:** Never hardcode your API key in the worker!

1. Go to **Settings** tab in your Worker
2. Click **Variables**
3. Under **Environment Variables**, click **Add Variable**
4. Add:
   - **Variable name:** `GEMINI_API_KEY`
   - **Value:** Your actual Gemini API key (paste it here)
   - **Type:** Check ✅ **Encrypt** (this makes it a secret)
5. Click **Save and Deploy**

### 1.5 Copy Worker URL

1. Go to the **Overview** tab
2. You'll see a URL like: `https://hov3x-api-proxy.your-subdomain.workers.dev`
3. **Copy this URL** - you'll need it for Step 2

### 1.6 Test Worker (Optional)

Test using this curl command (replace URL with yours):

```bash
curl -X POST https://hov3x-api-proxy.your-subdomain.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"term":"API"}'
```

Expected response:
```json
{
  "success": true,
  "explanation": "An API (Application Programming Interface) is...",
  "cached": false
}
```

If you get this, your worker is working! ✅

---

## Step 2: Configure Extension

Now we'll update the extension to use your deployed worker.

### 2.1 Update Proxy URL

1. Open `background-proxy.js` in your text editor
2. Find line 7:
   ```javascript
   const PROXY_API_URL = "https://your-worker-name.your-subdomain.workers.dev/explain";
   ```
3. Replace with YOUR worker URL from Step 1.5:
   ```javascript
   const PROXY_API_URL = "https://hov3x-api-proxy.your-subdomain.workers.dev";
   ```

   **Note:** Remove the `/explain` at the end - just use the base URL

4. Save the file

### 2.2 Update manifest.json

The manifest should already be configured, but verify:

1. Open `manifest.json`
2. Verify `service_worker` points to `background-proxy.js`:
   ```json
   "background": {
     "service_worker": "background-proxy.js"
   }
   ```
3. Verify host permissions include Cloudflare Workers:
   ```json
   "host_permissions": [
     "https://*.workers.dev/*"
   ]
   ```

### 2.3 Update Contact Information

Update these files with your actual information:

**In `PRIVACY_POLICY.md`:**
- Replace `[Your Name/Company Name]` with your name
- Replace `[Your Email Address]` with your email
- Replace `[Your GitHub Repository URL]` with your repo (or remove if none)
- Replace `[Your Extension URL]` with Chrome Web Store URL (after publishing)

**In `TERMS_OF_SERVICE.md`:**
- Replace `[Your Email Address]` with your email
- Replace `[Your GitHub Repository URL]` with your repo
- Replace `[Your Extension URL]` with Chrome Web Store URL (after publishing)
- Replace `[Your Jurisdiction]` with your location (e.g., "California, United States")

---

## Step 3: Test Locally

Before publishing, test everything works locally.

### 3.1 Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select your `hover-explain` folder
6. Extension should load successfully ✅

### 3.2 Test Functionality

1. Go to any website (try Wikipedia or a tech blog)
2. Select some technical text (e.g., "JavaScript", "API", "HTTP")
3. Wait for tooltip to appear
4. Verify explanation loads correctly

### 3.3 Test Cache

1. Select the same term again
2. Should load instantly from cache
3. Open extension popup → verify cache count increases

### 3.4 Test Rate Limiting

1. Rapidly select many different terms
2. After 10 requests in one minute, you should see:
   ```
   Rate limit exceeded. Please wait 60 seconds.
   ```
3. This confirms rate limiting is working ✅

### 3.5 Check Console for Errors

1. Go to `chrome://extensions/`
2. Click **Details** on Hov3x
3. Click **Inspect views: service worker**
4. Check Console for errors
5. Should see logs like:
   ```
   [Hov3x Background] Service worker initialized (Proxy Mode)
   [Hov3x Background] Calling proxy API for: "API"
   ```

---

## Step 4: Prepare for Chrome Web Store

### 4.1 Create Store Assets

You need these images for the Chrome Web Store listing:

**Required:**
- ✅ Icon (128x128) - Already in `/icons/icon128.png`
- ✅ Small promo tile (440x280) - Create this
- ✅ Screenshots (1280x800 or 640x400) - Take 1-5 screenshots

**Recommended Screenshots:**
1. Extension in action (tooltip showing)
2. Popup interface
3. Works on different websites
4. Theme switcher

### 4.2 Create Screenshot Tutorial

Take screenshots showing:
1. Selecting text on a webpage
2. Tooltip appearing with explanation
3. Extension popup with cache stats
4. Light and dark themes

Tools:
- Windows: `Win + Shift + S`
- Mac: `Cmd + Shift + 4`

### 4.3 Write Store Description

**Short Description (132 chars max):**
```
AI-powered explanations for technical terms. Select any text to get instant, simple explanations powered by Google Gemini.
```

**Detailed Description:**
```
Hov3x - Instant AI Explanations for Technical Terms

Ever come across technical jargon you don't understand? Hov3x makes learning effortless.

🚀 HOW IT WORKS
1. Select any technical term on any webpage
2. Get an instant, AI-generated explanation in a beautiful tooltip
3. Explanations are cached locally for faster access

✨ FEATURES
• Instant explanations powered by Google Gemini AI
• Works on ANY website
• Smart caching - see terms you've looked up before instantly
• Beautiful dark and light themes
• Privacy-focused - minimal data collection
• Completely free to use

🎯 PERFECT FOR
• Students learning new concepts
• Developers reading documentation
• Anyone exploring technical content
• Researchers and professionals

🔒 PRIVACY & SECURITY
• Selected text is only used to generate explanations
• Results cached locally in your browser
• No browsing history collected
• Open source - audit the code yourself

⚡ NO SETUP REQUIRED
Install and start using immediately - no API keys, no accounts, just instant explanations.

Note: Selected text is processed by Google's Gemini AI. Avoid selecting sensitive information.
```

### 4.4 Prepare Package

1. **Remove development files** from the package:
   ```bash
   # Create a clean copy
   mkdir hov3x-package
   ```

2. **Copy only necessary files:**
   - `manifest.json`
   - `background-proxy.js` (NOT background.js)
   - `content.js`
   - `tooltip.css`
   - `tooltip.js`
   - `/popup` folder (all files)
   - `/icons` folder (all icons)
   - `PRIVACY_POLICY.md`
   - `TERMS_OF_SERVICE.md`

3. **Do NOT include:**
   - ❌ `config.js` (contains API key for local dev)
   - ❌ `background.js` (old version)
   - ❌ `config.example.js`
   - ❌ `/backend` folder
   - ❌ `.git` folder
   - ❌ `.gitignore`
   - ❌ Test HTML files
   - ❌ Markdown documentation files (except privacy/terms)
   - ❌ `CLAUDE.md`

4. **Create ZIP file:**
   ```bash
   # In the hov3x-package folder
   zip -r hov3x-v1.0.0.zip .
   ```

   Or on Windows: Right-click folder → Send to → Compressed (zipped) folder

---

## Step 5: Submit to Chrome Web Store

### 5.1 Create Developer Account

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay **$5 one-time registration fee**
3. Fill in developer information

### 5.2 Submit Extension

1. Click **New Item**
2. Upload your ZIP file
3. Fill in the form:

**Category:** Productivity

**Language:** English

**Privacy Policy:** Upload `PRIVACY_POLICY.md` to a public URL:
   - Option A: Create GitHub Gist
   - Option B: Host on your website
   - Option C: Use GitHub repo (e.g., `https://github.com/yourusername/hov3x/blob/main/PRIVACY_POLICY.md`)

**Permissions Justification:**
```
- storage: Required to cache explanations locally for faster access
- activeTab: Required to detect text selection on webpages
- https://*.workers.dev/*: Required to communicate with our secure API proxy
```

**Single Purpose Description:**
```
Hov3x provides AI-powered explanations for technical terms when users select text on webpages.
```

**Screenshots:** Upload your 1-5 screenshots

**Promotional Images:** Upload small promo tile (440x280)

### 5.3 Complete Questionnaire

Chrome will ask questions about:
- Data collection (refer to Privacy Policy)
- Remote code hosting (Answer: No)
- Security practices (Answer: Yes, we use HTTPS, etc.)

Be honest and thorough!

### 5.4 Submit for Review

1. Review all information
2. Click **Submit for Review**
3. Review typically takes **1-3 business days**

---

## Step 6: Post-Deployment

### 6.1 Monitor Usage

**Cloudflare Worker Analytics:**
1. Go to your Worker dashboard
2. View request counts, errors, latency

**Important Metrics:**
- Requests per day
- Error rate
- Latency

### 6.2 Monitor Costs

**Gemini API:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Billing**
3. Set up budget alerts (recommended: $10/month)

**Cloudflare:**
- Free tier: 100,000 requests/day
- After that: $0.50 per million requests

### 6.3 Set Up Alerts

**Budget Alert (Recommended):**
1. Google Cloud Console → Billing → Budgets & alerts
2. Set budget: $20/month (adjust as needed)
3. Alert threshold: 50%, 90%, 100%

### 6.4 Monitor Reviews

Check Chrome Web Store reviews regularly:
- Respond to issues
- Fix bugs promptly
- Update extension as needed

### 6.5 Update Privacy Policy URLs

After publishing:
1. Get your Chrome Web Store URL
2. Update `PRIVACY_POLICY.md` with the extension URL
3. Update `TERMS_OF_SERVICE.md` with the extension URL
4. Re-upload to GitHub/hosting

---

## Troubleshooting

### Issue: "Failed to fetch explanation"

**Possible Causes:**
1. Worker URL not updated in `background-proxy.js`
2. Worker not deployed correctly
3. API key not set in Cloudflare

**Solution:**
- Check browser console (F12)
- Verify worker URL is correct
- Test worker directly with curl
- Check Cloudflare worker logs

### Issue: "Rate limit exceeded"

**Expected Behavior:**
- This is intentional to prevent abuse
- Wait 60 seconds and try again

**If happening too frequently:**
- Increase limits in `cloudflare-worker.js`:
  ```javascript
  MAX_REQUESTS_PER_MINUTE: 20,  // Increase from 10
  MAX_REQUESTS_PER_HOUR: 200,   // Increase from 100
  ```

### Issue: Extension not loading

**Solutions:**
1. Check `chrome://extensions/` for errors
2. Verify `manifest.json` syntax is valid
3. Ensure all files are in correct locations
4. Try reloading extension

### Issue: API costs too high

**Solutions:**
1. Check Gemini API usage in Google Cloud Console
2. Reduce rate limits to restrict heavy users
3. Increase cache expiry to 30 days
4. Consider switching to a cheaper AI model

### Issue: Chrome Web Store rejection

**Common Reasons:**
1. Privacy policy not accessible
2. Permissions not justified
3. Screenshots missing or poor quality
4. Description violates policies

**Solution:**
- Read rejection email carefully
- Fix issues mentioned
- Resubmit

---

## Cost Analysis

### Free Tier (Expected for small user base)

**Cloudflare Worker:**
- ✅ FREE up to 100,000 requests/day
- That's **3 million requests/month** for FREE

**Gemini API:**
- ✅ FREE tier includes generous limits
- Check current limits: [Google AI Pricing](https://ai.google.dev/pricing)

**Chrome Web Store:**
- ✅ $5 one-time fee (already paid)

### Estimated Costs (1,000 active users)

**Assumptions:**
- 1,000 users
- Each user makes 10 requests/day
- 50% cached (hit rate)
- = 5,000 API calls/day = 150,000/month

**Gemini API:**
- Flash model: Very cheap or free
- Estimated: **$0 - $5/month**

**Cloudflare:**
- Well within free tier
- Estimated: **$0/month**

**Total: $0 - $5/month** ✅

### Estimated Costs (10,000 users)

- 10,000 users × 10 requests/day × 50% uncached
- = 50,000 API calls/day = 1.5M/month

**Gemini API:**
- Estimated: **$5 - $20/month**

**Cloudflare:**
- Still within free tier
- Estimated: **$0/month**

**Total: $5 - $20/month**

### Cost Optimization Tips

1. **Increase Cache Duration:**
   ```javascript
   const CACHE_EXPIRY_DAYS = 30; // Instead of 7
   ```

2. **Lower Rate Limits:**
   ```javascript
   MAX_REQUESTS_PER_HOUR: 50, // Instead of 100
   ```

3. **Implement Server-Side Caching:**
   - Use Cloudflare KV to cache at proxy level
   - Reduces API calls dramatically

4. **Switch to Cheaper Model (if needed):**
   - Gemini Flash is already the cheapest
   - Consider GPT-3.5 Turbo or similar

---

## Next Steps

✅ **You're ready to deploy!**

1. Deploy Cloudflare Worker (Step 1)
2. Configure extension (Step 2)
3. Test locally (Step 3)
4. Submit to Chrome Web Store (Steps 4-5)
5. Monitor usage (Step 6)

---

## Support

If you encounter issues:

1. Check Cloudflare Worker logs
2. Check browser console (F12)
3. Review this guide
4. Open GitHub issue (if applicable)

---

## Security Checklist

Before deploying, verify:

- ✅ API key stored as Cloudflare Worker secret (NOT in code)
- ✅ Using `background-proxy.js` (NOT `background.js`)
- ✅ `config.js` NOT included in package
- ✅ Content Security Policy added to manifest
- ✅ Rate limiting enabled
- ✅ HTTPS used for all API calls
- ✅ Privacy policy publicly accessible
- ✅ Terms of service included

---

**Good luck with your deployment! 🚀**
