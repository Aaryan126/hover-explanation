# Hov3x - AI-Powered Technical Term Tooltips

**Hov3x** is a Chrome Extension (Manifest V3) that provides instant AI-generated explanations for technical terms when you hover over them on any webpage. Powered by Google's Gemini 2.0 Flash Lite model.

---

## Features

- **Instant Explanations**: Hover over any technical term to get a concise 1-2 sentence explanation
- **Smart Caching**: Terms are cached locally for 7 days to minimize API calls
- **Fast & Lightweight**: Minimal performance impact with 200ms hover delay
- **Beautiful UI**: Clean gradient tooltip design with smart positioning
- **Offline-First**: Cached terms work without internet connection
- **Privacy-Focused**: All data stored locally on your device

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      USER WEBPAGE                        │
│  ┌────────────────────────────────────────────────┐    │
│  │  content.js (injected)                         │    │
│  │  - Detects hover events                        │    │
│  │  - Extracts word under cursor                  │    │
│  │  - Shows/hides tooltip                         │    │
│  │  - Manages tooltip positioning                 │    │
│  └─────────────┬──────────────────────────────────┘    │
│                │                                         │
│                │ chrome.runtime.sendMessage()            │
│                ▼                                         │
└─────────────────────────────────────────────────────────┘
                 │
                 │
┌────────────────▼──────────────────────────────────────┐
│         background.js (Service Worker)                │
│  ┌──────────────────────────────────────────────┐   │
│  │  1. Check chrome.storage.local for cache     │   │
│  │  2. If cached → return immediately           │   │
│  │  3. If not cached:                           │   │
│  │     - Call Gemini API                        │   │
│  │     - Store in cache                         │   │
│  │     - Return explanation                     │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
                 │
                 │ HTTPS POST
                 ▼
