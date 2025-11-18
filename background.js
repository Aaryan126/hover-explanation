// ============================================
// Hov3x Background Service Worker
// Handles Gemini API calls and caching
// ============================================

// Import API key from config.js (not committed to git)
// If config.js doesn't exist, use placeholder
let GEMINI_API_KEY = "YOUR_API_KEY_HERE";

// Try to import from config.js
try {
  // In Chrome extensions, we need to use importScripts for service workers
  importScripts('config.js');
  if (typeof CONFIG !== 'undefined' && CONFIG.GEMINI_API_KEY) {
    GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;
    console.log("[Hov3x Background] API key loaded from config.js");
  }
} catch (error) {
  console.warn("[Hov3x Background] config.js not found. Please create it from config.example.js");
}

// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const CACHE_PREFIX = "explanation:";

console.log("[Hov3x Background] Service worker initialized");

// ============================================
// Message Listener
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Hov3x Background] Received message:", request);

  if (request.action === "getExplanation") {
    handleExplanationRequest(request.term, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (request.action === "clearCache") {
    clearAllCache(sendResponse);
    return true;
  }

  if (request.action === "getCacheStats") {
    getCacheStats(sendResponse);
    return true;
  }
});

// ============================================
// Main Handler: Get Explanation
// ============================================
async function handleExplanationRequest(term, sendResponse) {
  console.log(`[Hov3x Background] Handling request for term: "${term}"`);

  try {
    // Check if service is enabled
    const serviceState = await chrome.storage.local.get(['serviceEnabled']);
    const serviceEnabled = serviceState.serviceEnabled !== undefined ? serviceState.serviceEnabled : true;

    if (!serviceEnabled) {
      console.log(`[Hov3x Background] Service is disabled, ignoring request`);
      sendResponse({ success: false, error: "Service is disabled" });
      return;
    }

    // Check cache first
    const cached = await getCachedExplanation(term);
    if (cached) {
      console.log(`[Hov3x Background] Cache hit for: "${term}"`);
      sendResponse({ success: true, explanation: cached.text, cached: true });
      return;
    }

    console.log(`[Hov3x Background] Cache miss for: "${term}". Fetching from Gemini...`);

    // Fetch from Gemini API
    const explanation = await fetchGeminiExplanation(term);

    // Cache the result
    await cacheExplanation(term, explanation);

    console.log(`[Hov3x Background] Successfully fetched and cached: "${term}"`);
    sendResponse({ success: true, explanation: explanation, cached: false });

  } catch (error) {
    console.error(`[Hov3x Background] Error fetching explanation:`, error);
    sendResponse({
      success: false,
      error: error.message || "Failed to fetch explanation"
    });
  }
}

// ============================================
// Gemini API Call
// ============================================
async function fetchGeminiExplanation(term) {
  if (GEMINI_API_KEY === "YOUR_API_KEY_HERE") {
    throw new Error("Gemini API key not configured. Please add your API key in background.js");
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{
      parts: [{
        text: `Explain this technical term in 1-2 simple, clear sentences: "${term}"`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
      candidateCount: 1,
      stopSequences: []
    }
  };

  console.log(`[Hov3x Background] Calling Gemini API for: "${term}"`);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Hov3x Background] Gemini API error:", errorText);
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("[Hov3x Background] Gemini API response:", data);

  // Extract text from response
  if (data.candidates && data.candidates[0]) {
    const candidate = data.candidates[0];

    // Check if we have content with parts
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const text = candidate.content.parts[0].text;
      if (text) {
        return text.trim();
      }
    }

    // If no text in parts, check finish reason
    if (candidate.finishReason === "MAX_TOKENS") {
      throw new Error("Response was truncated due to token limit. Try a shorter term.");
    }

    throw new Error(`No text content in response. Finish reason: ${candidate.finishReason}`);
  }

  throw new Error("Invalid response format from Gemini API");
}

// ============================================
// Cache Management Functions
// ============================================

// Get cached explanation
async function getCachedExplanation(term) {
  const key = CACHE_PREFIX + term.toLowerCase();
  const result = await chrome.storage.local.get(key);

  if (!result[key]) {
    return null;
  }

  const cached = result[key];
  const now = Date.now();
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  // Check if cache is expired
  if (now - cached.timestamp > expiryTime) {
    console.log(`[Hov3x Background] Cache expired for: "${term}"`);
    await chrome.storage.local.remove(key);
    return null;
  }

  return cached;
}

// Save explanation to cache
async function cacheExplanation(term, explanation) {
  const key = CACHE_PREFIX + term.toLowerCase();
  const cacheEntry = {
    text: explanation,
    timestamp: Date.now()
  };

  await chrome.storage.local.set({ [key]: cacheEntry });
  console.log(`[Hov3x Background] Cached explanation for: "${term}"`);
}

// Clear all cached explanations
async function clearAllCache(sendResponse) {
  try {
    const allData = await chrome.storage.local.get(null);
    const keysToRemove = Object.keys(allData).filter(key => key.startsWith(CACHE_PREFIX));

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`[Hov3x Background] Cleared ${keysToRemove.length} cached explanations`);
    }

    sendResponse({ success: true, cleared: keysToRemove.length });
  } catch (error) {
    console.error("[Hov3x Background] Error clearing cache:", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get cache statistics
async function getCacheStats(sendResponse) {
  try {
    const allData = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(allData).filter(key => key.startsWith(CACHE_PREFIX));

    const stats = {
      totalCached: cacheKeys.length,
      cacheKeys: cacheKeys.map(key => key.replace(CACHE_PREFIX, ""))
    };

    console.log("[Hov3x Background] Cache stats:", stats);
    sendResponse({ success: true, stats: stats });
  } catch (error) {
    console.error("[Hov3x Background] Error getting cache stats:", error);
    sendResponse({ success: false, error: error.message });
  }
}
