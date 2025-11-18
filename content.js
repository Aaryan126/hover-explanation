// ============================================
// Hov3x Content Script
// Detects text selection and manages tooltip
// ============================================

console.log("[Hov3x Content] Content script loaded");

// Configuration
const SELECTION_DELAY_MS = 300;
const MIN_WORD_LENGTH = 3;
const MAX_SELECTION_LENGTH = 100; // Limit selection to reasonable length

// State management
let selectionTimeout = null;
let currentSelection = null;
let tooltip = null;
let isTooltipActive = false;
let currentTheme = 'dark'; // 'dark' or 'light'

// Pending requests to prevent spam
let pendingRequests = new Set();

// ============================================
// Initialize Tooltip
// ============================================
function initializeTooltip() {
  if (tooltip) return;

  // Create tooltip container
  tooltip = document.createElement('div');
  tooltip.id = 'hov3x-tooltip';
  tooltip.className = 'hov3x-tooltip-hidden';
  document.body.appendChild(tooltip);

  // Apply current theme
  applyTheme();

  console.log("[Hov3x Content] Tooltip initialized");
}

// ============================================
// Event Listeners
// ============================================
document.addEventListener('mouseup', handleSelection);
document.addEventListener('selectionchange', handleSelectionChange);
document.addEventListener('keydown', handleKeyboardShortcut);

// Listen for theme changes from storage (when toggled from popup)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.tooltipTheme) {
    currentTheme = changes.tooltipTheme.newValue;
    console.log(`[Hov3x Content] Theme changed from ${changes.tooltipTheme.oldValue} to: ${currentTheme}`);

    // Apply theme immediately if tooltip exists
    if (tooltip) {
      applyTheme();
      console.log(`[Hov3x Content] Theme applied, tooltip classes: ${tooltip.className}`);
    } else {
      console.log(`[Hov3x Content] Tooltip doesn't exist yet, will apply on creation`);
    }
  }
});

// ============================================
// Load Theme from Storage
// ============================================
chrome.storage.local.get(['tooltipTheme'], (result) => {
  if (result.tooltipTheme) {
    currentTheme = result.tooltipTheme;
    console.log(`[Hov3x Content] Loaded theme: ${currentTheme}`);
  }
});

// ============================================
// Keyboard Shortcut Handler (Alt+T to toggle theme)
// ============================================
function handleKeyboardShortcut(event) {
  // Alt+T to toggle theme
  if (event.altKey && event.key.toLowerCase() === 't') {
    event.preventDefault();
    toggleTheme();
  }
}

// ============================================
// Toggle Theme
// ============================================
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';

  // Save to storage
  chrome.storage.local.set({ tooltipTheme: currentTheme });

  // Update tooltip if it exists
  if (tooltip) {
    applyTheme();
  }

  console.log(`[Hov3x Content] Theme toggled to: ${currentTheme}`);

  // Show brief notification
  if (tooltip && isTooltipActive) {
    const currentText = tooltip.textContent;
    tooltip.textContent = `Theme: ${currentTheme === 'dark' ? 'Dark' : 'Light'}`;
    setTimeout(() => {
      tooltip.textContent = currentText;
    }, 800);
  }
}

// ============================================
// Apply Theme to Tooltip
// ============================================
function applyTheme() {
  if (!tooltip) {
    console.log('[Hov3x Content] Cannot apply theme - tooltip does not exist');
    return;
  }

  console.log(`[Hov3x Content] Applying theme: ${currentTheme}`);
  console.log(`[Hov3x Content] Tooltip classes before: ${tooltip.className}`);

  if (currentTheme === 'light') {
    tooltip.classList.add('hov3x-light-theme');
  } else {
    tooltip.classList.remove('hov3x-light-theme');
  }

  console.log(`[Hov3x Content] Tooltip classes after: ${tooltip.className}`);
}

// ============================================
// Selection Change Handler
// ============================================
function handleSelectionChange() {
  // Clear any existing timeout
  clearTimeout(selectionTimeout);

  // Set new selection timeout
  selectionTimeout = setTimeout(() => {
    processSelection();
  }, SELECTION_DELAY_MS);
}

// ============================================
// Mouse Up Handler (for immediate processing)
// ============================================
function handleSelection(event) {
  // Don't process if clicking inside tooltip
  if (event.target.closest('#hov3x-tooltip')) {
    return;
  }

  // Clear timeout and process immediately on mouseup
  clearTimeout(selectionTimeout);
  processSelection(event);
}