┌─────────────────────────────────────────────────────────┐
│         Gemini 2.0 Flash Lite API                       │
│  https://generativelanguage.googleapis.com/             │
│  - Receives: Technical term                            │
│  - Returns: 1-2 sentence explanation                   │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
hover-explain/
├── manifest.json           # Extension configuration (Manifest V3)
├── background.js           # Service worker - handles API calls & caching
├── content.js              # Injected script - detects hovers, shows tooltips
├── tooltip.css             # Tooltip styling
├── tooltip.js              # Optional tooltip utilities (currently unused)
├── config.js               # API key configuration (NOT committed to git)
├── config.example.js       # Template for config.js (committed to git)
├── .gitignore              # Prevents committing sensitive files
├── popup/
│   ├── popup.html          # Extension popup UI
│   └── popup.js            # Popup logic - displays cache stats
├── icons/                  # Extension icons (you need to create these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md               # This file
```

---

## Installation & Setup

### Step 1: Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Configure Your API Key (SECURE METHOD)

**IMPORTANT**: Never commit your API key to Git!

1. In the project folder, you'll find `config.example.js`
2. **The `config.js` file already exists** - open it in your editor
3. Replace `YOUR_API_KEY_HERE` with your actual API key:
   ```javascript
   const CONFIG = {
     GEMINI_API_KEY: "AIzaSyC_your_actual_key_here"
   };
   ```
4. Save `config.js`
5. **Verify** that `config.js` is listed in `.gitignore` (it already is!)

**Why this is secure**:
- ✅ `config.js` is in `.gitignore` and will never be committed to Git
- ✅ `config.example.js` is committed as a template (without your real key)
- ✅ Your API key stays private on your local machine
- ✅ Other developers can copy `config.example.js` to create their own `config.js`

### Step 3: Create Extension Icons

The extension requires three icon sizes. You can create simple placeholder icons or design custom ones:

1. Create an `icons` folder in the project root
2. Add three PNG files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

**Quick way**: Use any online icon generator or simply copy any PNG image three times and rename them.

### Step 4: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `hover-explain` folder
5. The extension should now appear in your extensions list

### Step 5: Test the Extension

1. Navigate to any webpage with technical content (e.g., Wikipedia, Stack Overflow, MDN Web Docs)
2. Hover over a technical term for 200ms
3. You should see a purple gradient tooltip with "Loading..."
4. After 1-2 seconds, the explanation should appear
5. Hover over the same term again - it should load instantly (from cache)

---

## How It Works

### 1. Hover Detection

**File**: `content.js`

- Listens for `mouseover` events on the page
- Only triggers on valid elements: `<p>`, `<span>`, `<li>`, `<td>`, `<code>`, etc.
- Extracts the word under the cursor
- Waits 200ms before processing (prevents accidental triggers)
- Ignores words shorter than 3 characters

### 2. Cache Check

**File**: `background.js` → `getCachedExplanation()`

- Checks `chrome.storage.local` for a cached explanation
- Cache key format: `explanation:termname`
- Cache entry includes:
  ```javascript
  {
    text: "The actual explanation...",
    timestamp: 1690000000000
  }
  ```
- Automatically expires entries older than 7 days

### 3. API Call (if not cached)

**File**: `background.js` → `fetchGeminiExplanation()`

- Constructs a request to Gemini API
- Sends prompt: `"Explain this technical term in 1-2 simple, clear sentences: <term>"`
- Parses the response and extracts the explanation text
- Handles errors gracefully

### 4. Caching

**File**: `background.js` → `cacheExplanation()`

- Stores the explanation in `chrome.storage.local`
- Adds timestamp for expiry tracking
- All cached terms persist across browser sessions

### 5. Tooltip Display

**File**: `content.js` → `showTooltip()`, `updateTooltip()`

- Creates a tooltip div and injects it into the page
- Positions tooltip near cursor with smart edge detection
- Updates content when API response arrives
- Hides when mouse leaves the word

---

## Caching System

### How Caching Works

1. **First hover**: Term is fetched from Gemini API and stored locally
2. **Subsequent hovers**: Explanation loads instantly from cache
3. **Expiration**: Cache entries expire after 7 days
4. **Storage**: Uses `chrome.storage.local` (synced across Chrome sessions)

### Cache Entry Format

```javascript
{
  "explanation:neural network": {
    "text": "A neural network is a computational model...",
    "timestamp": 1690000000000
  },
  "explanation:latent space": {
    "text": "Latent space is a compressed representation...",
    "timestamp": 1690000100000
  }
}
```

### Cache Management

- **View cache stats**: Click the extension icon to open the popup
- **Clear cache**: Click "Clear All Cache" in the popup
- **Manual clearing**: Use Chrome DevTools → Application → Storage → Local Storage

---

## Testing Instructions

### Manual Testing Checklist

#### Basic Functionality
- [ ] Load extension in Chrome without errors
- [ ] Navigate to a webpage with text
- [ ] Hover over a word - tooltip appears after 200ms
- [ ] Tooltip shows "Loading..." initially
- [ ] Tooltip updates with explanation after API response
- [ ] Hover over same word again - loads instantly from cache

#### Edge Cases
- [ ] Hover over word at edge of screen - tooltip repositions correctly
- [ ] Hover over short words (1-2 chars) - no tooltip appears
- [ ] Hover rapidly over multiple words - no duplicate requests
- [ ] Move mouse away from word - tooltip disappears
- [ ] Test on different websites (Wikipedia, GitHub, Stack Overflow)

#### Error Handling
- [ ] Test without API key - error message appears in tooltip
- [ ] Test with invalid API key - error message appears
- [ ] Disconnect internet (after first load) - cached terms still work
- [ ] Check console for errors

#### Popup Functionality
- [ ] Click extension icon - popup opens
- [ ] Cache stats display correctly
- [ ] "Refresh Statistics" updates numbers
- [ ] "Clear All Cache" prompts confirmation
- [ ] After clearing, cached count shows 0

### Debugging

Open Chrome DevTools Console to see detailed logs:

```
[Hov3x Content] Content script loaded
[Hov3x Content] Hovering over word: "algorithm"
[Hov3x Background] Received message: {action: "getExplanation", term: "algorithm"}
[Hov3x Background] Cache miss for: "algorithm". Fetching from Gemini...
[Hov3x Background] Successfully fetched and cached: "algorithm"
[Hov3x Content] Received explanation: "An algorithm is a step-by-step..."
```

---

## Troubleshooting

### Problem: Tooltip doesn't appear

**Possible causes**:
1. Extension not loaded properly
   - **Fix**: Check `chrome://extensions/` - ensure extension is enabled
2. API key not configured
   - **Fix**: Add your API key to `background.js`
3. Hovering over invalid element
   - **Fix**: Only works on `<p>`, `<span>`, `<li>`, `<td>`, `<code>` tags

### Problem: "API key not configured" error

**Solution**:
1. Open `background.js`
2. Replace `const GEMINI_API_KEY = "YOUR_API_KEY_HERE";` with your actual key
3. Reload the extension in `chrome://extensions/`

### Problem: Tooltip appears but shows "Error: ..."

**Possible causes**:
1. Invalid API key
   - **Fix**: Verify key at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. API quota exceeded
   - **Fix**: Check your quota at Google AI Studio
3. Network error
   - **Fix**: Check internet connection

### Problem: Tooltip position is off-screen

**Solution**: This should be handled automatically by the positioning logic in `content.js`. If it persists:
1. Check browser zoom level (should be 100%)
2. Check for CSS conflicts on the target website

### Problem: Extension icons not showing

**Solution**:
1. Create an `icons` folder in project root
2. Add `icon16.png`, `icon48.png`, `icon128.png`
3. Reload extension

---

## Configuration Options

### Adjust Hover Delay

**File**: `content.js`

```javascript
const HOVER_DELAY_MS = 200; // Change to desired milliseconds
```

### Adjust Minimum Word Length

**File**: `content.js`

```javascript
const MIN_WORD_LENGTH = 3; // Change to desired length
```

### Adjust Cache Expiry

**File**: `background.js`

```javascript
const CACHE_EXPIRY_DAYS = 7; // Change to desired days
```

### Adjust Valid HTML Tags

**File**: `content.js`

```javascript
const VALID_TAGS = ['P', 'SPAN', 'LI', 'TD', 'CODE', 'DIV', 'H1', 'H2', 'H3'];
```

