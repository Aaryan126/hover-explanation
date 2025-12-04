// ============================================
// Hov3x WebLLM Service
// Handles local LLM inference using WebLLM
// ============================================

import * as webllm from "@mlc-ai/web-llm";

// Configuration
const MODEL_ID = "phi-2-q4f32_1-MLC"; // Phi-2 model (lowercase, ~1.2GB)
const MAX_TOKENS = 300;
const TEMPERATURE = 0.7;

// State management
let engine = null;
let isInitializing = false;
let isReady = false;

// ============================================
// Initialize WebLLM Engine
// ============================================
async function initializeEngine(progressCallback) {
  if (isReady && engine) {
    console.log("[WebLLM] Engine already initialized");
    return engine;
  }

  if (isInitializing) {
    console.log("[WebLLM] Engine initialization already in progress");
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return engine;
  }

  try {
    isInitializing = true;
    console.log(`[WebLLM] Initializing engine with model: ${MODEL_ID}`);

    // Create engine with progress callback
    engine = await webllm.CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (progress) => {
        console.log(`[WebLLM] Loading progress: ${progress.text}`);
        if (progressCallback) {
          progressCallback(progress);
        }
      }
    });

    isReady = true;
    isInitializing = false;
    console.log("[WebLLM] Engine initialized successfully");
    return engine;

  } catch (error) {
    isInitializing = false;
    isReady = false;
    console.error("[WebLLM] Failed to initialize engine:", error);
    throw new Error(`WebLLM initialization failed: ${error.message}`);
  }
}

// ============================================
// Generate Explanation (Non-streaming)
// ============================================
async function generateExplanation(term, progressCallback) {
  try {
    // Initialize engine if not ready
    if (!isReady) {
      await initializeEngine(progressCallback);
    }

    console.log(`[WebLLM] Generating explanation for: "${term}"`);

    // Create prompt
    const prompt = `Explain this technical term in 1-2 simple, clear sentences: "${term}"`;

    // Generate response
    const response = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that explains technical terms clearly and concisely." },
        { role: "user", content: prompt }
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    // Extract text from response
    if (response.choices && response.choices[0]) {
      const text = response.choices[0].message.content;
      console.log(`[WebLLM] Generated explanation: "${text}"`);
      return text.trim();
    }

    throw new Error("No response from WebLLM");

  } catch (error) {
    console.error("[WebLLM] Error generating explanation:", error);
    throw error;
  }
}

// ============================================
// Generate Explanation with Streaming
// ============================================
async function generateExplanationStreaming(term, streamCallback, progressCallback) {
  try {
    // Initialize engine if not ready
    if (!isReady) {
      await initializeEngine(progressCallback);
    }

    console.log(`[WebLLM] Generating streaming explanation for: "${term}"`);

    // Create prompt
    const prompt = `Explain this technical term in 1-2 simple, clear sentences: "${term}"`;

    // Generate streaming response
    const stream = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that explains technical terms clearly and concisely." },
        { role: "user", content: prompt }
      ],
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
      stream: true, // Enable streaming
    });

    let fullText = "";

    // Process stream chunks
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        fullText += delta;
        // Call callback with partial text
        if (streamCallback) {
          streamCallback(fullText);
        }
      }
    }

    console.log(`[WebLLM] Streaming complete: "${fullText}"`);
    return fullText.trim();

  } catch (error) {
    console.error("[WebLLM] Error generating streaming explanation:", error);
    throw error;
  }
}

// ============================================
// Check if Engine is Ready
// ============================================
function isEngineReady() {
  return isReady;
}

// ============================================
// Get Initialization Status
// ============================================
function getInitStatus() {
  return {
    isReady,
    isInitializing
  };
}

// ============================================
// Reset Engine (for cleanup/reload)
// ============================================
async function resetEngine() {
  try {
    if (engine) {
      console.log("[WebLLM] Resetting engine");
      // WebLLM doesn't have explicit cleanup, just reset state
      engine = null;
      isReady = false;
      isInitializing = false;
      console.log("[WebLLM] Engine reset complete");
    }
  } catch (error) {
    console.error("[WebLLM] Error resetting engine:", error);
  }
}

// ============================================
// Exports
// ============================================
export {
  initializeEngine,
  generateExplanation,
  generateExplanationStreaming,
  isEngineReady,
  getInitStatus,
  resetEngine
};
