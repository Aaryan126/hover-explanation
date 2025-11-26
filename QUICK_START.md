# ⚡ Quick Start Guide - Hov3x Deployment

**Time to Deploy:** ~30 minutes

---

## 🎯 Overview

You'll deploy a **secure backend proxy** (Cloudflare Worker) that hides your Gemini API key, then submit your extension to Chrome Web Store.

```
User → Chrome Extension → Your Cloudflare Worker → Google Gemini API
                                    ↑
                            (API key hidden here)
```

---

## 📝 Checklist

### Before You Start
- [ ] Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Free Cloudflare account
- [ ] $5 for Chrome Web Store developer registration
- [ ] Your email address for contact info

### Deployment Steps
- [ ] **Step 1:** Deploy Cloudflare Worker (15 min)
- [ ] **Step 2:** Update extension with worker URL (5 min)
- [ ] **Step 3:** Test locally (5 min)
- [ ] **Step 4:** Update contact info in docs (5 min)
- [ ] **Step 5:** Package and submit to Chrome Web Store (10 min)

---

## 🚀 Speed Run Instructions

### 1️⃣ Deploy Cloudflare Worker

```bash
# 1. Go to https://dash.cloudflare.com/
# 2. Sign up (free)
# 3. Workers & Pages → Create Worker
# 4. Name it: hov3x-api-proxy
# 5. Deploy, then Edit Code
# 6. Copy backend/cloudflare-worker.js → paste into editor
# 7. Save and Deploy
# 8. Settings → Variables → Add Variable:
#    - Name: GEMINI_API_KEY
#    - Value: [Your Gemini API key]
#    - ✓ Encrypt
# 9. Save and Deploy
# 10. Copy worker URL (e.g., https://hov3x-api-proxy.xyz.workers.dev)
```

### 2️⃣ Update Extension

```javascript
// Edit background-proxy.js line 7:
const PROXY_API_URL = "https://hov3x-api-proxy.xyz.workers.dev";
// ↑ Replace with YOUR worker URL
```

### 3️⃣ Test Locally

```bash
# 1. Chrome → chrome://extensions/
# 2. Enable Developer mode
# 3. Load unpacked → select hover-explain folder
# 4. Visit any website, select text
# 5. Verify tooltip appears with explanation ✅
```

### 4️⃣ Update Contact Info

**Find and replace in these files:**
- `PRIVACY_POLICY.md`
- `TERMS_OF_SERVICE.md`

**Replace:**
- `[Your Email Address]` → your@email.com
- `[Your Name/Company Name]` → Your Name
- `[Your Jurisdiction]` → California, United States (or your location)
- `[Your GitHub Repository URL]` → https://github.com/... (or remove)

### 5️⃣ Package Extension

**Files to include in ZIP:**
```
hov3x-package/
├── manifest.json
├── background-proxy.js  ← (NOT background.js!)
├── content.js
├── tooltip.css
├── tooltip.js
├── popup/
│   ├── popup.html
│   └── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── PRIVACY_POLICY.md
└── TERMS_OF_SERVICE.md
```

**DO NOT include:**
- ❌ `config.js`
- ❌ `background.js`
- ❌ `/backend` folder
- ❌ `.git` folder
- ❌ Test files

**Create ZIP:**
```bash
# Windows: Right-click folder → Send to → Compressed folder
# Mac/Linux: zip -r hov3x-v1.0.0.zip hov3x-package/
```

### 6️⃣ Submit to Chrome Web Store

```bash
# 1. Go to https://chrome.google.com/webstore/devconsole
# 2. Pay $5 registration (one-time)
# 3. New Item → Upload ZIP
# 4. Fill form:
#    - Category: Productivity
#    - Privacy Policy: Upload PRIVACY_POLICY.md to GitHub/web
#    - Screenshots: Take 1-5 screenshots of extension in action
# 5. Submit for Review
# 6. Wait 1-3 days for approval ✅
```

---

## 📊 Quick Test Commands

### Test Worker Directly
```bash
curl -X POST https://YOUR-WORKER-URL.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"term":"API"}'
```

**Expected Response:**
```json
{"success":true,"explanation":"An API is...","cached":false}
```

### Test Rate Limiting
```bash
# Send 15 requests rapidly - should get rate limited after 10
for i in {1..15}; do
  curl -X POST https://YOUR-WORKER-URL.workers.dev \
    -H "Content-Type: application/json" \
    -d "{\"term\":\"test$i\"}"
  echo ""
done
```

---

## 🐛 Common Issues

### "Failed to fetch explanation"
- ✅ Check worker URL in `background-proxy.js` line 7
- ✅ Test worker with curl command above
- ✅ Check Cloudflare worker logs for errors

### "GEMINI_API_KEY is not defined"
- ✅ Go to Cloudflare → Worker → Settings → Variables
- ✅ Ensure `GEMINI_API_KEY` is added and encrypted
- ✅ Save and Deploy again

### Extension won't load
- ✅ Check `chrome://extensions/` for error messages
- ✅ Verify `manifest.json` has correct `service_worker`
- ✅ Ensure using `background-proxy.js` NOT `background.js`

### Chrome Web Store rejection
- ✅ Privacy policy must be publicly accessible URL
- ✅ Justify all permissions clearly
- ✅ Include 1-5 high-quality screenshots

---

## 💰 Expected Costs

**With 1,000 users:**
- Cloudflare: **FREE** (within 100K requests/day limit)
- Gemini API: **$0-5/month** (Flash model is very cheap)
- **Total: ~$0-5/month**

**With 10,000 users:**
- Cloudflare: **FREE**
- Gemini API: **$5-20/month**
- **Total: ~$5-20/month**

---

## 📞 Need Help?

**Full detailed guide:** See `DEPLOYMENT_GUIDE.md`

**Security audit:** See `SECURITY_AUDIT.md` (if created)

**Privacy info:** See `PRIVACY_POLICY.md`

---

## ✅ Success Criteria

You're done when:

- ✅ Cloudflare Worker deployed and responding
- ✅ Extension loads in Chrome without errors
- ✅ Selecting text shows AI explanation
- ✅ Cache works (second selection is instant)
- ✅ Rate limiting triggers after 10 requests/min
- ✅ Extension submitted to Chrome Web Store
- ✅ Privacy policy publicly accessible

---

**Estimated Time:** 30 minutes
**Difficulty:** Medium
**Cost:** $5 one-time + $0-5/month

**Good luck! 🚀**
