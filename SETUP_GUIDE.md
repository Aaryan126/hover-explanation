# Hov3x - Quick Setup Guide

Follow these steps to get Hov3x running in under 5 minutes.

---

## Step-by-Step Setup

### 1️⃣ Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key (starts with `AIzaSy...`)

---

### 2️⃣ Configure the Extension

1. Open `config.js` in your code editor
2. Replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
const CONFIG = {
  GEMINI_API_KEY: "AIzaSyC_your_actual_key_here"  // Paste your key here
};
```

3. **Save the file**

✅ **Security Check**: Verify `config.js` is in `.gitignore` (it already is!)

---

### 3️⃣ Create Extension Icons (Optional for Testing)

**Option A: Quick Test (Skip Icons)**
- The extension will work without icons
- Chrome will show a default placeholder icon

**Option B: Create Simple Icons**
1. Create an `icons` folder (already exists)
2. Add 3 PNG files: `icon16.png`, `icon48.png`, `icon128.png`
3. Use any image - size doesn't matter for testing
4. See `icons/ICONS_README.txt` for details

---

### 4️⃣ Load Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle **"Developer mode"** (top-right corner)
4. Click **"Load unpacked"**
5. Select the `hover-explain` folder
6. ✅ Extension should appear in your list

---

### 5️⃣ Test It!

1. Open any webpage (try [Wikipedia](https://en.wikipedia.org/wiki/Artificial_intelligence))
2. Hover over a technical word like "algorithm", "neural", "latent", etc.
3. Wait 200ms (tooltip appears with "Loading...")
4. After 1-2 seconds, you'll see the AI explanation!
5. Hover again - instant result (cached)

---

## Troubleshooting

### "API key not configured" error
- **Fix**: Make sure you saved `config.js` with your real API key
- Reload the extension: Go to `chrome://extensions/` and click the refresh icon

### Tooltip doesn't appear
- **Check**: Are you hovering over text in `<p>`, `<span>`, `<li>`, or `<code>` tags?
- **Check**: Is the word at least 3 characters long?
- **Check**: Open DevTools Console (F12) - look for `[Hov3x]` logs

### Extension won't load
- **Check**: Did you select the `hover-explain` folder (not a subfolder)?
- **Check**: Is Developer mode enabled?
- **Check**: Look for errors in red at `chrome://extensions/`

---

## Verify It's Working

Open Chrome DevTools Console (F12) and look for:

```
[Hov3x Content] Content script loaded
[Hov3x Background] Service worker initialized
[Hov3x Background] API key loaded from config.js
```

If you see these messages, you're all set! 🎉

---

## Next Steps

- **View cache stats**: Click the extension icon in toolbar
- **Clear cache**: Use the popup to clear cached explanations
- **Customize**: Edit `tooltip.css` to change colors/style
- **Configure**: Adjust hover delay in `content.js`

---

## Git Safety Reminder

Before committing to Git:

```bash
# ✅ Verify config.js is NOT tracked
git status

# You should see:
# - config.example.js (tracked) ✅
# - config.js (NOT listed - ignored) ✅
```

**NEVER commit `config.js`** - it contains your API key!

---

## Quick Reference

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `config.js` | Your actual API key | ❌ NO |
| `config.example.js` | Template for others | ✅ YES |
| `.gitignore` | Protects secrets | ✅ YES |
| All other files | Extension code | ✅ YES |

---

## Resources

- 📖 Full documentation: See `README.md`
- 🔒 Security guide: See `SECURITY.md`
- 💬 API key management: [Google AI Studio](https://makersuite.google.com/app/apikey)
- 🐛 Chrome extension debugging: `chrome://extensions/` → Details → Inspect views

---

**Happy hovering!** 🚀

If you run into issues, check the full `README.md` for detailed troubleshooting.
