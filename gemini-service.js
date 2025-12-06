// ============================================
// Hov3x Gemini Service
// Handles Gemini API inference (fallback before WebLLM is ready)
// ============================================

// Configuration
const GEMINI_API_KEY = "AIzaSyBQbur7BspRkLLDvtv3vpj2FVKWiqDEF0U";
const GEMINI_MODEL = "gemini-2.0-flash";
const MAX_TOKENS = 150;
const TEMPERATURE = 0.7;
const ARTIFICIAL_STREAM_DELAY_MS = 150; // Delay between character chunks for artificial streaming

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

    // First, fetch the complete response from Gemini
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completeResponse = "";
    let buffer = "";

    // Read the entire response
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Extract complete JSON objects
      let startIdx = 0;

      while (true) {
        const objStart = buffer.indexOf('{', startIdx);
        if (objStart === -1) break;

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

        if (objEnd !== -1) {
          const jsonStr = buffer.substring(objStart, objEnd);

          try {
            const json = JSON.parse(jsonStr);

            if (json.candidates && json.candidates[0]?.content?.parts) {
              for (const part of json.candidates[0].content.parts) {
                if (part.text) {
                  completeResponse += part.text;
                }
              }
            }
          } catch (parseError) {
            console.warn(`[Gemini] Parse error:`, parseError.message);
          }

          buffer = buffer.substring(objEnd);
          startIdx = 0;
        } else {
          break;
        }
      }
    }

    // Check if cancelled after fetching
    if (isCancelledFn && isCancelledFn()) {
      console.log(`[Gemini] Request cancelled after fetch for: "${term}"`);
      return completeResponse.trim();
    }

    // Now artificially stream the response character-by-character
    console.log(`[Gemini] Starting artificial streaming for: "${term}"`);
    const chunkSize = 5; // Send 3 characters at a time for smoother effect
    let streamedText = "";

    for (let i = 0; i < completeResponse.length; i += chunkSize) {
      // Check if cancelled during artificial streaming
      if (isCancelledFn && isCancelledFn()) {
        console.log(`[Gemini] Request cancelled during artificial streaming for: "${term}"`);
        return streamedText.trim();
      }

      // Get next chunk
      streamedText = completeResponse.substring(0, i + chunkSize);

      // Send update
      if (streamCallback) {
        streamCallback(streamedText);
      }

      // Wait before next chunk
      await new Promise(resolve => setTimeout(resolve, ARTIFICIAL_STREAM_DELAY_MS));
    }

    // Send final complete text
    if (streamCallback && streamedText !== completeResponse) {
      streamCallback(completeResponse);
    }

    console.log(`[Gemini] Streaming complete: "${completeResponse}"`);
    return completeResponse.trim();

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
