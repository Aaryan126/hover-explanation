# 🔒 Security Checklist - Pre-Deployment

**Complete this checklist before deploying Hov3x to Chrome Web Store.**

---

## ✅ Backend Security

### Cloudflare Worker
- [ ] API key stored as **encrypted environment variable** (NOT in code)
- [ ] Worker deployed successfully
- [ ] Worker URL uses HTTPS
- [ ] Rate limiting enabled (10/min, 100/hour per IP)
- [ ] Tested worker with curl - responds correctly
- [ ] Tested rate limiting - blocks after limit exceeded
- [ ] CORS configured to allow extension origin
- [ ] Error messages don't expose sensitive details

---

## ✅ Extension Security

### Code Review
- [ ] Using `background-proxy.js` (NOT `background.js`)
- [ ] No hardcoded API keys in any file
- [ ] `config.js` NOT included in distribution package
- [ ] Content Security Policy added to manifest
- [ ] HTML sanitization enabled in `content.js` (parseMarkdown function)
- [ ] No `eval()` or `innerHTML` vulnerabilities
- [ ] No remote code loading

### Manifest Configuration
- [ ] `service_worker` points to `background-proxy.js`
- [ ] Host permissions only include Cloudflare Workers domain
- [ ] Content Security Policy defined:
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  ```
- [ ] Minimal permissions requested (only `storage` and `activeTab`)

### Input Validation
- [ ] Selection length limited to 100 characters
- [ ] Minimum selection length is 3 characters
- [ ] Text sanitized before sending to API
- [ ] Duplicate request prevention implemented
- [ ] Pending request tracking to prevent spam

---

## ✅ Privacy & Compliance

### Privacy Policy
- [ ] Privacy policy created and reviewed
- [ ] Hosted at publicly accessible URL
- [ ] Contains all required disclosures:
  - [ ] What data is collected
  - [ ] How data is used
  - [ ] Third-party services (Google Gemini)
  - [ ] Data retention periods
  - [ ] User rights and choices
  - [ ] Contact information
  - [ ] GDPR compliance (for EU users)
  - [ ] CCPA compliance (for California users)
- [ ] Updated with actual contact information
- [ ] Updated with actual extension URL (after publishing)

### Terms of Service
- [ ] Terms of service created
- [ ] Hosted or included with extension
- [ ] Contains liability limitations
- [ ] Contains acceptable use policy
- [ ] Updated with actual contact information
- [ ] Updated with jurisdiction information

### Data Handling
- [ ] Selected text NOT stored permanently
- [ ] Cache expires after 7 days
- [ ] User can clear cache manually
- [ ] No browsing history collected
- [ ] No personal information collected (beyond IP for rate limiting)
- [ ] No tracking or analytics (unless disclosed)

---

## ✅ Package Integrity

### Files Included
- [ ] `manifest.json`
- [ ] `background-proxy.js`
- [ ] `content.js`
- [ ] `tooltip.css`
- [ ] `tooltip.js`
- [ ] `/popup` folder (all files)
- [ ] `/icons` folder (all icons)
- [ ] `PRIVACY_POLICY.md`
- [ ] `TERMS_OF_SERVICE.md`

### Files EXCLUDED
- [ ] `config.js` (contains API key!) ⚠️
- [ ] `background.js` (old version)
- [ ] `config.example.js`
- [ ] `/backend` folder
- [ ] `.git` folder
- [ ] `.gitignore`
- [ ] Test HTML files (`quick-test.html`, `hover-simulator.html`)
- [ ] Development documentation (except privacy/terms)
- [ ] `CLAUDE.md`
- [ ] `README.md` (not needed in package)
- [ ] `DEPLOYMENT_GUIDE.md`
- [ ] `SECURITY_CHECKLIST.md` (this file)

### Package Verification
- [ ] ZIP file created
- [ ] Extracted ZIP and verified contents
- [ ] No API keys in any file
- [ ] Worker URL updated in `background-proxy.js`
- [ ] Test loading unpacked extension from extracted ZIP

---

## ✅ Testing

### Functional Testing
- [ ] Extension loads without errors
- [ ] Selecting text triggers tooltip
- [ ] Tooltip displays AI explanation correctly
- [ ] Cache works (second selection is instant)
- [ ] Popup UI works (displays cache stats)
- [ ] Clear cache button works
- [ ] Service toggle works (enables/disables extension)
- [ ] Theme toggle works (light/dark mode)
- [ ] Keyboard shortcut (Alt+T) toggles theme
- [ ] Works on multiple websites

### Security Testing
- [ ] No JavaScript errors in console
- [ ] No API key visible in extension files
- [ ] No API key visible in network requests
- [ ] Rate limiting triggers correctly (test with 15 rapid requests)
- [ ] XSS protection works (try selecting `<script>alert('xss')</script>`)
- [ ] HTML entities escaped correctly
- [ ] Extension context invalidation handled gracefully

### Edge Cases
- [ ] Selecting very long text (>100 chars) shows error
- [ ] Selecting very short text (<3 chars) ignores
- [ ] Selecting emoji and special characters works
- [ ] Selecting text in iframes works (or fails gracefully)
- [ ] Works on HTTPS and HTTP sites
- [ ] Works on local HTML files (file://)
- [ ] Multiple rapid selections don't cause issues

---

## ✅ Chrome Web Store Submission

### Developer Account
- [ ] Chrome Web Store developer account created
- [ ] $5 registration fee paid
- [ ] Developer profile completed

### Store Listing
- [ ] Extension name: "Hov3x" (or your choice)
- [ ] Short description written (132 chars max)
- [ ] Detailed description written
- [ ] Category selected: Productivity
- [ ] Language: English
- [ ] Privacy policy URL provided
- [ ] Screenshots uploaded (1-5 high-quality images)
- [ ] Promotional images uploaded (440x280)
- [ ] Icons verified (16x16, 48x48, 128x128)

### Permissions Justification
- [ ] Explained why `storage` permission is needed
- [ ] Explained why `activeTab` permission is needed
- [ ] Explained why `https://*.workers.dev/*` permission is needed
- [ ] Confirmed no remote code hosting
- [ ] Confirmed single purpose

