// ============================================
// Hov3x Background Service Worker (WebLLM)
// Handles local LLM inference and caching
// ============================================

import {
  initializeEngine,
  generateExplanation,
  generateExplanationStreaming,
  isEngineReady,
  getInitStatus
} from './webllm-service.js';

import {
  generateExplanationStreaming as generateExplanationStreamingGemini
} from './gemini-service.js';

// Cache configuration
const CACHE_EXPIRY_DAYS = 7;
const CACHE_PREFIX = "explanation:";

// Keep-alive configuration
const KEEPALIVE_INTERVAL_MS = 20000; // Ping every 20 seconds
let keepAliveInterval = null;

// Track active streaming requests for cancellation
let activeStreamingRequest = null;

// Request queue to handle WebLLM's single-threaded nature
let requestQueue = [];
let isProcessingRequest = false;

// Timeout mechanism to abandon slow requests
const ABANDON_TIMEOUT_MS = 2000; // Abandon after 2 seconds if new request comes
let currentProcessingTimeout = null;
let abandonedRequests = new Set(); // Track abandoned request IDs

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
// Keep-Alive Mechanism
// ============================================
function startKeepAlive() {
  // Clear any existing interval
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  console.log("[Hov3x Background] Starting keep-alive pings");

  // Send periodic pings to prevent service worker from sleeping
  keepAliveInterval = setInterval(() => {
    // Check if engine is ready
    const status = getInitStatus();
    console.log(`[Hov3x Background] Keep-alive ping - Engine ready: ${status.isReady}`);

    // Update storage to keep it fresh
    chrome.storage.local.set({
      lastKeepAlive: Date.now(),
      webllmReady: status.isReady
    });

    // If engine isn't ready and not initializing, restart initialization
    if (!status.isReady && !status.isInitializing) {
      console.log("[Hov3x Background] Engine lost, restarting initialization...");
      engineInitPromise = null; // Reset promise
      startEngineInitialization();
    }
  }, KEEPALIVE_INTERVAL_MS);
}

// Start keep-alive after a short delay
setTimeout(startKeepAlive, 5000);

// Listen for when service worker is about to be terminated
self.addEventListener('beforeunload', () => {
  console.log("[Hov3x Background] Service worker terminating");
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
});

// ============================================
// Port-based Keep-Alive (Alternative Method)
// ============================================
// Listen for long-lived connections from content scripts
const connectedPorts = new Set();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'keepalive') {
    connectedPorts.add(port);
    console.log(`[Hov3x Background] Keep-alive port connected (${connectedPorts.size} total)`);

    port.onDisconnect.addListener(() => {
      connectedPorts.delete(port);
      console.log(`[Hov3x Background] Keep-alive port disconnected (${connectedPorts.size} remaining)`);
    });

    // Send periodic pings through the port
    const portPingInterval = setInterval(() => {
      try {
        port.postMessage({ type: 'ping', timestamp: Date.now() });
      } catch (error) {
        clearInterval(portPingInterval);
      }
    }, 25000); // Every 25 seconds

    port.onDisconnect.addListener(() => {
      clearInterval(portPingInterval);
    });
  }
});

