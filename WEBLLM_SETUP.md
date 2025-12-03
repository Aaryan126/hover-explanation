# WebLLM Setup Guide

## Overview

This extension has been upgraded to use **WebLLM** instead of the Gemini API. WebLLM provides:

- **Free**: No API keys or costs required
- **Privacy**: All processing happens locally in your browser
- **Offline**: Works without internet connection (after model download)
- **Small Model**: Uses Phi-2 (2.7B parameters, ~1.6GB download)

## Quick Start

### 1. Build the Extension

```bash
npm install
npm run build
```

This will:
- Install WebLLM and dependencies
- Bundle the WebLLM library with the extension
- Copy all necessary files to the `dist/` folder

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project

### 3. First-Time Setup

When you first use the extension:

1. The Phi-2 model (~1.6GB) will download automatically
2. You'll see loading progress in the console
3. This happens only once - the model is cached in your browser
4. After download, inference happens instantly

## How It Works

### Architecture

```
User selects text
    ↓
content.js detects selection
    ↓
Message sent to background-webllm.js
    ↓
WebLLM generates explanation locally
    ↓
Result cached and displayed in tooltip
```

### Key Files

- **`webllm-service.js`**: WebLLM service wrapper
- **`background-webllm.js`**: Background script using WebLLM
- **`build.js`**: Build script to bundle everything
- **`dist/`**: Final bundled extension (load this in Chrome)

### Model Used

**Phi-2-q4f32_1-MLC**
- Size: ~1.6GB
- Parameters: 2.7B
- Quantized for efficiency
- Excellent for text explanations

## Development

### Project Structure

```
hover-explain/
├── webllm-service.js          # WebLLM service module
├── background-webllm.js        # New background script
├── build.js                    # Build script
├── content.js                  # Content script (unchanged)
├── tooltip.css                 # Tooltip styles (unchanged)
├── manifest.json              # Updated manifest
├── package.json               # Dependencies
└── dist/                      # Built extension
    ├── background.bundle.js   # Bundled background script
    ├── content.js
    ├── tooltip.css
    ├── manifest.json
    ├── popup/
    └── icons/
```

### Rebuild After Changes

```bash
npm run build
```

Then reload the extension in Chrome:
- Go to `chrome://extensions/`
- Click the reload icon on your extension

## Configuration

### Change Model

Edit `webllm-service.js`:

```javascript
const MODEL_ID = "Phi-2-q4f32_1-MLC"; // Change this
```

Available models: https://github.com/mlc-ai/web-llm#models

### Adjust Generation Settings

Edit `webllm-service.js`:

```javascript
const MAX_TOKENS = 300;      // Max response length
const TEMPERATURE = 0.7;     // Creativity (0.0 - 1.0)
```

## Performance

### First Use
- Model download: ~1-2 minutes (1.6GB)
- One-time only, cached afterward

### Subsequent Uses
- Initialization: ~5-10 seconds
- Per explanation: ~1-3 seconds
- Cached results: Instant

### Requirements
- Chrome 96+
- ~2GB available disk space
- ~1GB RAM for model

## Troubleshooting

### Extension Won't Load

Check console for errors:
1. Right-click extension icon
2. Select "Inspect service worker"
3. Check Console tab

### Model Download Fails

- Ensure stable internet connection
- Clear browser cache and try again
- Check available disk space

### Slow Performance

- Close other tabs to free up memory
- First explanation is always slower (initialization)
- Consider using a smaller model

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Migration from Gemini

The old Gemini-based files are preserved:
- `background.js` - Original Gemini implementation
- `background-proxy.js` - Cloudflare Worker proxy

To switch back to Gemini:
1. Edit `manifest.json`
2. Change service worker to `background.js`
3. Reload extension

## Benefits vs Gemini API

| Feature | WebLLM | Gemini API |
|---------|--------|------------|
| Cost | Free | Paid (with free tier) |
| Privacy | Local | Cloud-based |
| Offline | Yes (after download) | No |
| Speed | 1-3 seconds | < 1 second |
| Setup | Download model | API key required |
| Model Size | ~1.6GB | N/A |

## Next Steps

1. Test the extension by selecting text on any webpage
2. Check the console for loading progress
3. Enjoy free, local AI explanations!

## Resources

- WebLLM GitHub: https://github.com/mlc-ai/web-llm
- Phi-2 Model: https://huggingface.co/microsoft/phi-2
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Open Chrome DevTools (F12) and check for errors
3. Review the console logs in the service worker
