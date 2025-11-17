# 🚀 Getting Started Checklist

Complete these steps to get Hov3x up and running!

---

## ✅ Phase 1: Initial Setup (5 minutes)

### Step 1: Get API Key
- [ ] Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Create a new API key
- [ ] Copy the key (starts with `AIzaSy...`)

### Step 2: Configure Extension
- [ ] Open `config.js` in your editor
- [ ] Paste your API key replacing `YOUR_API_KEY_HERE`
- [ ] Save the file

### Step 3: Create Icons (Optional)
- [ ] Either: Create 3 PNG files (16x16, 48x48, 128x128) in `icons/` folder
- [ ] Or: Skip for now (extension will use default Chrome icon)

### Step 4: Load in Chrome
- [ ] Open Chrome and go to `chrome://extensions/`
- [ ] Toggle "Developer mode" ON (top-right)
- [ ] Click "Load unpacked"
- [ ] Select the `hover-explain` folder
- [ ] Extension appears in list ✅

---

## ✅ Phase 2: Test the Extension (2 minutes)

### Basic Functionality Test
- [ ] Open [Wikipedia AI article](https://en.wikipedia.org/wiki/Artificial_intelligence)
- [ ] Hover over the word "algorithm"
- [ ] Tooltip appears with "Loading..." ✅
- [ ] After 1-2 seconds, AI explanation appears ✅
- [ ] Move mouse away - tooltip disappears ✅
- [ ] Hover over "algorithm" again - instant result (cached) ✅

### Console Verification
- [ ] Press F12 to open DevTools
- [ ] Check Console tab
- [ ] Look for these messages:
  ```
  [Hov3x Content] Content script loaded ✅
  [Hov3x Background] Service worker initialized ✅
  [Hov3x Background] API key loaded from config.js ✅
  ```

### Popup Test
- [ ] Click the Hov3x icon in Chrome toolbar
- [ ] Popup opens showing cache statistics ✅
- [ ] "Cached Terms" shows a number > 0 ✅
- [ ] Click "Clear All Cache" → confirms → cache cleared ✅

---

## ✅ Phase 3: Customize (Optional)

### Adjust Settings
- [ ] Change hover delay in `content.js` (default: 200ms)
- [ ] Adjust cache expiry in `background.js` (default: 7 days)
- [ ] Customize tooltip colors in `tooltip.css`
- [ ] Modify valid HTML tags in `content.js`

### Style the Tooltip
- [ ] Edit `tooltip.css`
- [ ] Change gradient colors
- [ ] Adjust padding/border-radius
- [ ] Reload extension to see changes

---

## ✅ Phase 4: Git Setup (If Using Version Control)

### Security Verification
- [ ] Verify `config.js` exists in `.gitignore`
- [ ] Run `git status`
- [ ] Confirm `config.js` does NOT appear in untracked files ✅
- [ ] Confirm `config.example.js` DOES appear ✅

### Initialize Git (If Not Already Done)
- [ ] Run: `git init`
- [ ] Run: `git add .`
- [ ] Verify again: `git status` (config.js should NOT be staged)
- [ ] Run: `git commit -m "Initial commit: Hov3x extension"`

### Push to GitHub (Optional)
- [ ] Create a new repo on GitHub
- [ ] Add remote: `git remote add origin YOUR_REPO_URL`
- [ ] Push: `git push -u origin main`
- [ ] Verify on GitHub: `config.js` is NOT in the repo ✅
- [ ] Verify on GitHub: `config.example.js` IS in the repo ✅

---

## ✅ Phase 5: Advanced Testing

### Test on Different Sites
- [ ] Wikipedia (general articles)
- [ ] Stack Overflow (code discussions)
- [ ] MDN Web Docs (web dev terms)
- [ ] GitHub README files
- [ ] Medium articles on tech topics

### Test Edge Cases
- [ ] Hover over very short words (< 3 chars) - should not trigger ✅
- [ ] Hover rapidly over multiple words - no duplicate requests ✅
- [ ] Hover at screen edges - tooltip repositions correctly ✅
- [ ] Test with browser zoom at 150% - still works ✅
- [ ] Test on mobile-responsive pages

### Cache Testing
- [ ] Hover over a new word → gets cached
- [ ] Reload page and hover same word → instant (from cache) ✅
- [ ] Clear cache via popup
- [ ] Hover over same word → fetches again ✅

---

## ✅ Phase 6: Performance Check

### Monitor API Usage
- [ ] Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- [ ] Check "Usage" tab
- [ ] Verify requests are being logged
- [ ] Confirm within free tier limits

### Check Extension Performance
- [ ] Open Chrome Task Manager (Shift+Esc)
- [ ] Find "Extension: Hov3x"
- [ ] Memory usage should be < 50MB
- [ ] CPU usage should be minimal when idle

### Debug Console
- [ ] Check for any errors in console
- [ ] Verify all `[Hov3x]` logs are informational
- [ ] No red error messages ✅

---

## ✅ Phase 7: Documentation Review

### Read Key Docs
- [ ] Read `SETUP_GUIDE.md` (quick reference)
- [ ] Skim `README.md` (full documentation)
- [ ] Review `SECURITY.md` (security best practices)
- [ ] Check `GIT_SAFETY_VERIFIED.md` (confirms git setup)

### Understand Architecture
- [ ] Review architecture diagram in `README.md`
- [ ] Understand how caching works
- [ ] Know how to troubleshoot common issues

---

## ✅ Phase 8: Share Your Work (Optional)

### Prepare for Sharing
- [ ] Add a screenshot of the extension in action
- [ ] Update README with any customizations you made
- [ ] Test that others can clone and setup easily
- [ ] Write a blog post or tweet about your extension!

### Contribute (Optional)
- [ ] Found a bug? Document it
- [ ] Have an idea? Add to roadmap
- [ ] Made improvements? Consider sharing back

---

## 🎯 Quick Status Check

After completing the checklist, you should have:

✅ Extension installed and working in Chrome
✅ API key configured in `config.js`
✅ Tooltips appearing on hover
✅ Cache working (instant second loads)
✅ Popup showing statistics
✅ Git configured safely (if using version control)
✅ Understanding of how it all works

---

## 🆘 Troubleshooting

If anything didn't work:

| Issue | Solution |
|-------|----------|
| "API key not configured" | Edit `config.js` with your real key |
| Tooltip doesn't appear | Check console for errors, verify on valid HTML tags |
| Extension won't load | Check for errors at `chrome://extensions/` |
| Git shows config.js | Verify `.gitignore` exists and contains `config.js` |

**Full troubleshooting guide**: See `README.md` → Troubleshooting section

---

## 📚 Next Steps

Once everything is working:

1. **Daily Use**
   - Browse technical sites
   - Build your cache naturally
   - Monitor API usage

2. **Customization**
   - Tweak settings to your preference
   - Style the tooltip
   - Add new features

3. **Share**
   - Show friends/colleagues
   - Post on social media
   - Contribute improvements

---

## 🎉 Congratulations!

You now have a fully functional AI-powered tooltip extension!

**Your checklist completion status:**
- Phase 1 (Setup): ___/4 steps
- Phase 2 (Testing): ___/7 steps
- Phase 3 (Customize): ___/6 steps
- Phase 4 (Git): ___/9 steps
- Phase 5 (Advanced): ___/11 steps
- Phase 6 (Performance): ___/8 steps
- Phase 7 (Documentation): ___/5 steps
- Phase 8 (Share): ___/4 steps

**Total Progress: ___/54 steps completed**

---

**Happy hovering!** 🚀✨
