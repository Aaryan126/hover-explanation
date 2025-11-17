// ============================================
// Hov3x Popup Script
// Manages popup UI and interactions
// ============================================

console.log("[Hov3x Popup] Popup script loaded");

// DOM elements
const cachedCountEl = document.getElementById('cached-count');
const cacheSizeEl = document.getElementById('cache-size');
const refreshStatsBtn = document.getElementById('refresh-stats');
const clearCacheBtn = document.getElementById('clear-cache');
const statusMessageEl = document.getElementById('status-message');
const apiKeyStatusEl = document.getElementById('api-key-status');

// ============================================
// Initialize Popup
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("[Hov3x Popup] DOM loaded, initializing...");
  loadCacheStats();
  checkApiKeyStatus();
});

// ============================================
// Event Listeners
// ============================================
refreshStatsBtn.addEventListener('click', () => {
  console.log("[Hov3x Popup] Refresh stats clicked");
  loadCacheStats();
});

clearCacheBtn.addEventListener('click', () => {
  console.log("[Hov3x Popup] Clear cache clicked");
  clearCache();
});

// ============================================
// Load Cache Statistics
// ============================================
async function loadCacheStats() {
  try {
    setLoading(true);
    showStatus("Loading statistics...", "info");

    const response = await chrome.runtime.sendMessage({
      action: "getCacheStats"
    });

    if (response.success) {
      const stats = response.stats;
      cachedCountEl.textContent = stats.totalCached;

      // Calculate approximate storage size
      const approxSize = calculateStorageSize(stats.totalCached);
      cacheSizeEl.textContent = approxSize;

      showStatus(`Found ${stats.totalCached} cached terms`, "success");
      console.log("[Hov3x Popup] Cache stats loaded:", stats);
    } else {
      showStatus("Failed to load statistics", "error");
      console.error("[Hov3x Popup] Error loading stats:", response.error);
    }

  } catch (error) {
    console.error("[Hov3x Popup] Error loading cache stats:", error);
    showStatus("Error loading statistics", "error");
  } finally {
    setLoading(false);
  }
}

// ============================================
// Clear Cache
// ============================================
async function clearCache() {
  if (!confirm("Are you sure you want to clear all cached explanations?")) {
    return;
  }

  try {
    setLoading(true);
    showStatus("Clearing cache...", "info");

    const response = await chrome.runtime.sendMessage({
      action: "clearCache"
    });

    if (response.success) {
      showStatus(`Cleared ${response.cleared} cached terms`, "success");
      console.log(`[Hov3x Popup] Cleared ${response.cleared} items`);

      // Refresh stats
      setTimeout(() => {
        loadCacheStats();
      }, 500);
    } else {
      showStatus("Failed to clear cache", "error");
      console.error("[Hov3x Popup] Error clearing cache:", response.error);
    }

  } catch (error) {
    console.error("[Hov3x Popup] Error clearing cache:", error);
    showStatus("Error clearing cache", "error");
  } finally {
    setLoading(false);
  }
}

// ============================================
// Check API Key Status
// ============================================
async function checkApiKeyStatus() {
  // This is a simple check - we can't directly access background.js variables
  // So we'll infer from the ability to make requests
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getCacheStats"
    });

    // If we can communicate with background, assume it's loaded
    // In a real scenario, background.js could expose an API key check endpoint
    apiKeyStatusEl.textContent = "API Key: Check background.js";
    apiKeyStatusEl.className = "api-key-status";

  } catch (error) {
    apiKeyStatusEl.textContent = "API Key: Unable to verify";
    apiKeyStatusEl.className = "api-key-status";
  }
}

// ============================================
// UI Helper Functions
// ============================================

function showStatus(message, type = "info") {
  statusMessageEl.textContent = message;
  statusMessageEl.className = `status ${type}`;
}

function setLoading(isLoading) {
  const content = document.querySelector('.content');
  if (isLoading) {
    content.classList.add('loading');
  } else {
    content.classList.remove('loading');
  }
}

function calculateStorageSize(itemCount) {
  // Rough estimate: each cached item is ~200-400 bytes
  const avgBytesPerItem = 300;
  const totalBytes = itemCount * avgBytesPerItem;

  if (totalBytes < 1024) {
    return `${totalBytes} B`;
  } else if (totalBytes < 1024 * 1024) {
    return `${(totalBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

console.log("[Hov3x Popup] Event listeners registered");
