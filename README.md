# ⚡ SmartFill AI Assistant — Google Chrome Extension (Manifest V3)

> **Production-Ready, Intelligent Form-Filling Assistant & Document Vault with 3D Glassmorphic Design System.**

---

## 🌟 Key Features

1. **Intelligent Fuzzy Field Matcher**:
   - Automatically detects and maps form elements across `<input>`, `<select>`, `<textarea>` using `name`, `id`, `placeholder`, `aria-label`, `autocomplete`, and wrapping labels.
   - Comprehensive synonym classification for Personal, Address, Professional, Government ID, and Custom Aliases.

2. **React / Vue / Angular Native SPA Compatibility**:
   - Uses native DOM prototype value setters (`Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set`) combined with simulated `input`, `change`, and `blur` events so modern reactive UI frameworks synchronize state immediately.

3. **Client-Side File Compression Engine**:
   - Integrated HTML5 Canvas engine auto-resizes and progressively compresses images and PDFs to keep each stored entry well under 300 KB.
   - Real-time local storage gauge with warning thresholds at >80% quota capacity.

4. **Cryptographic PIN Protection (Web Crypto API)**:
   - PBKDF2 with SHA-256 (100,000 iterations + 16-byte random salt).
   - Session auto-lock engine stored in `chrome.storage.session` with 5-minute inactivity timeout.

5. **3D Glassmorphic UI/UX**:
   - Multi-layered card depth, soft elevation shadows, glowing electric cyan badges, dynamic time-aware greetings, and fluid animations.
   - Dual Mode: Read-Only Vault View vs. Unlocked Edit Mode.
   - Floating 3D helper badge directly on web page form inputs.

---

## 📁 Directory Structure

```
AI assisstant/
├── manifest.json                  # Manifest V3 configuration
├── icons/                         # 16, 32, 48, 128px high-definition icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── popup/                         # Main Extension Popup (420px x 620px)
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/                       # Full-Screen Management & Audit Dashboard
│   ├── options.html
│   ├── options.css
│   └── options.js
├── content/                       # Injected Content Scripts & Floating Badge
│   ├── content.js
│   └── content.css
├── background/                    # Manifest V3 Service Worker & Context Menus
│   └── background.js
├── styles/                        # 3D Glassmorphic Design System
│   └── 3d-theme.css
├── utils/                         # Cryptography, File Compression, & Matching
│   ├── crypto.js
│   ├── fileHandler.js
│   └── fieldMatcher.js
├── test-form.html                 # Interactive test sandbox with live DOM event logger
├── CHROMEWEBSTORE.md              # Web Store metadata, permissions & privacy docs
└── README.md
```

---

## 🚀 How to Install and Load in Google Chrome

1. Open **Google Chrome** and navigate to `chrome://extensions/`.
2. Turn **ON** the **Developer mode** toggle in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left.
4. Select the folder: `/Users/goyal/iit 2/AI assisstant`.
5. Pin **SmartFill AI Assistant** to your browser toolbar!

---

## 🧪 Testing the Extension

1. Open `test-form.html` in Chrome (either by double-clicking the file or via `file:///Users/goyal/iit%202/AI%20assisstant/test-form.html`).
2. Click the SmartFill extension icon in your toolbar, enter your profile details, and click **"Fill Current Form"**.
3. Watch as all form fields populate seamlessly with glowing highlight animations and the live DOM event logger records incoming native events!
