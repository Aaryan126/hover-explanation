# Testing Hov3x on Restricted Work Laptop

If your work laptop prevents loading unpacked Chrome extensions, here are several workarounds.

---

## 🔍 Diagnosis: What's the Issue?

Common restrictions on work laptops:
- Developer mode disabled/greyed out in Chrome
- Group Policy blocking unpacked extensions
- "Managed by your organization" message
- Error: "Extensions are disabled by the administrator"

---

## ✅ Solution 1: Use Microsoft Edge (Recommended for Work Laptops)

Microsoft Edge uses the same Chromium engine and usually has fewer restrictions.

### Steps:

1. **Open Microsoft Edge** (pre-installed on Windows)
2. Navigate to `edge://extensions/`
3. Toggle **"Developer mode"** (top-right)
4. Click **"Load unpacked"**
5. Select the `hover-explain` folder
6. ✅ Extension should load!

### Why this works:
- Edge often has different group policies than Chrome
- Same Chromium engine, 100% compatible
- All Chrome Extension Manifest V3 features work identically

**Test it now with Edge!**

---

## ✅ Solution 2: Use Chrome Portable (No Admin Rights Needed)

Chrome Portable runs without installation and bypasses most restrictions.

### Steps:

1. **Download Chrome Portable**
   - Visit: https://portableapps.com/apps/internet/google_chrome_portable
   - Or: https://chromium.woolyss.com/ (Chromium portable)
   - Download the portable version

2. **Extract to a folder**
   - Example: `C:\Users\aaryan.kandiah\Desktop\ChromePortable`
   - No installation required

3. **Run Chrome Portable**
   - Double-click `GoogleChromePortable.exe`

4. **Load Extension**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked
   - Select `hover-explain` folder

### Why this works:
- Runs from your user folder
- Doesn't require admin rights
- Bypasses system-wide Chrome policies

---

## ✅ Solution 3: Use Brave Browser

Brave is Chromium-based and often available on work laptops.

### Steps:

1. **Install Brave** (if not blocked)
   - Download from: https://brave.com/download/
   - Or use portable version

2. **Load Extension**
   - Go to `brave://extensions/`
   - Enable Developer mode
   - Load unpacked
   - Select folder

---

## ✅ Solution 4: Test Components Individually (Without Browser Extension)

You can test the core functionality without loading as an extension.

### Test the Gemini API Connection:

