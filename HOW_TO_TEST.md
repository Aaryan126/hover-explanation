# HOW TO TEST - CRITICAL STEPS

## THE PROBLEM YOU'RE SEEING

When you see `Extension context invalidated` error, it means:
- The extension was reloaded
- The OLD content script is still running on the webpage
- The OLD content script cannot talk to the NEW background script
- This causes "Loading..." to hang forever

## THE SOLUTION - PROPER TESTING STEPS

### Step 1: Reload Extension
```
1. Go to chrome://extensions/
2. Find "Hov3x" extension
3. Click the reload button 🔄
```

### Step 2: HARD REFRESH THE WEBPAGE ⚠️ CRITICAL
```
THIS IS THE STEP YOU'RE MISSING!

You MUST do one of these:
- Press Ctrl + Shift + R (Windows/Linux)
- Press Cmd + Shift + R (Mac)
- Or: Press Ctrl + F5
- Or: Open DevTools → Right-click reload → "Empty Cache and Hard Reload"

Just pressing F5 or regular refresh is NOT enough!
```

### Step 3: Verify New Content Script Loaded
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for: "[Hov3x Content] Content script loaded"
4. Check the timestamp - should be AFTER extension reload
```

### Step 4: Test Selection
```
1. Select a word on the page
2. Wait for tooltip
3. If you see "Extension reloaded. Please refresh this page (F5)"
   → You didn't hard refresh properly, go back to Step 2
```

## DEBUGGING - Check These

### If Still Seeing "Extension context invalidated":
```
❌ You did NOT hard refresh the page
✅ Do Step 2 again - HARD REFRESH with Ctrl+Shift+R
```

### If Stuck on "Loading..." for >2 minutes:
```
1. Open background script console:
   chrome://extensions/ → Hov3x → Service worker → Inspect

2. Check for these logs:
   ✅ "[Hov3x Background] Queueing request for: ..."
   ✅ "[Hov3x Background] Starting to process request..."
   ✅ "[WebLLM] Generating streaming explanation..."

3. If you don't see these logs:
   → Request didn't reach background script
   → Content script context is still invalid
   → Go back to Step 2, do HARD REFRESH

4. If you see the logs but no response:
   → Check for WebLLM errors
   → Model might be loading (first time takes longer)
```

### Check Model Status:
```
1. Open background console (chrome://extensions/ → Inspect service worker)
2. Look for:
   "[WebLLM] Loading progress: ..."
   "[WebLLM] Engine initialized successfully"

3. First load can take 30-60 seconds to download model
   Subsequent loads should be instant (cached)
```

## COMPLETE TEST SEQUENCE

```bash
# 1. Build extension
npm run build

# 2. Reload extension
Go to chrome://extensions/, click reload on Hov3x

# 3. HARD REFRESH WEBPAGE
Press Ctrl + Shift + R on your test page

# 4. Open DevTools
Press F12

# 5. Check console for:
"[Hov3x Content] Content script loaded"

# 6. Select a word
Highlight any word on the page

# 7. Expected behavior:
- Tooltip appears with "Loading..."
- Within 10-30 seconds, explanation appears
- If interrupted, old request finishes, new request starts

# 8. Test interruption:
- Select "JavaScript"
- Immediately select "Python"
- Wait up to 40 seconds
- Should show Python explanation (not JavaScript)
```

## WHAT LOGS TO EXPECT

### Content Script Console (Page DevTools):
```
[Hov3x Content] Content script loaded
[Hov3x Content] Keep-alive port established
[Hov3x Content] Selected text: "network"
[Hov3x Content] Streaming request sent for: "network" (ID: 1234567890_abc123)
[Hov3x Content] Stream chunk received: 50 chars (ID: 1234567890_abc123)
[Hov3x Content] Stream complete (ID: 1234567890_abc123)
```

### Background Script Console (Extension Service Worker):
```
[Hov3x Background] Service worker initialized with WebLLM
[Hov3x Background] Starting WebLLM engine initialization...
[WebLLM] Initializing engine with model: phi-2-q4f16_1-MLC
[WebLLM] Loading progress: ...
[WebLLM] Engine initialized successfully
[Hov3x Background] Queueing request for: "network" (ID: 1234567890_abc123)
[Hov3x Background] WebLLM ready, processing immediately
[Hov3x Background] Starting to process request for: "network"
[WebLLM] Generating streaming explanation for: "network"
[Hov3x Background] Finished processing. Queue length: 0
```

## COMMON MISTAKES

❌ **MISTAKE 1:** Just pressing F5 to refresh
✅ **FIX:** Press Ctrl+Shift+R (hard refresh)

❌ **MISTAKE 2:** Not refreshing the page at all after extension reload
✅ **FIX:** Always hard refresh after reloading extension

❌ **MISTAKE 3:** Testing on multiple tabs without refreshing each
✅ **FIX:** Hard refresh EVERY tab where you want to test

❌ **MISTAKE 4:** Expecting instant results
✅ **FIX:** First generation takes 10-30 seconds, this is normal

❌ **MISTAKE 5:** Not waiting for interrupted request to complete
✅ **FIX:** Interrupted requests take up to 40 seconds (old completes + new starts)

## IF IT'S STILL NOT WORKING

1. **Close ALL tabs** that had the extension running
2. Reload the extension
3. Open a FRESH tab
4. Navigate to test page
5. Try selecting a word

This ensures no old content scripts are interfering.

## PERFORMANCE EXPECTATIONS

| Scenario | Expected Time |
|----------|---------------|
| First ever request | 30-60 seconds (model download + generation) |
| Subsequent requests (uncached) | 10-20 seconds |
| Cached requests | Instant |
| Interrupted request | 20-40 seconds (old finishes + new starts) |

## SUCCESS CRITERIA

✅ No "Extension context invalidated" errors after hard refresh
✅ Tooltip shows "Loading..." immediately
✅ Explanation appears within 30 seconds
✅ Rapid selections show only latest selection's explanation
✅ Console shows queue processing logs
✅ No uncaught promise errors

## STILL STUCK?

Share these with me:
1. Screenshot of content script console (F12 on page)
2. Screenshot of background script console (chrome://extensions → Inspect)
3. Confirm you did HARD REFRESH (Ctrl+Shift+R)
4. What word you selected
5. How long you waited
