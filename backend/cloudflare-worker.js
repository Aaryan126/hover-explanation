// ============================================
// Hov3x Cloudflare Worker - Secure API Proxy
// Hides Gemini API key from extension users
// ============================================

// SETUP INSTRUCTIONS:
// 1. Go to https://dash.cloudflare.com/
// 2. Create a free account
// 3. Go to Workers & Pages
// 4. Create new Worker
// 5. Paste this code
// 6. Add your GEMINI_API_KEY as environment variable (secret)
// 7. Deploy and copy the worker URL

// Environment variables (set in Cloudflare Dashboard):
// - GEMINI_API_KEY: Your Gemini API key
// - ALLOWED_ORIGINS: Optional comma-separated list of allowed origins

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 10,  // Per IP address
  MAX_REQUESTS_PER_HOUR: 100,   // Per IP address
  BAN_DURATION_MINUTES: 60      // How long to ban abusive IPs
};

// Cache configuration
const CACHE_TTL_SECONDS = 86400; // 24 hours

// ============================================
// Main Request Handler
// ============================================
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

    // Check rate limit
    const rateLimitResult = await checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      return jsonResponse({
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      }, 429);
    }

    // Parse request body
    const body = await request.json();
    const { term } = body;

    // Validate input
    if (!term || typeof term !== 'string') {
      return jsonResponse({ error: 'Invalid term parameter' }, 400);
    }

    // Sanitize and validate term length
    const sanitizedTerm = term.trim();
    if (sanitizedTerm.length < 1 || sanitizedTerm.length > 100) {
      return jsonResponse({ error: 'Term must be between 1 and 100 characters' }, 400);
    }

    // Check cache first
    const cacheKey = `explanation:${sanitizedTerm.toLowerCase()}`;
    const cachedResponse = await getFromCache(cacheKey);
    if (cachedResponse) {
      return jsonResponse({
        success: true,
        explanation: cachedResponse,
        cached: true
      });
    }

    // Get API key from environment
    const apiKey = GEMINI_API_KEY; // Will be set as environment variable
    if (!apiKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    // Call Gemini API
    const explanation = await fetchGeminiExplanation(sanitizedTerm, apiKey);

    // Cache the result
    await saveToCache(cacheKey, explanation);

    // Increment rate limit counter
    await incrementRateLimit(clientIP);

    // Return success response
    return jsonResponse({
      success: true,
      explanation: explanation,
      cached: false
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return jsonResponse({
      error: error.message || 'Internal server error'
    }, 500);
  }
}

// ============================================
// Gemini API Call
// ============================================
async function fetchGeminiExplanation(term, apiKey) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `Explain this technical term in 1-2 simple, clear sentences: "${term}"`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 300,
      candidateCount: 1,
      stopSequences: []
    }
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract text from response
  if (data.candidates && data.candidates[0]) {
    const candidate = data.candidates[0];

    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      const text = candidate.content.parts[0].text;
      if (text) {
        return text.trim();
      }
    }

    throw new Error(`No text content in response. Finish reason: ${candidate.finishReason}`);
  }

  throw new Error('Invalid response format from Gemini API');
}

// ============================================
// Cache Functions (Cloudflare KV - Optional)
// ============================================
// Note: Requires KV namespace binding. For basic setup, return null.
async function getFromCache(key) {
  try {
    // If you set up Cloudflare KV:
    // return await CACHE.get(key, { type: 'text' });

    // For now, no caching (extension handles it)
    return null;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

async function saveToCache(key, value) {
  try {
    // If you set up Cloudflare KV:
    // await CACHE.put(key, value, { expirationTtl: CACHE_TTL_SECONDS });

    // For now, skip caching
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

// ============================================
// Rate Limiting (In-Memory - Basic)
// ============================================
// Note: For production, use Cloudflare Durable Objects or KV
const rateLimitStore = new Map();

async function checkRateLimit(ip) {
  const now = Date.now();
  const minuteKey = `${ip}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `${ip}:hour:${Math.floor(now / 3600000)}`;
  const banKey = `${ip}:banned`;

  // Check if IP is banned
  const banExpiry = rateLimitStore.get(banKey);
  if (banExpiry && now < banExpiry) {
    return {
      allowed: false,
      retryAfter: Math.ceil((banExpiry - now) / 1000)
    };
  }

  // Get current counts
  const minuteCount = rateLimitStore.get(minuteKey) || 0;
  const hourCount = rateLimitStore.get(hourKey) || 0;

  // Check limits
  if (minuteCount >= RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    // Ban for repeated violations
    const banUntil = now + (RATE_LIMIT.BAN_DURATION_MINUTES * 60000);
    rateLimitStore.set(banKey, banUntil);

    return {
      allowed: false,
      retryAfter: 60
    };
  }

  if (hourCount >= RATE_LIMIT.MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      retryAfter: 3600
    };
  }

  return { allowed: true };
}

async function incrementRateLimit(ip) {
  const now = Date.now();
  const minuteKey = `${ip}:minute:${Math.floor(now / 60000)}`;
  const hourKey = `${ip}:hour:${Math.floor(now / 3600000)}`;

  rateLimitStore.set(minuteKey, (rateLimitStore.get(minuteKey) || 0) + 1);
  rateLimitStore.set(hourKey, (rateLimitStore.get(hourKey) || 0) + 1);

  // Clean up old entries (simple cleanup)
  if (Math.random() < 0.01) { // 1% chance to clean
    cleanupRateLimitStore();
  }
}

function cleanupRateLimitStore() {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  for (const [key, value] of rateLimitStore.entries()) {
    // Remove expired bans
    if (key.includes(':banned') && value < now) {
      rateLimitStore.delete(key);
    }
    // Remove old minute counters
    if (key.includes(':minute')) {
      const timestamp = parseInt(key.split(':')[2]) * 60000;
      if (timestamp < oneHourAgo) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// ============================================
// CORS Handling
// ============================================
function handleCORS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*', // Change to specific origin in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // Change to specific origin in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// ============================================
// Health Check Endpoint
// ============================================
// You can add GET / for health checks if needed
