// ============================================
// Hov3x Background Service Worker (Proxy Version)
// Uses secure backend proxy to protect API key
// ============================================

// IMPORTANT: Replace this URL with your deployed Cloudflare Worker URL
const PROXY_API_URL = "https://hov3x-api-proxy.aaryan-kandiah.workers.dev/";

// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const CACHE_PREFIX = "explanation:";

console.log("[Hov3x Background] Service worker initialized (Proxy Mode)");

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

    console.log(`[Hov3x Background] Cache miss for: "${term}". Fetching from proxy...`);

    // Fetch from proxy API
    const explanation = await fetchExplanationFromProxy(term);

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
// Proxy API Call
// ============================================
async function fetchExplanationFromProxy(term) {
  console.log(`[Hov3x Background] Calling proxy API for: "${term}"`);

  const response = await fetch(PROXY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ term: term })
  });

  if (!response.ok) {
    // Handle rate limiting
    if (response.status === 429) {
      const data = await response.json();
      throw new Error(`Rate limit exceeded. Please wait ${data.retryAfter || 60} seconds.`);
    }

    // Handle other errors
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const data = await response.json();
  console.log("[Hov3x Background] Proxy API response received");

  if (data.success && data.explanation) {
    return data.explanation;
  }

  throw new Error("Invalid response format from proxy API");
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
