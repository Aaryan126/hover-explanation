# Hov3x Backend - Cloudflare Worker

This folder contains the backend proxy server that securely handles API requests.

## Purpose

The Cloudflare Worker acts as a secure proxy between the Chrome extension and Google's Gemini API, protecting your API key from being exposed to users.

## Architecture

```
Chrome Extension → Cloudflare Worker → Google Gemini API
                         ↑
                   (API key stored here securely)
```

## Files

- **`cloudflare-worker.js`** - Main worker code to deploy

## Features

✅ **API Key Protection** - Key stored as encrypted environment variable
✅ **Rate Limiting** - Prevents abuse (10/min, 100/hour per IP)
✅ **CORS Handling** - Allows extension to make requests
✅ **Error Handling** - Graceful error responses
✅ **Caching** - Optional Cloudflare KV caching (can be enabled)

## Deployment

See the main [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for full instructions.

### Quick Deploy

1. Create free Cloudflare account: https://dash.cloudflare.com/
2. Workers & Pages → Create Worker
3. Copy `cloudflare-worker.js` code → paste in editor
4. Save and Deploy
5. Settings → Variables → Add:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
   - Type: ✓ Encrypt
6. Save and Deploy
7. Copy worker URL

## Configuration

### Rate Limits

Adjust in `cloudflare-worker.js` lines 15-19:

```javascript
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 10,  // Per IP
  MAX_REQUESTS_PER_HOUR: 100,   // Per IP
  BAN_DURATION_MINUTES: 60      // Ban duration
};
```

### Cache TTL

Adjust in `cloudflare-worker.js` line 22:

```javascript
const CACHE_TTL_SECONDS = 86400; // 24 hours
```

## Testing

Test with curl:

```bash
curl -X POST https://YOUR-WORKER-URL.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"term":"API"}'
```

Expected response:
```json
{
  "success": true,
  "explanation": "An API (Application Programming Interface) is a set of rules...",
  "cached": false
}
```

## Monitoring

**View Analytics:**
1. Cloudflare Dashboard → Your Worker
2. Metrics tab

**Key Metrics:**
- Requests per day
- Error rate
- Latency (p50, p99)
- Bandwidth

## Cost

**Cloudflare Workers Free Tier:**
- ✅ 100,000 requests/day FREE
- ✅ 10ms CPU time per request
- ✅ No credit card required

**Paid Plan** (if you exceed free tier):
- $5/month + $0.50 per million requests

## Optional Enhancements

### Enable Cloudflare KV Caching

To cache explanations at the proxy level (reduces API costs):

1. **Create KV Namespace:**
   ```bash
   # In Cloudflare Dashboard:
   Workers & Pages → KV → Create Namespace
   Name: hov3x-cache
   ```

2. **Bind to Worker:**
   ```
   Settings → Variables → KV Namespace Bindings
   Variable name: CACHE
   KV namespace: hov3x-cache
   ```

3. **Update code** (lines 154-172):
   ```javascript
   async function getFromCache(key) {
     return await CACHE.get(key, { type: 'text' });
   }

   async function saveToCache(key, value) {
     await CACHE.put(key, value, { expirationTtl: CACHE_TTL_SECONDS });
   }
   ```

### Add Analytics

Track custom metrics:

```javascript
// Add after line 74 in cloudflare-worker.js
await fetch('https://your-analytics-endpoint.com/track', {
  method: 'POST',
  body: JSON.stringify({
    event: 'explanation_generated',
    term: sanitizedTerm,
    timestamp: Date.now()
  })
});
```

### Add IP Whitelist/Blacklist

Block specific IPs:

```javascript
// Add after line 25 in cloudflare-worker.js
const BLOCKED_IPS = ['1.2.3.4', '5.6.7.8'];

// Add in handleRequest function:
if (BLOCKED_IPS.includes(clientIP)) {
  return jsonResponse({ error: 'Access denied' }, 403);
}
```

## Troubleshooting

### Worker not responding
- Check deployment status in dashboard
- Verify environment variable is set
- Check worker logs for errors

### Rate limiting too strict
- Increase limits in configuration
- Or implement IP whitelist for trusted users

### High costs
- Enable KV caching to reduce API calls
- Lower rate limits
- Check for abuse in analytics

## Security

✅ **DO:**
- Store API key as encrypted environment variable
- Use HTTPS for all requests
- Implement rate limiting
- Monitor for abuse

❌ **DON'T:**
- Hardcode API keys in code
- Disable rate limiting
- Allow unlimited requests
- Expose internal error details to users

## Support

For issues:
1. Check Cloudflare worker logs
2. Review [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
3. Test with curl command above

---

**Cloudflare Workers Documentation:**
https://developers.cloudflare.com/workers/
