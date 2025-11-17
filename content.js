// ============================================
// Hov3x Content Script
// Detects hover events and manages tooltip
// ============================================

console.log("[Hov3x Content] Content script loaded");

// Configuration
const HOVER_DELAY_MS = 200;
const MIN_WORD_LENGTH = 3;
const VALID_TAGS = ['P', 'SPAN', 'LI', 'TD', 'CODE', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

// State management
let hoverTimeout = null;
let currentWord = null;
let currentElement = null;
let tooltip = null;
let isTooltipActive = false;

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

  console.log("[Hov3x Content] Tooltip initialized");
}

// ============================================
// Event Listeners
// ============================================
document.addEventListener('mouseover', handleMouseOver);
document.addEventListener('mouseout', handleMouseOut);
document.addEventListener('mousemove', handleMouseMove);

// ============================================
// Mouse Over Handler
// ============================================
function handleMouseOver(event) {
  const element = event.target;

  // Check if element is valid for hover detection
  if (!isValidElement(element)) {
    return;
  }

  // Get word at cursor position
  const word = getWordAtCursor(element, event);

  if (!word || word.length < MIN_WORD_LENGTH) {
    return;
  }

  // Ignore if same word is already being processed
  if (currentWord === word.toLowerCase()) {
    return;
  }

  // Clear any existing timeout
  clearTimeout(hoverTimeout);

  // Set new hover timeout
  hoverTimeout = setTimeout(() => {
    handleWordHover(word, event);
  }, HOVER_DELAY_MS);

  currentWord = word.toLowerCase();
  currentElement = element;
}

// ============================================
// Mouse Out Handler
// ============================================
function handleMouseOut(event) {
  clearTimeout(hoverTimeout);

  // Hide tooltip if mouse leaves the element
  const relatedTarget = event.relatedTarget;

  if (!relatedTarget || (relatedTarget !== tooltip && !tooltip.contains(relatedTarget))) {
    hideTooltip();
  }
}

// ============================================
// Mouse Move Handler
// ============================================
let lastMouseX = 0;
let lastMouseY = 0;

function handleMouseMove(event) {
  lastMouseX = event.clientX;
  lastMouseY = event.clientY;

  // Update tooltip position if active
  if (isTooltipActive && tooltip) {
    positionTooltip(event.clientX, event.clientY);
  }
}

// ============================================
// Validate Element
// ============================================
function isValidElement(element) {
  // Check if element tag is valid
  if (!VALID_TAGS.includes(element.tagName)) {
    return false;
  }

  // Ignore if inside tooltip itself
  if (element.closest('#hov3x-tooltip')) {
    return false;
  }

  // Ignore input fields, textareas, etc.
  if (element.isContentEditable || element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return false;
  }

  return true;
}

// ============================================
// Get Word at Cursor
// ============================================
function getWordAtCursor(element, event) {
  const text = element.textContent;

  if (!text || text.trim().length === 0) {
    return null;
  }

  // Simple word extraction: split by whitespace and punctuation
  const words = text.split(/[\s,;.!?()[\]{}""''<>\/\\|]+/);

  // Find the word under cursor (simplified approach)
  // In a production app, you'd use Range and Selection APIs for precise detection
  for (const word of words) {
    if (word.trim().length >= MIN_WORD_LENGTH) {
      // Return first valid word (simplified - in production, calculate position)
      return word.trim();
    }
  }

  return null;
}

// ============================================
// Handle Word Hover
// ============================================
async function handleWordHover(word, event) {
  console.log(`[Hov3x Content] Hovering over word: "${word}"`);

  // Prevent duplicate requests
  if (pendingRequests.has(word.toLowerCase())) {
    console.log(`[Hov3x Content] Request already pending for: "${word}"`);
    return;
  }

  // Initialize tooltip if needed
  initializeTooltip();

  // Show loading state
  showTooltip("Loading...", event.clientX, event.clientY);

  // Mark as pending
  pendingRequests.add(word.toLowerCase());

  try {
    // Request explanation from background script
    const response = await chrome.runtime.sendMessage({
      action: "getExplanation",
      term: word
    });

    // Remove from pending
    pendingRequests.delete(word.toLowerCase());

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
    pendingRequests.delete(word.toLowerCase());
    updateTooltip("Failed to load explanation");
  }
}

// ============================================
// Tooltip Display Functions
// ============================================

function showTooltip(text, x, y) {
  if (!tooltip) return;

  tooltip.textContent = text;
  tooltip.className = 'hov3x-tooltip-visible';
  positionTooltip(x, y);
  isTooltipActive = true;

  console.log(`[Hov3x Content] Tooltip shown at (${x}, ${y})`);
}

function updateTooltip(text) {
  if (!tooltip) return;

  tooltip.textContent = text;

  // Re-position in case content size changed
  positionTooltip(lastMouseX, lastMouseY);

  console.log(`[Hov3x Content] Tooltip updated`);
}

function hideTooltip() {
  if (!tooltip) return;

  tooltip.className = 'hov3x-tooltip-hidden';
  isTooltipActive = false;
  currentWord = null;
  currentElement = null;

  console.log(`[Hov3x Content] Tooltip hidden`);
}

function positionTooltip(x, y) {
  if (!tooltip) return;

  const offset = 15;
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;

  let left = x + scrollX + offset;
  let top = y + scrollY + offset;

  // Get tooltip dimensions
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Adjust if tooltip goes off-screen (right edge)
  if (x + tooltipRect.width + offset > viewportWidth) {
    left = x + scrollX - tooltipRect.width - offset;
  }

  // Adjust if tooltip goes off-screen (bottom edge)
  if (y + tooltipRect.height + offset > viewportHeight) {
    top = y + scrollY - tooltipRect.height - offset;
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

console.log("[Hov3x Content] Event listeners registered");
