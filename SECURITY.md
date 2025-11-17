# Security Best Practices for Hov3x

This document outlines security best practices for developing and deploying the Hov3x Chrome Extension.

---

## API Key Security

### ✅ DO

1. **Use the config.js pattern**
   - Always store API keys in `config.js` (which is gitignored)
   - Use `config.example.js` as a template for other developers
   - Never hardcode API keys directly in source files

2. **Verify .gitignore**
   - Before your first commit, verify `config.js` is in `.gitignore`
   - Test with: `git status` (config.js should NOT appear)
   - Add to `.gitignore`: `config.js`, `*.pem`, `*.crx`

3. **Rotate API keys regularly**
   - Change your API key every 3-6 months
   - Immediately rotate if you suspect exposure
   - Use Google AI Studio to manage keys

4. **Limit API key permissions**
   - Use API keys with minimal required permissions
   - Set usage quotas to prevent abuse
   - Monitor API usage in Google Cloud Console

### ❌ DON'T

1. **Never commit API keys**
   - Don't add keys to `background.js` directly
   - Don't commit `config.js` with real keys
   - Don't share keys in screenshots, issues, or PRs

2. **Never share config.js**
   - Don't send `config.js` via email, Slack, etc.
   - Don't upload to file sharing services
   - Don't include in bug reports

3. **Never log API keys**
   - Don't use `console.log(GEMINI_API_KEY)`
   - Don't include keys in error messages
   - Avoid logging full request URLs with keys

---

## Git Workflow Security

### Before First Commit

```bash
# 1. Verify .gitignore exists
ls -la .gitignore

# 2. Test that config.js is ignored
git status
# config.js should NOT appear in untracked files

# 3. Verify config.example.js exists (this SHOULD be tracked)
git status
# config.example.js SHOULD appear in untracked files

# 4. Add all files EXCEPT config.js
git add .

# 5. Double-check what will be committed
git status
# Verify config.js is NOT in "Changes to be committed"
```

### If You Accidentally Commit an API Key

**ACT IMMEDIATELY:**

1. **Rotate the API key**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Delete the exposed key
   - Create a new key
   - Update your local `config.js`

2. **Remove from Git history** (if just committed)
   ```bash
   # If you just committed (haven't pushed yet)
   git reset --soft HEAD~1

   # Remove config.js from staging
   git reset HEAD config.js

   # Re-commit without the key
   git commit -m "Your commit message"
   ```

3. **If already pushed to GitHub**
   ```bash
   # Remove from Git history (requires force push)
   git filter-branch --index-filter "git rm -rf --cached --ignore-unmatch config.js" HEAD
   git push --force
   ```

   **THEN**: Immediately rotate your API key (the old one is compromised!)

---

## Chrome Extension Security

### Content Security Policy

The extension uses Manifest V3 which has strict CSP by default. Never:
- Disable CSP requirements
- Use `eval()` or `new Function()`
- Load external scripts into the extension context
- Use inline scripts in HTML files

### Permissions

Only request necessary permissions in `manifest.json`:
```json
{
  "permissions": [
    "storage",      // For caching - needed
    "activeTab"     // For current tab - needed
  ],
  "host_permissions": [
    "https://generativelanguage.googleapis.com/*"  // Only Gemini API
  ]
}
```

**Never** request:
- `<all_urls>` in permissions (only in content_scripts)
- `tabs` permission (use `activeTab` instead)
- `webRequest` unless absolutely necessary
- `cookies` unless needed

### User Data Protection

1. **Only cache explanations**
   - Don't store user browsing history
   - Don't track which words users hover over
   - Don't send analytics to third parties

2. **Clear data on uninstall**
   - All cached data is local
   - Automatically cleared when extension is removed
   - No server-side storage

3. **Minimal data collection**
   - Only send the term to Gemini API
   - Don't send page URLs, user info, or context

---

## Code Security

### Input Validation

Always validate input before processing:

```javascript
// Good: Validate word length and content
if (!word || word.length < MIN_WORD_LENGTH) {
  return;
}

// Good: Sanitize before API call
const sanitizedTerm = term.trim().replace(/[<>]/g, '');
```

### XSS Prevention

The extension uses `textContent` instead of `innerHTML`:

```javascript
// Good: Safe from XSS
tooltip.textContent = explanation;

// Bad: Vulnerable to XSS (DON'T DO THIS)
// tooltip.innerHTML = explanation;
```

### Avoid Code Injection

Never execute user-provided code:

```javascript
// Bad: NEVER do this
// eval(userInput);
// new Function(userInput)();
// setTimeout(userInput, 1000);
```

---

## API Security

### Rate Limiting

Implement client-side rate limiting:
- Prevent spam requests with pending request tracking
- Use 200ms hover delay
- Cache aggressively (7-day default)

### Error Handling

Don't expose sensitive information in errors:

```javascript
// Good: Generic error message
catch (error) {
  console.error("Failed to fetch explanation");
  showTooltip("Failed to load explanation");
}

// Bad: Exposes API details
// showTooltip(`API error: ${error.message}`);
```

---

## Testing Security

### Manual Security Checks

Before each release:
- [ ] Verify `config.js` is in `.gitignore`
- [ ] Check no API keys in source files
- [ ] Test with `git status` before committing
- [ ] Review all console.log statements
- [ ] Test XSS with malicious explanations
- [ ] Verify CSP is not disabled
- [ ] Check permissions are minimal

### Automated Checks

Add to your workflow:

```bash
# Check for accidentally committed secrets
git grep -i "AIzaSy" # Gemini API key pattern
git grep -i "api_key"
git grep -i "secret"
```

---

## Incident Response

### If API Key is Exposed

1. **Immediately** rotate the key at [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Remove from Git history (see above)
3. Check API usage logs for unauthorized requests
4. Update local `config.js` with new key
5. Document the incident

### If Malicious Code is Detected

1. Remove the extension from Chrome Web Store immediately
2. Notify users through all available channels
3. Fix the vulnerability
4. Conduct security audit
5. Re-release with version bump and security notes

---

## Deployment Security

### Before Publishing to Chrome Web Store

- [ ] Remove all console.log statements (or use debug flag)
- [ ] Verify no hardcoded credentials
- [ ] Test with multiple API keys
- [ ] Review all external API calls
- [ ] Check CSP configuration
- [ ] Minimize permissions requested
- [ ] Include privacy policy

### Distribution

- Only distribute through official Chrome Web Store
- Never share `.crx` or `.pem` files publicly
- Keep `.pem` file secure (required for updates)
- Use version numbering to track releases

---

## Resources

- [Chrome Extension Security Best Practices](https://developer.chrome.com/docs/extensions/mv3/security/)
- [OWASP Chrome Extension Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Browser_Extension_Security_Cheat_Sheet.html)
- [Google API Security Best Practices](https://cloud.google.com/docs/security/api-keys-best-practices)

---

## Questions?

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Report privately to the maintainer
3. Allow time for a patch before public disclosure

---

**Remember**: Security is not a one-time setup. Review these practices regularly and stay informed about new security threats.
