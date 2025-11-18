// ============================================
// Hov3x Popup Script - Minimal UI
// Manages popup UI and interactions
// ============================================

console.log("[Hov3x Popup] Popup script loaded");

// DOM elements
const cachedCountEl = document.getElementById('cached-count');
const cacheSizeEl = document.getElementById('cache-size');
const clearCacheBtn = document.getElementById('clear-cache');
const themeToggle = document.getElementById('theme-toggle');
const serviceToggle = document.getElementById('service-toggle');

// ============================================
// Initialize Popup
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("[Hov3x Popup] DOM loaded, initializing...");
  loadCacheStats();
  loadCurrentTheme();
  loadServiceState();
});

// ============================================
// Event Listeners
// ============================================
clearCacheBtn.addEventListener('click', () => {
  console.log("[Hov3x Popup] Clear cache clicked");
  clearCache();
});

themeToggle.addEventListener('click', () => {
  console.log("[Hov3x Popup] Theme toggle clicked");
  toggleTheme();
});

serviceToggle.addEventListener('click', () => {
  console.log("[Hov3x Popup] Service toggle clicked");
  toggleService();
});

// ============================================
// Load Cache Statistics
// ============================================
async function loadCacheStats() {
  try {
    setLoading(true);

    const response = await chrome.runtime.sendMessage({
      action: "getCacheStats"
    });

    if (response.success) {
      const stats = response.stats;
      cachedCountEl.textContent = stats.totalCached;

      // Calculate approximate storage size
      const approxSize = calculateStorageSize(stats.totalCached);
      cacheSizeEl.textContent = approxSize;

      console.log("[Hov3x Popup] Cache stats loaded:", stats);
    } else {
      console.error("[Hov3x Popup] Error loading stats:", response.error);
    }

  } catch (error) {
    console.error("[Hov3x Popup] Error loading cache stats:", error);
  } finally {
    setLoading(false);
  }
}

// ============================================
// Clear Cache
// ============================================
async function clearCache() {
  if (!confirm("Clear all cached explanations?")) {
    return;
  }

  try {
    setLoading(true);

    const response = await chrome.runtime.sendMessage({
      action: "clearCache"
    });

    if (response.success) {
      console.log(`[Hov3x Popup] Cleared ${response.cleared} items`);

      // Refresh stats after clearing
      setTimeout(() => {
        loadCacheStats();
      }, 300);
    } else {
      console.error("[Hov3x Popup] Error clearing cache:", response.error);
    }

  } catch (error) {
    console.error("[Hov3x Popup] Error clearing cache:", error);
  } finally {
    setLoading(false);
  }
}

// ============================================
// UI Helper Functions
// ============================================

function setLoading(isLoading) {
  const container = document.querySelector('.container');
  if (isLoading) {
    container.classList.add('loading');
  } else {
    container.classList.remove('loading');
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

// ============================================
// Theme Management
// ============================================

async function loadCurrentTheme() {
  try {
    const result = await chrome.storage.local.get(['tooltipTheme']);
    const theme = result.tooltipTheme || 'light';
    applyTheme(theme);
  } catch (error) {
    console.error("[Hov3x Popup] Error loading theme:", error);
  }
}

async function toggleTheme() {
  try {
    const result = await chrome.storage.local.get(['tooltipTheme']);
    const currentTheme = result.tooltipTheme || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    await chrome.storage.local.set({ tooltipTheme: newTheme });
    applyTheme(newTheme);

    console.log(`[Hov3x Popup] Theme toggled to: ${newTheme}`);
  } catch (error) {
    console.error("[Hov3x Popup] Error toggling theme:", error);
  }
}

function applyTheme(theme) {
  const body = document.body;
  const toggle = document.getElementById('theme-toggle');

  if (theme === 'dark') {
    body.classList.add('dark');
    toggle.classList.add('active');
  } else {
    body.classList.remove('dark');
    toggle.classList.remove('active');
  }
}

// ============================================
// Service State Management
// ============================================

async function loadServiceState() {
  try {
    const result = await chrome.storage.local.get(['serviceEnabled']);
    const serviceEnabled = result.serviceEnabled !== undefined ? result.serviceEnabled : true;
    applyServiceState(serviceEnabled);
  } catch (error) {
    console.error("[Hov3x Popup] Error loading service state:", error);
  }
}

async function toggleService() {
  try {
    const result = await chrome.storage.local.get(['serviceEnabled']);
    const currentState = result.serviceEnabled !== undefined ? result.serviceEnabled : true;
    const newState = !currentState;

    await chrome.storage.local.set({ serviceEnabled: newState });
    applyServiceState(newState);

    console.log(`[Hov3x Popup] Service ${newState ? 'enabled' : 'disabled'}`);
  } catch (error) {
    console.error("[Hov3x Popup] Error toggling service:", error);
  }
}

function applyServiceState(enabled) {
  const toggle = document.getElementById('service-toggle');

  if (enabled) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

console.log("[Hov3x Popup] Event listeners registered");
