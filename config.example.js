// ============================================
// Hov3x Configuration Template
// This is a template file - copy it to create your own config.js
// ============================================

// SETUP INSTRUCTIONS:
// 1. Copy this file and rename it to "config.js"
// 2. Get your Gemini API key from: https://makersuite.google.com/app/apikey
// 3. Replace "YOUR_API_KEY_HERE" with your actual API key
// 4. Save config.js (it will be ignored by git)

const CONFIG = {
  GEMINI_API_KEY: "YOUR_API_KEY_HERE"
};

// Export for use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