### Questionnaire
- [ ] Answered data collection questions honestly
- [ ] Disclosed data sent to third parties (Google Gemini)
- [ ] Disclosed privacy practices
- [ ] Confirmed security measures

---

## ✅ Post-Deployment Monitoring

### Budget & Cost Monitoring
- [ ] Google Cloud billing alerts set up
- [ ] Budget limit set (e.g., $20/month)
- [ ] Alert thresholds configured (50%, 90%, 100%)
- [ ] Cloudflare worker analytics reviewed

### Usage Monitoring
- [ ] Cloudflare worker request count monitored
- [ ] Gemini API usage monitored
- [ ] Error rate monitored
- [ ] Latency monitored

### User Feedback
- [ ] Chrome Web Store reviews checked regularly
- [ ] Support email monitored
- [ ] GitHub issues monitored (if applicable)
- [ ] Bug reports triaged and fixed promptly

### Updates
- [ ] Privacy policy URL updated with extension URL
- [ ] Terms of service URL updated with extension URL
- [ ] GitHub repository updated (if public)
- [ ] Documentation updated with final URLs

---

## 🚨 Critical Security Reminders

### NEVER:
- ❌ Hardcode API keys in extension code
- ❌ Include `config.js` in distribution package
- ❌ Commit API keys to Git
- ❌ Share API keys publicly
- ❌ Disable rate limiting without good reason
- ❌ Store sensitive user data permanently

### ALWAYS:
- ✅ Use environment variables for API keys
- ✅ Validate and sanitize all user input
- ✅ Use HTTPS for all API requests
- ✅ Implement rate limiting
- ✅ Monitor for abuse and unusual usage
- ✅ Keep dependencies updated
- ✅ Respond to security issues promptly

---

## ✅ Final Checks

Before submitting to Chrome Web Store:

- [ ] Read through entire checklist again
- [ ] Test extension one more time
- [ ] Verify no API keys in package
- [ ] Verify worker is deployed and working
- [ ] Verify privacy policy is accessible
- [ ] Double-check all contact information
- [ ] Review Chrome Web Store policies one more time
- [ ] Take a deep breath ✅
- [ ] Click "Submit for Review"

---

## 📊 Security Score

**Count your checkmarks:**

- **80-100%** ✅ Excellent - Ready to deploy
- **60-79%** ⚠️ Good - Address remaining items before deploying
- **40-59%** ⚠️ Fair - Significant issues to fix
- **<40%** ❌ Not Ready - Do not deploy yet

---

## 🔐 Security Incident Response

If you discover a security issue after deployment:

1. **Assess severity** - Is user data at risk?
2. **Take action:**
   - Critical: Unpublish extension immediately
   - High: Push emergency update within 24 hours
   - Medium: Include fix in next update
3. **Notify users** (if data breach occurred)
4. **Document incident** and lessons learned
5. **Update security practices** to prevent recurrence

---

## 📞 Security Contact

If users find security issues, they should contact:

- **Email:** [Your Security Email]
- **GitHub Security Advisories:** [Your Repo]/security/advisories

**Response Time Commitment:**
- Critical issues: 24 hours
- High issues: 3 days
- Medium/Low issues: 1 week

---

**Last Updated:** November 19, 2024

**Review this checklist before every major release.**