// ============================================
// Message Listener
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[Hov3x Background] Received message:", request);

  if (request.action === "getExplanation") {
    handleExplanationRequest(request.term, sendResponse);
    return true; // Keep message channel open for async response
  }

  if (request.action === "getExplanationStreaming") {
    queueStreamingRequest(request.term, sender.tab.id, request.requestId);
    return false; // Streaming handled via separate messages
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
// Helper: Safe Message Sending
// ============================================
function safeSendMessage(tabId, message) {
  try {
    chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error(`[Hov3x Background] Failed to send message to tab ${tabId}:`, error);
  }
}

// ============================================
// Queue Management for Single-Threaded WebLLM
// ============================================
function queueStreamingRequest(term, tabId, requestId) {
  console.log(`[Hov3x Background] Queueing request for: "${term}" (ID: ${requestId})`);

  // Clear the entire queue when a new request comes in
  // This ensures only the latest request is processed
  requestQueue = [{
    term: term,
    tabId: tabId,
    requestId: requestId,
    timestamp: Date.now()
  }];

  if (isProcessingRequest) {
    console.log(`[Hov3x Background] WebLLM busy, queued latest request. Will process after current completes (ID: ${requestId})`);

    // TIMEOUT LOGIC: Set timeout to abandon current request if it takes too long
    if (currentProcessingTimeout) {
      clearTimeout(currentProcessingTimeout);
    }

    currentProcessingTimeout = setTimeout(() => {
      if (activeStreamingRequest && !activeStreamingRequest.cancelled) {
        console.log(`[Hov3x Background] ⏱️ TIMEOUT: Abandoning slow request (ID: ${activeStreamingRequest.requestId})`);
        abandonedRequests.add(activeStreamingRequest.requestId);
        activeStreamingRequest.abandoned = true;
        activeStreamingRequest.cancelled = true; // Also mark as cancelled to stop sending updates
      }
      currentProcessingTimeout = null;
    }, ABANDON_TIMEOUT_MS);

    console.log(`[Hov3x Background] ⏱️ Set ${ABANDON_TIMEOUT_MS}ms timeout for current request`);
  } else {
    console.log(`[Hov3x Background] WebLLM ready, processing immediately (ID: ${requestId})`);
    processNextRequest();
  }
}

async function processNextRequest() {
  // If already processing, return (will be called again when current finishes)
  if (isProcessingRequest) {
    console.log(`[Hov3x Background] Already processing, skipping`);
    return;
  }

  // If queue is empty, nothing to do
  if (requestQueue.length === 0) {
    console.log(`[Hov3x Background] Queue empty, nothing to process`);
    return;
  }

  // Clear any existing timeout since we're starting a new request
  if (currentProcessingTimeout) {
    clearTimeout(currentProcessingTimeout);
    currentProcessingTimeout = null;
  }

  // Get the next request and mark as processing
  const request = requestQueue[0];
  isProcessingRequest = true;

  console.log(`[Hov3x Background] Starting to process request for: "${request.term}" (ID: ${request.requestId})`);

  try {
    await handleExplanationRequestStreaming(request.term, request.tabId, request.requestId);
  } catch (error) {
    console.error(`[Hov3x Background] Error processing request:`, error);
    // Send error to content script
    safeSendMessage(request.tabId, {
      action: "streamError",
      error: error.message || "Failed to generate explanation",
      requestId: request.requestId
    });
  } finally {
    // CRITICAL FIX: Only remove if this request is still at the front of the queue
    // (queue might have been replaced with a new request while we were processing)
    if (requestQueue.length > 0 && requestQueue[0].requestId === request.requestId) {
      console.log(`[Hov3x Background] Removing completed request from queue (ID: ${request.requestId})`);
      requestQueue.shift();
    } else {
      console.log(`[Hov3x Background] Request was replaced while processing, queue already updated`);
    }

    isProcessingRequest = false;

    console.log(`[Hov3x Background] Finished processing. Queue length: ${requestQueue.length}`);

    // Process next request if any
    if (requestQueue.length > 0) {
      console.log(`[Hov3x Background] Processing next queued request...`);
      // Use setTimeout to avoid deep recursion and give other tasks a chance
      setTimeout(() => processNextRequest(), 0);
    }
  }
}

// ============================================
// Main Handler: Get Explanation (Streaming)
// ============================================
async function handleExplanationRequestStreaming(term, tabId, requestId) {
  console.log(`[Hov3x Background] Handling streaming request for term: "${term}" (ID: ${requestId})`);

  // Cancel any active streaming request
  if (activeStreamingRequest) {
    console.log(`[Hov3x Background] Cancelling previous request: ${activeStreamingRequest.requestId}`);
    activeStreamingRequest.cancelled = true;
  }

  // Create new request tracker
  const requestTracker = {
    requestId: requestId,
    cancelled: false
  };
  activeStreamingRequest = requestTracker;

  try {
    // Check if service is enabled
    const serviceState = await chrome.storage.local.get(['serviceEnabled']);
    const serviceEnabled = serviceState.serviceEnabled !== undefined ? serviceState.serviceEnabled : true;

    if (!serviceEnabled) {
      console.log(`[Hov3x Background] Service is disabled, ignoring request`);
      if (!requestTracker.cancelled) {
        safeSendMessage(tabId, {
          action: "streamError",
          error: "Service is disabled",
          requestId: requestId
        });
      }
      return;
    }

    // Check cache first
    const cached = await getCachedExplanation(term);
    if (cached) {
      console.log(`[Hov3x Background] Cache hit for: "${term}"`);
      if (!requestTracker.cancelled) {
        safeSendMessage(tabId, {
          action: "streamComplete",
          explanation: cached.text,
          cached: true,
          requestId: requestId
        });
      }
      return;
    }

    console.log(`[Hov3x Background] Cache miss for: "${term}". Generating with streaming...`);

    // Check if cancelled before generation
    if (requestTracker.cancelled) {
      console.log(`[Hov3x Background] Request cancelled before generation (ID: ${requestId})`);
      return;
    }

    let fullExplanation;
    const phi2Ready = isEngineReady();

    // Use Gemini as fallback if Phi-2 is not ready yet
    if (!phi2Ready) {
      console.log(`[Hov3x Background] Phi-2 not ready, using Gemini API as fallback...`);

      // Notify user we're using Gemini (optional)
      if (!requestTracker.cancelled) {
        safeSendMessage(tabId, {
          action: "streamChunk",
          text: "Loading...",
          requestId: requestId
        });
      }

      // Generate explanation with Gemini streaming
      fullExplanation = await generateExplanationStreamingGemini(
        term,
        (partialText) => {
          // Only send chunks if not cancelled
          if (!requestTracker.cancelled) {
            safeSendMessage(tabId, {
              action: "streamChunk",
              text: partialText,
              requestId: requestId
            });
          }
        },
        () => requestTracker.cancelled // Pass cancellation check function
      );

      console.log(`[Hov3x Background] Gemini generation complete for: "${term}"`);
    } else {
      console.log(`[Hov3x Background] Phi-2 ready, using local model...`);

      // Generate explanation with Phi-2 streaming
      fullExplanation = await generateExplanationStreaming(
        term,
        (partialText) => {
          // Only send chunks if not cancelled
          if (!requestTracker.cancelled) {
            safeSendMessage(tabId, {
              action: "streamChunk",
              text: partialText,
              requestId: requestId
            });
          }
        },
        (progress) => {
          console.log(`[Hov3x Background] Generation progress: ${progress.text}`);
        },
        () => requestTracker.cancelled // Pass cancellation check function
      );

      console.log(`[Hov3x Background] Phi-2 generation complete for: "${term}"`);
    }

    // Check if cancelled or abandoned before caching
    const wasAbandoned = abandonedRequests.has(requestId);

    if (requestTracker.cancelled || requestTracker.abandoned || wasAbandoned) {
      const reason = wasAbandoned ? 'abandoned (timeout)' : 'cancelled';
      console.log(`[Hov3x Background] ⏱️ Request ${reason}, not caching (ID: ${requestId})`);

      // Clean up abandoned request tracking
      if (wasAbandoned) {
        abandonedRequests.delete(requestId);
      }

      return;
    }

    // Cache the result (only for successful, non-abandoned requests)
    await cacheExplanation(term, fullExplanation);

    // Send completion message only if not cancelled
    if (!requestTracker.cancelled && !requestTracker.abandoned) {
      safeSendMessage(tabId, {
        action: "streamComplete",
        explanation: fullExplanation,
        cached: false,
        requestId: requestId
      });
    }

    console.log(`[Hov3x Background] Successfully generated and cached: "${term}" (ID: ${requestId})`);

  } catch (error) {
    console.error(`[Hov3x Background] Error in streaming explanation:`, error);
    // Only send error if not cancelled
    if (!requestTracker.cancelled) {
      safeSendMessage(tabId, {
        action: "streamError",
        error: error.message || "Failed to generate explanation",
        requestId: requestId
      });
    }
  } finally {
    // Clear active request if this was the active one
    if (activeStreamingRequest === requestTracker) {
      activeStreamingRequest = null;
    }
  }
}

// ============================================
// Main Handler: Get Explanation (Non-streaming fallback)
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