Create a test HTML file to verify API works:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Hov3x API Test</title>
</head>
<body>
    <h1>Gemini API Test</h1>
    <input type="text" id="term" placeholder="Enter a technical term">
    <button onclick="testAPI()">Test</button>
    <div id="result"></div>

    <script>
        const API_KEY = "AIzaSyBQbur7BspRkLLDvtv3vpj2FVKWiqDEF0U";

        async function testAPI() {
            const term = document.getElementById('term').value;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

            const body = {
                contents: [{
                    parts: [{
                        text: `Explain this technical term in 1-2 simple, clear sentences: "${term}"`
                    }]
                }]
            };

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                const data = await response.json();
                const explanation = data.candidates[0].content.parts[0].text;

                document.getElementById('result').innerHTML = `<strong>Result:</strong> ${explanation}`;
            } catch (error) {
                document.getElementById('result').innerHTML = `<strong>Error:</strong> ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

**Save this as `test-api.html` and open in any browser!**

---

## ✅ Solution 5: Package as .CRX (Signed Extension)

If you can install extensions from Chrome Web Store but not unpacked:

### Steps:

1. **Package the Extension**
   ```bash
   # This requires Chrome to be accessible once
   # Creates a .crx and .pem file
   ```

2. **Create a .crx file** (I can help with this)

3. **Install the .crx**
   - Drag and drop into Chrome
   - May still be blocked by policy though

**Note:** This is more complex and may still be restricted.

---

## ✅ Solution 6: Test on Personal Device

Since this is for testing/learning:

### Options:
- **Personal laptop** - Full control
- **Personal phone** - Use Kiwi Browser (supports Chrome extensions)
- **Home desktop** - Test there first
- **VM/Container** - If you have access to virtual machines

---

## ✅ Solution 7: Request IT Exception

If you need this for work purposes:

### Steps:
1. **Contact IT Support**
2. **Explain the use case**:
   - "Developing a Chrome extension for productivity"
   - "Need developer mode for testing"
   - "Personal learning/development project"

3. **Request temporary access**
   - Usually granted for developers
   - May need manager approval

---

## 🧪 Quick Test Script (No Extension Needed)

Save this as `quick-test.html` in your project folder:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hov3x Quick Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
        }
        .test-area {
            margin: 20px 0;
        }
        input {
            width: 70%;
            padding: 12px;
            font-size: 16px;
            border: 2px solid #e1e8ed;
            border-radius: 6px;
        }
        button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f7f9fc;
            border-left: 4px solid #667eea;
            border-radius: 6px;
            min-height: 60px;
        }
        .loading {
            color: #8899a6;
            font-style: italic;
        }
        .success {
            color: #2d7a4f;
        }
        .error {
            color: #c0392b;
            background: #fff0f0;
            border-left-color: #e74c3c;
        }
        .status {
            margin: 20px 0;
            padding: 15px;
            background: #f0f4ff;
            border-radius: 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Hov3x API Test</h1>

        <div class="status">
            <strong>Status:</strong> <span id="status">Ready to test</span>
        </div>

        <div class="test-area">
            <input
                type="text"
                id="term"
                placeholder="Enter a technical term (e.g., 'algorithm', 'neural network')"
                value="algorithm"
            >
            <button onclick="testExplanation()">Get Explanation</button>
        </div>

        <div class="result" id="result">
            Enter a term and click "Get Explanation" to test the Gemini API.
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e1e8ed;">
            <h3>Test Results:</h3>
            <ul>
                <li id="test-config">⏳ Configuration check...</li>
                <li id="test-api">⏳ API connection...</li>
                <li id="test-response">⏳ Response parsing...</li>
            </ul>
        </div>
    </div>

    <script>
        // Import config
        const API_KEY = "AIzaSyBQbur7BspRkLLDvtv3vpj2FVKWiqDEF0U";

        // Check configuration on load
        window.onload = function() {
            if (API_KEY === "YOUR_API_KEY_HERE") {
                document.getElementById('test-config').innerHTML = '❌ API key not configured';
                document.getElementById('status').innerHTML = '❌ Not configured';
            } else {
                document.getElementById('test-config').innerHTML = '✅ API key configured';
                document.getElementById('status').innerHTML = '✅ Ready';
            }
        };

        async function testExplanation() {
            const term = document.getElementById('term').value.trim();

            if (!term) {
                document.getElementById('result').innerHTML = '<span class="error">Please enter a term</span>';
                return;
            }

            // Update UI
            document.getElementById('result').innerHTML = '<span class="loading">⏳ Loading explanation...</span>';
            document.getElementById('status').innerHTML = '⏳ Fetching...';
            document.getElementById('test-api').innerHTML = '⏳ Calling Gemini API...';

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;

            const body = {
                contents: [{
                    parts: [{
                        text: `Explain this technical term in 1-2 simple, clear sentences: "${term}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 150
                }
            };

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });

                document.getElementById('test-api').innerHTML = '✅ API connection successful';

                if (!response.ok) {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    const explanation = data.candidates[0].content.parts[0].text.trim();

                    document.getElementById('result').innerHTML =
                        `<div class="success"><strong>✅ Success!</strong><br><br>${explanation}</div>`;
                    document.getElementById('status').innerHTML = '✅ Working perfectly!';
                    document.getElementById('test-response').innerHTML = '✅ Response parsed successfully';
                } else {
                    throw new Error('Invalid response format');
                }

            } catch (error) {
                document.getElementById('result').innerHTML =
                    `<div class="error"><strong>❌ Error:</strong><br>${error.message}</div>`;
                document.getElementById('status').innerHTML = '❌ Error occurred';
                document.getElementById('test-api').innerHTML = '❌ API call failed';
                document.getElementById('test-response').innerHTML = '❌ Response error';

                console.error('Test error:', error);
            }
        }
    </script>
</body>
</html>
```

**Just double-click this HTML file to test your API!**

---

## 📊 Recommended Approach for Your Situation

Based on your work laptop restrictions:

### **Best Option: Microsoft Edge** ⭐
1. Already installed on Windows
2. Same Chromium engine
3. Usually fewer restrictions
4. Works identically to Chrome

### **Backup Option: Quick Test HTML**
1. No browser extension loading needed
2. Tests API functionality
3. Can be opened in any browser
4. Validates your config.js setup

### **For Full Testing: Personal Device**
1. Use your personal laptop/phone
2. Full control over browser
3. Can test all features

---

## 🎯 Quick Start for Your Situation

### **Right Now (5 minutes):**

1. **Try Microsoft Edge First:**
   ```
   1. Open Edge
   2. Go to edge://extensions/
   3. Enable Developer mode
   4. Load unpacked → select hover-explain folder
   ```

2. **If Edge is also blocked, use the HTML test:**
   - I'll create the test file for you
   - Just open it in any browser
   - Tests your API connection

---

## 🤔 Which Solution Should You Use?

| Solution | Ease | Full Testing | Works on Work Laptop? |
|----------|------|--------------|----------------------|
| **Microsoft Edge** | ⭐⭐⭐ | ✅ Full | ✅ Usually |
| **Chrome Portable** | ⭐⭐ | ✅ Full | ✅ Usually |
| **HTML Test File** | ⭐⭐⭐ | ⚠️ Partial | ✅ Always |
| **Personal Device** | ⭐⭐⭐ | ✅ Full | ✅ Always |
| **IT Exception** | ⭐ | ✅ Full | ⚠️ Maybe |

---

## ✅ Next Steps

Let me know which option you want to try, and I can:

1. **Create the HTML test file** for immediate testing
2. **Help you test in Edge** if that's available
3. **Guide you through Chrome Portable** setup
4. **Provide alternative testing methods**

**What would you like to try first?**
