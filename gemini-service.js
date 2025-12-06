// ============================================
// Hov3x Gemini Service
// Handles Gemini API inference (fallback before WebLLM is ready)
// ============================================

// Configuration
const GEMINI_API_KEY = "AIzaSyBQbur7BspRkLLDvtv3vpj2FVKWiqDEF0U";
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_TOKENS = 150;
const TEMPERATURE = 0.7;
const STREAM_THROTTLE_MS = 50; // Throttle stream updates for smoother display

// ============================================
// Generate Explanation with Streaming
// ============================================
async function generateExplanationStreaming(term, streamCallback, isCancelledFn) {
  try {
    console.log(`[Gemini] Generating streaming explanation for: "${term}"`);

    // Check if cancelled before starting
    if (isCancelledFn && isCancelledFn()) {
      console.log(`[Gemini] Request cancelled before generation started for: "${term}"`);
      return "";
    }

    // Create prompt - shorter for faster generation
    const prompt = `Explain "${term}" in 1-2 clear sentences.`;

    // Construct API URL for streaming
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?key=${GEMINI_API_KEY}`;

    // Request body
    const requestBody = {
      contents: [{
        parts: [{
          text: `You are a helpful assistant that explains technical terms clearly and concisely.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: MAX_TOKENS,
      }
    };

    // Fetch with streaming
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini] API Error Response:`, errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    // Process streaming response (array of JSON objects separated by commas)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let lastUpdateTime = 0;
    let pendingUpdate = false;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Try to extract complete JSON objects from buffer
      // Gemini streams as: [{...}, {...}, ...]
      // We need to find complete objects between commas
      let startIdx = 0;

      while (true) {
        // Find the start of a JSON object
        const objStart = buffer.indexOf('{', startIdx);
        if (objStart === -1) break;

        // Try to find the matching closing brace
        let braceCount = 0;
        let objEnd = -1;

        for (let i = objStart; i < buffer.length; i++) {
          if (buffer[i] === '{') braceCount++;
          if (buffer[i] === '}') braceCount--;

          if (braceCount === 0) {
            objEnd = i + 1;
            break;
          }
        }

        // If we found a complete object
        if (objEnd !== -1) {
          const jsonStr = buffer.substring(objStart, objEnd);

          try {
            const json = JSON.parse(jsonStr);

            // Extract text from response
            if (json.candidates && json.candidates[0]?.content?.parts) {
              for (const part of json.candidates[0].content.parts) {
                if (part.text) {
                  fullText += part.text;

                  // Only send updates if not cancelled
                  if (!isCancelledFn || !isCancelledFn()) {
                    // Throttle updates for smoother display
                    const now = Date.now();
                    if (now - lastUpdateTime >= STREAM_THROTTLE_MS) {
                      if (streamCallback) {
                        streamCallback(fullText);
                      }
                      lastUpdateTime = now;
                      pendingUpdate = false;
                    } else {
                      pendingUpdate = true;
                    }
                  } else {
                    // Request was cancelled, stop processing
                    pendingUpdate = false;
                    console.log(`[Gemini] Request cancelled during streaming for: "${term}"`);
                    return fullText.trim();
                  }
                }
              }
            }
          } catch (parseError) {
            // Skip invalid JSON
            console.warn(`[Gemini] Parse error:`, parseError.message);
          }

          // Move past this object
          startIdx = objEnd;

          // Remove processed part from buffer
          buffer = buffer.substring(objEnd);
          startIdx = 0;
        } else {
          // No complete object found, wait for more data
          break;
        }
      }
    }

    // Check if cancelled before final update
    if (isCancelledFn && isCancelledFn()) {
      console.log(`[Gemini] Request cancelled, discarding result for: "${term}"`);
      return fullText.trim();
    }

    // Send final update if there's a pending one
    if (pendingUpdate && streamCallback) {
      streamCallback(fullText);
    }

    console.log(`[Gemini] Streaming complete: "${fullText}"`);
    return fullText.trim();

  } catch (error) {
    console.error("[Gemini] Error generating streaming explanation:", error);
    throw error;
  }
}

// ============================================
// Exports
// ============================================
export {
  generateExplanationStreaming
};