// ============================================
// Process Selection
// ============================================
function processSelection(event) {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Hide tooltip if no selection
  if (!selectedText) {
    hideTooltip();
    return;
  }

  // Validate selection length
  if (selectedText.length < MIN_WORD_LENGTH) {
    console.log(`[Hov3x Content] Selection too short: "${selectedText}"`);
    return;
  }

  if (selectedText.length > MAX_SELECTION_LENGTH) {
    console.log(`[Hov3x Content] Selection too long (${selectedText.length} chars)`);
    showTooltip("Selection too long. Please select fewer words.", getSelectionPosition());
    return;
  }

  // Ignore if same text is already being processed
  if (currentSelection === selectedText.toLowerCase()) {
    return;
  }

  // Clean the selected text (remove extra whitespace, newlines)
  const cleanedText = selectedText.replace(/\s+/g, ' ').trim();

  // Process the selection
  handleTextSelection(cleanedText, selection);
}

// ============================================
// Get Selection Position
// ============================================
function getSelectionPosition() {
  const selection = window.getSelection();

  if (!selection.rangeCount) {
    return { x: 0, y: 0 };
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    x: rect.left + (rect.width / 2),
    y: rect.bottom
  };
}

// ============================================
// Handle Text Selection
// ============================================
async function handleTextSelection(text, selection) {
  console.log(`[Hov3x Content] Selected text: "${text}"`);

  // Prevent duplicate requests
  if (pendingRequests.has(text.toLowerCase())) {
    console.log(`[Hov3x Content] Request already pending for: "${text}"`);
    return;
  }

  // Initialize tooltip if needed
  initializeTooltip();

  // Get selection position
  const position = getSelectionPosition();

  // Show loading state
  showTooltip("Loading...", position);

  // Mark as pending
  pendingRequests.add(text.toLowerCase());
  currentSelection = text.toLowerCase();

  try {
    // Request explanation from background script
    const response = await chrome.runtime.sendMessage({
      action: "getExplanation",
      term: text
    });

    // Remove from pending
    pendingRequests.delete(text.toLowerCase());

    if (response.success) {
      const explanation = response.explanation;
      const cacheStatus = response.cached ? " (cached)" : "";
      console.log(`[Hov3x Content] Received explanation${cacheStatus}: "${explanation}"`);

      // Update tooltip with explanation
      updateTooltip(explanation);
    } else {
      console.error(`[Hov3x Content] Error getting explanation:`, response.error);
      updateTooltip(`Error: ${response.error}`);
    }

  } catch (error) {
    console.error(`[Hov3x Content] Failed to get explanation:`, error);
    pendingRequests.delete(text.toLowerCase());

    // Check if extension context was invalidated
    if (error.message && error.message.includes("Extension context invalidated")) {
      updateTooltip("Extension reloaded. Please refresh this page.");
    } else {
      updateTooltip("Failed to load explanation");
    }
  }
}

// ============================================
// Tooltip Display Functions
// ============================================

function showTooltip(text, position) {
  if (!tooltip) return;

  tooltip.textContent = text;

  // Remove hidden class and add visible class, preserving theme class
  tooltip.classList.remove('hov3x-tooltip-hidden');
  tooltip.classList.add('hov3x-tooltip-visible');

  positionTooltip(position);
  isTooltipActive = true;

  console.log(`[Hov3x Content] Tooltip shown at (${position.x}, ${position.y})`);
}

function updateTooltip(text) {
  if (!tooltip) return;

  tooltip.textContent = text;

  // Re-position in case content size changed
  const position = getSelectionPosition();
  positionTooltip(position);

  console.log(`[Hov3x Content] Tooltip updated`);
}

function hideTooltip() {
  if (!tooltip) return;

  // Remove visible class and add hidden class, preserving theme class
  tooltip.classList.remove('hov3x-tooltip-visible');
  tooltip.classList.add('hov3x-tooltip-hidden');

  isTooltipActive = false;
  currentSelection = null;

  console.log(`[Hov3x Content] Tooltip hidden`);
}

function positionTooltip(position) {
  if (!tooltip) return;

  const offset = 10;
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  let left = position.x + scrollX;
  let top = position.y + scrollY + offset;

  // Get tooltip dimensions
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Center tooltip horizontally on selection
  left = left - (tooltipRect.width / 2);

  // Adjust if tooltip goes off-screen (right edge)
  if (left + tooltipRect.width > scrollX + viewportWidth) {
    left = scrollX + viewportWidth - tooltipRect.width - offset;
  }

  // Adjust if tooltip goes off-screen (left edge)
  if (left < scrollX) {
    left = scrollX + offset;
  }

  // Adjust if tooltip goes off-screen (bottom edge)
  if (position.y + tooltipRect.height + offset > viewportHeight) {
    top = position.y + scrollY - tooltipRect.height - offset;
  }

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

// ============================================
// Cleanup on unload
// ============================================
window.addEventListener('beforeunload', () => {
  if (tooltip && tooltip.parentNode) {
    tooltip.parentNode.removeChild(tooltip);
  }
});

console.log("[Hov3x Content] Selection event listeners registered");