### Customize Tooltip Style

**File**: `tooltip.css`

```css
#hov3x-tooltip {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change colors, size, etc. */
}
```

---

## Performance Considerations

- **Hover delay**: 200ms prevents accidental triggers and reduces API calls
- **Caching**: Dramatically reduces API usage and latency
- **Duplicate prevention**: Tracks pending requests to avoid spam
- **Lazy initialization**: Tooltip element only created when first needed
- **Smart positioning**: Minimal DOM reads for optimal performance

---

## Roadmap / Future Features

### Phase 2 - Enhanced UX
- [ ] Keyboard shortcut to trigger tooltip (e.g., Ctrl+Hover)
- [ ] Configurable tooltip themes (light/dark/custom)
- [ ] Tooltip fade-in/fade-out animations
- [ ] Double-click to "pin" tooltip
- [ ] Copy explanation to clipboard button

### Phase 3 - Advanced Features
- [ ] Settings page for API key, cache duration, etc.
- [ ] Multi-language support
- [ ] Context-aware explanations (different meanings in different contexts)
- [ ] User-editable cache (fix incorrect explanations)
- [ ] Export/import cache
- [ ] Whitelist/blacklist specific websites

### Phase 4 - Intelligence
- [ ] Detect technical terms automatically (highlight hoverable words)
- [ ] Related terms suggestions
- [ ] Example usage in code snippets
- [ ] Links to documentation
- [ ] Difficulty level indicator (beginner/intermediate/advanced)

### Phase 5 - Collaboration
- [ ] Share explanations with others
- [ ] Community-contributed explanations
- [ ] Vote on best explanations
- [ ] Sync cache across devices (via Chrome storage sync)

---

## Privacy & Security

### Data Privacy
- **No data collection**: All explanations stored locally on your device
- **No tracking**: Extension does not track your browsing
- **API calls**: Only sent to Google Gemini API (subject to Google's privacy policy)
- **Secure storage**: Uses Chrome's built-in storage API
- **Open source**: All code is visible and auditable

### API Key Security
- **Never commit API keys**: Your `config.js` file is in `.gitignore`
- **Secure configuration**: API key stored locally, never in version control
- **Template-based setup**: Use `config.example.js` as a safe template
- **Best practice**: Rotate your API key periodically for maximum security

### Before Committing to Git

**ALWAYS verify** these files are in your `.gitignore`:
```
config.js           # Your actual API key (NEVER commit this!)
*.pem               # Chrome extension private keys
*.crx               # Packaged extensions
```

**Safe to commit**:
```
config.example.js   # Template without real API key
.gitignore          # List of files to ignore
All other files     # manifest.json, background.js, etc.
```

### Sharing Your Code

If you share this project on GitHub:
1. ✅ Push `config.example.js` (template)
2. ❌ **NEVER** push `config.js` (contains your API key)
3. ✅ Include `.gitignore` in your commits
4. ✅ Add instructions in README for others to create their own `config.js`

---

## API Usage & Costs

### Gemini API Pricing (as of 2025)

- **Free tier**: 60 requests per minute, 1500 requests per day
- **Paid tier**: Variable pricing based on usage

### Reducing API Costs

1. **Use caching**: Most terms will only be fetched once
2. **Adjust cache expiry**: Increase `CACHE_EXPIRY_DAYS` to reduce re-fetches
3. **Selective hovering**: Don't hover over every word
4. **Clear cache sparingly**: Only clear when necessary

### Monitoring Usage

Check your API usage at [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## Development

### Tech Stack

- **Vanilla JavaScript**: No frameworks or dependencies
- **Chrome Extension Manifest V3**: Modern extension format
- **Gemini 2.0 Flash Lite**: Fast, lightweight AI model
- **Chrome Storage API**: Local caching

### Code Philosophy

Following the project's `CLAUDE.md` guidelines:

✅ **Clean & Readable**: Clear function names, concise comments
✅ **Modular Structure**: Separate files for different concerns
✅ **More Files, Fewer Lines**: Each file has a single responsibility
✅ **Maintainable**: Easy to extend and modify
✅ **Simple**: No over-engineering, straightforward solutions
✅ **Error Handling**: Graceful failures with meaningful messages

### Making Changes

1. Edit the relevant file
2. Save changes
3. Go to `chrome://extensions/`
4. Click the refresh icon on the Hov3x extension
5. Test your changes on a webpage

---

## Contributing

This is an MVP foundation. Contributions welcome for:

- Bug fixes
- Performance improvements
- New features from the roadmap
- Documentation improvements
- Icon/design improvements

---

## License

MIT License - Feel free to modify and distribute

---

## Support

For issues, questions, or suggestions:

1. Check the Troubleshooting section above
2. Review console logs in Chrome DevTools
3. Verify API key is correctly configured
4. Test on a simple webpage first (e.g., Wikipedia)

---

## Credits

- **AI Model**: Google Gemini 2.0 Flash Lite
- **Built with**: Chrome Extension Manifest V3
- **Inspired by**: The need for faster learning while browsing technical content

---

**Happy hovering!** 🚀
