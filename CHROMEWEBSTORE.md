# SmartFill AI Assistant — Chrome Web Store Listing & Compliance

## 1. Store Listing Information

- **Name**: SmartFill AI Assistant
- **Short Description**: Intelligent 3D form-filling assistant with client-side document compression & secure PIN vault.
- **Detailed Description**:
SmartFill AI Assistant streamlines your online workflow by providing an ultra-secure, intelligent autofill assistant for job applications, registration portals, and multi-step forms.

Features:
- **Intelligent Field Identification**: Employs fuzzy attribute classification matching name, email, address, job history, and document numbers.
- **Client-Side Document Vault**: Store identity cards and documents with real-time HTML5 Canvas downsampling (<300 KB budget).
- **Cryptographic PIN Protection**: Safeguard your sensitive data with PBKDF2-HMAC-SHA256 encryption and automatic 5-minute inactivity session locking.
- **Modern 3D Glassmorphic Interface**: Sleek UI with dynamic time greetings, real-time storage quota gauges, and floating 1-click helper badges.
- **Single-Page Application (SPA) Support**: Dispatches complete native DOM events (`input`, `change`, `blur`) for seamless compatibility with React, Vue, Angular, and Svelte applications.
- **Offline & Private**: All profile records and compressed documents stay strictly on your local device in `chrome.storage.local`.

---

## 2. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to persist user profile records, compressed base64 document thumbnails, custom field aliases, and PIN hashes locally on the user's device. |
| `activeTab` | Required to inspect form fields and inject profile values into the current active web page upon user command. |
| `scripting` | Required to dynamically inject DOM autofill scripts and glowing highlight animations into active web pages. |
| `contextMenus` | Required to provide right-click autofill convenience ("SmartFill: Fill Entire Form", "Fill Field") directly within editable input fields. |
| `<all_urls>` (Host) | Required to enable form inspection and autofill across any web form the user navigates to. |

---

## 3. Privacy & Data Handling Policy

- **Data Collection**: None. SmartFill AI Assistant does NOT collect, transmit, sell, or analyze any user personal data, document files, or keystrokes.
- **Data Transmission**: 100% offline local operation. No external API endpoints or analytics trackers are contacted.
- **Data Storage**: User records and compressed documents are stored exclusively within Chrome's local storage sandbox (`chrome.storage.local`).
- **PIN Security**: PIN codes are hashed using client-side Web Crypto PBKDF2 with 100,000 iterations and a unique 16-byte random salt. Raw PINs are never stored.

---

## 4. Version History
- **v1.0.0** (2026-08-30): Initial production release featuring 3D Glassmorphism UI, PBKDF2 PIN vault, canvas file compression, floating badges, and SPA autofill engine.
