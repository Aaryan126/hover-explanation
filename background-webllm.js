// ============================================
// Hov3x Background Service Worker (WebLLM)
// Handles local LLM inference and caching
// ============================================

import {
  initializeEngine,
  generateExplanation,
  isEngineReady,
  getInitStatus
} from './webllm-service.js';

// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const CACHE_PREFIX = "explanation:";

console.log("[Hov3x Background] Service worker initialized with WebLLM");

// Initialize WebLLM engine on startup
let engineInitPromise = null;

// ============================================
// Initialize Engine on Startup
// ============================================
function startEngineInitialization() {
  if (!engineInitPromise) {
    console.log("[Hov3x Background] Starting WebLLM engine initialization...");
    engineInitPromise = initializeEngine((progress) => {
      console.log(`[Hov3x Background] Model loading: ${progress.text}`);
      // Store progress in chrome.storage for popup to display
      chrome.storage.local.set({
        webllmProgress: progress.text,
        webllmReady: false
      });
    }).then(() => {
      console.log("[Hov3x Background] WebLLM engine ready");
      chrome.storage.local.set({
        webllmReady: true,
        webllmProgress: "Ready"
      });
    }).catch(error => {
      console.error("[Hov3x Background] Engine initialization failed:", error);
      chrome.storage.local.set({
        webllmReady: false,
        webllmProgress: `Error: ${error.message}`
      });
    });
  }
  return engineInitPromise;
}

// Start initialization immediately
startEngineInitialization();

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

  if (request.action === "getWebLLMStatus") {
    getWebLLMStatus(sendResponse);
    return true;
  }

  if (request.action === "initializeWebLLM") {
    initializeWebLLM(sendResponse);
    return true;
  }
});

// ============================================
// Get WebLLM Status
// ============================================
function getWebLLMStatus(sendResponse) {
  const status = getInitStatus();
  chrome.storage.local.get(['webllmReady', 'webllmProgress'], (result) => {
    sendResponse({
      success: true,
      status: {
        ...status,
        isReady: result.webllmReady || false,
        progress: result.webllmProgress || "Not initialized"
      }
    });
  });
}

// ============================================
// Initialize WebLLM (on-demand)
// ============================================
async function initializeWebLLM(sendResponse) {
  try {
    await startEngineInitialization();
    sendResponse({ success: true, message: "WebLLM initialized" });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

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

    console.log(`[Hov3x Background] Cache miss for: "${term}". Generating with WebLLM...`);

    // Ensure engine is initialized
    if (!isEngineReady()) {
      console.log(`[Hov3x Background] Engine not ready, initializing...`);
      await startEngineInitialization();
    }

    // Generate explanation using WebLLM
    const explanation = await generateExplanation(term, (progress) => {
      console.log(`[Hov3x Background] Generation progress: ${progress.text}`);
    });

    // Cache the result
    await cacheExplanation(term, explanation);

    console.log(`[Hov3x Background] Successfully generated and cached: "${term}"`);
    sendResponse({ success: true, explanation: explanation, cached: false });

  } catch (error) {
    console.error(`[Hov3x Background] Error fetching explanation:`, error);
    sendResponse({
      success: false,
      error: error.message || "Failed to generate explanation"
    });
  }
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
