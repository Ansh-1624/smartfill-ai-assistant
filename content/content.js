/**
 * SmartFill AI Assistant — DOM Inspector & Universal Autofill Engine (content.js)
 * Supports Google Forms, React, Angular, Vue, Typeform, Workday, Greenhouse, Taleo,
 * Stripe, Shopify, Notion, and standard HTML forms across all websites and iframes.
 * Includes Dual Email System with in-page picker and autofill selector modal.
 */

(function () {
  let cachedUserData = null;
  let floatingBadgeEl = null;
  let emailPickerEl = null;
  let emailModalOverlayEl = null;
  let activeFocusedInput = null;
  let floatingBadgeEnabled = true;

  function isContextValid() {
    return Boolean(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
  }

  if (isContextValid()) {
    try {
      chrome.storage.local.get('settings', (res) => {
        if (chrome.runtime.lastError) return;
        if (res && res.settings && res.settings.floatingBadge === false) {
          floatingBadgeEnabled = false;
        }
      });
    } catch (_) {}
  }

  /**
   * Injects value into DOM element and synthesizes complete native event lifecycle.
   * Handles inputs, textareas, selects, checkboxes, and contenteditable elements.
   */
  function injectValue(element, value) {
    if (!element || value === undefined || value === null || value === '') return false;

    const strValue = String(value);

    // 1. Focus & Activate
    try {
      element.focus();
      element.click();
    } catch (_) {}

    // Handle ContentEditable elements (Notion, Google Docs, rich editors)
    if (element.isContentEditable) {
      try {
        element.textContent = strValue;
        element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        highlightElement(element);
        return true;
      } catch (_) {}
    }

    const tag = element.tagName.toLowerCase();
    const type = (element.type || '').toLowerCase();

    if (tag === 'select') {
      let matched = false;
      const strVal = strValue.toLowerCase();

      for (let i = 0; i < element.options.length; i++) {
        const opt = element.options[i];
        if (opt.value.toLowerCase() === strVal || opt.text.toLowerCase().includes(strVal)) {
          element.selectedIndex = i;
          matched = true;
          break;
        }
      }

      if (!matched && element.options.length > 1) {
        element.selectedIndex = 1;
      }

      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      highlightElement(element);
      return true;
    }

    if (type === 'checkbox' || type === 'radio') {
      const boolVal = Boolean(value && value !== '0' && value !== 'false');
      element.checked = boolVal;
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      highlightElement(element);
      return true;
    }

    if (tag === 'input' || tag === 'textarea') {
      // 1. Prototype value setter for React, Angular, Vue, Web Components
      const prototype = tag === 'input' ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

      if (descriptor && descriptor.set) {
        descriptor.set.call(element, strValue);
      } else {
        element.value = strValue;
      }

      // 2. Also try execCommand for Google Docs / Forms text sync
      try {
        element.select();
        document.execCommand('insertText', false, strValue);
      } catch (_) {}

      element.value = strValue;
      element.setAttribute('data-initial-value', strValue);
      element.setAttribute('badinput', 'false');

      // 3. Dispatch native beforeinput & input events with composed: true
      try {
        element.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          composed: true,
          inputType: 'insertText',
          data: strValue
        }));
      } catch (_) {}

      element.dispatchEvent(new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertText',
        data: strValue
      }));

      element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, key: strValue.slice(-1) || 'a' }));
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true, key: strValue.slice(-1) || 'a' }));
      element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));

      // 4. Clean up Google Forms Material Design placeholder overlap & error alerts
      const gfWrapper = element.closest('.rFrNMe, .I9Lafd, .whsOnd, .zHQkBf, .u3bW4e, .Xb9hP, .aCsJod');
      if (gfWrapper) {
        gfWrapper.classList.add('CDELXb', 'k3Du5', 'Is7Fhb');
        gfWrapper.classList.remove('N3Ekab');
        const placeholders = gfWrapper.querySelectorAll('.AxOyFc, .ndJi5d, .snByac, [jsname="Nd3t1b"]');
        placeholders.forEach(p => {
          p.style.setProperty('opacity', '0', 'important');
          p.style.setProperty('display', 'none', 'important');
          p.style.setProperty('visibility', 'hidden', 'important');
        });
      }

      const gfCard = element.closest('.Qr7Oae, .geS5n, [role="listitem"]');
      if (gfCard) {
        gfCard.classList.remove('N3Ekab');
        const errAlerts = gfCard.querySelectorAll('.RHiWt, [role="alert"]');
        errAlerts.forEach(ea => { ea.style.display = 'none'; });
      }

      highlightElement(element);
      return true;
    }

    return false;
  }

  function highlightElement(el) {
    el.classList.add('smartfill-highlighted-field');
    const parent = el.closest('.Qr7Oae, .geS5n, .form-group, .form-field, .form-row, .field, .input-group');
    if (parent) {
      parent.classList.add('smartfill-highlighted-field');
      setTimeout(() => parent.classList.remove('smartfill-highlighted-field'), 2000);
    }
    setTimeout(() => {
      el.classList.remove('smartfill-highlighted-field');
    }, 2000);
  }

  /**
   * Scans all inputs and textareas on any website or iframe.
   * Supports optional category filter and dual email selection preference.
   */
  async function autofillCurrentPage(userData, categoryFilter, preferredEmail) {
    if (!userData && isContextValid()) {
      try {
        userData = await chrome.storage.local.get(null);
      } catch (_) {}
    }
    if (!userData) return 0;
    cachedUserData = userData;

    // Check if form contains generic email fields and user has dual emails configured
    const primaryEmail = userData.personal?.email;
    const secondaryEmail = userData.personal?.secondaryEmail;
    const hasDualEmail = Boolean(primaryEmail && secondaryEmail);

    if (hasDualEmail && !preferredEmail) {
      const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea';
      const candidateEls = Array.from(document.querySelectorAll(selector));
      const hasGenericEmailField = candidateEls.some(el => {
        const match = FieldMatcher.matchField(el, userData);
        return match && match.isEmail && match.isGenericEmail;
      });

      if (hasGenericEmailField) {
        showDualEmailAutofillModal(userData, categoryFilter, primaryEmail, secondaryEmail);
        return 0;
      }
    }

    return executePageAutofill(userData, categoryFilter, preferredEmail);
  }

  function executePageAutofill(userData, categoryFilter, preferredEmail) {
    const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea, [contenteditable="true"]';
    const elements = Array.from(document.querySelectorAll(selector));

    let filledCount = 0;

    for (const el of elements) {
      if (el.disabled || el.readOnly) continue;

      const match = FieldMatcher.matchField(el, userData, { preferredEmail });
      if (match && match.value) {
        // If category filter is specified (e.g. from context menu), only fill matching categories
        if (categoryFilter) {
          if (categoryFilter === 'smartfill_fill_personal' && match.category !== 'personal') continue;
          if (categoryFilter === 'smartfill_fill_address' && match.category !== 'address') continue;
          if (categoryFilter === 'smartfill_fill_pro' && match.category !== 'professional') continue;
        }

        const ok = injectValue(el, match.value);
        if (ok) filledCount++;
      }
    }

    showToastHUD(`Autofill Complete! ⚡`, `SmartFilled ${filledCount} field${filledCount === 1 ? '' : 's'} on this page.`);
    return filledCount;
  }

  function showToastHUD(title, subtitle) {
    let hud = document.getElementById('smartfill-toast-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'smartfill-toast-hud';
      hud.innerHTML = `
        <span class="hud-icon">⚡</span>
        <div class="hud-text">
          <span class="hud-title"></span>
          <span class="hud-subtitle"></span>
        </div>
      `;
      document.body.appendChild(hud);
    }

    hud.querySelector('.hud-title').textContent = title;
    hud.querySelector('.hud-subtitle').textContent = subtitle;
    hud.classList.add('show');

    setTimeout(() => {
      hud.classList.remove('show');
    }, 3200);
  }

  // =========================================================================
  // Dual Email Interactive Popover & Modal
  // =========================================================================
  function initEmailPicker() {
    if (document.getElementById('smartfill-email-picker')) return;

    emailPickerEl = document.createElement('div');
    emailPickerEl.id = 'smartfill-email-picker';
    emailPickerEl.innerHTML = `
      <div class="sf-picker-header">
        <span class="sf-picker-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="m13 2-2 2.5h3L11 8l5-2-3 8h3L11 22l1-7H9l2-5-4 1.5L13 2z"/>
          </svg>
          Choose Email
        </span>
        <button type="button" class="sf-picker-close" id="sfEmailPickerClose">✕</button>
      </div>
      <button type="button" class="sf-email-option-btn" id="sfOptPrimaryEmail">
        <span class="sf-opt-icon">👤</span>
        <div class="sf-opt-info">
          <span class="sf-opt-label">Primary Email</span>
          <span class="sf-opt-val" id="sfOptPrimaryVal"></span>
        </div>
      </button>
      <button type="button" class="sf-email-option-btn" id="sfOptSecondaryEmail">
        <span class="sf-opt-icon">💼</span>
        <div class="sf-opt-info">
          <span class="sf-opt-label">Work / Secondary</span>
          <span class="sf-opt-val" id="sfOptSecondaryVal"></span>
        </div>
      </button>
    `;
    document.body.appendChild(emailPickerEl);

    document.getElementById('sfEmailPickerClose').addEventListener('click', (e) => {
      e.stopPropagation();
      hideEmailPicker();
    });

    document.getElementById('sfOptPrimaryEmail').addEventListener('click', (e) => {
      e.stopPropagation();
      const pVal = cachedUserData?.personal?.email;
      if (activeFocusedInput && pVal) {
        injectValue(activeFocusedInput, pVal);
        showToastHUD('Email Filled ⚡', pVal);
      }
      hideEmailPicker();
    });

    document.getElementById('sfOptSecondaryEmail').addEventListener('click', (e) => {
      e.stopPropagation();
      const sVal = cachedUserData?.personal?.secondaryEmail;
      if (activeFocusedInput && sVal) {
        injectValue(activeFocusedInput, sVal);
        showToastHUD('Work Email Filled 💼', sVal);
      }
      hideEmailPicker();
    });
  }

  function showEmailPicker(target, primaryEmail, secondaryEmail) {
    if (!emailPickerEl) initEmailPicker();

    document.getElementById('sfOptPrimaryVal').textContent = primaryEmail;
    document.getElementById('sfOptSecondaryVal').textContent = secondaryEmail;

    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    emailPickerEl.style.top = `${rect.bottom + scrollY + 8}px`;
    emailPickerEl.style.left = `${Math.max(10, rect.left + scrollX)}px`;
    emailPickerEl.classList.add('visible');
  }

  function hideEmailPicker() {
    if (emailPickerEl) {
      emailPickerEl.classList.remove('visible');
    }
  }

  function initDualEmailModal() {
    if (document.getElementById('smartfill-email-modal-overlay')) return;

    emailModalOverlayEl = document.createElement('div');
    emailModalOverlayEl.id = 'smartfill-email-modal-overlay';
    emailModalOverlayEl.innerHTML = `
      <div class="sf-modal-card">
        <div class="sf-modal-header">
          <div class="sf-modal-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2.5">
              <path d="m13 2-2 2.5h3L11 8l5-2-3 8h3L11 22l1-7H9l2-5-4 1.5L13 2z"/>
            </svg>
            Dual Email Autofill
          </div>
          <button type="button" class="sf-picker-close" id="sfModalCloseBtn">✕</button>
        </div>
        <div class="sf-modal-desc">
          This form requests your email. Select which email address to use for this submission:
        </div>
        <div class="sf-modal-options">
          <button type="button" class="sf-modal-btn" id="sfModalPrimaryBtn">
            <span class="btn-icon">👤</span>
            <div>
              <div class="btn-main">Use Primary Email</div>
              <div class="btn-sub" id="sfModalPrimaryVal"></div>
            </div>
          </button>
          <button type="button" class="sf-modal-btn" id="sfModalSecondaryBtn">
            <span class="btn-icon">💼</span>
            <div>
              <div class="btn-main">Use Work / Secondary Email</div>
              <div class="btn-sub" id="sfModalSecondaryVal"></div>
            </div>
          </button>
        </div>
        <div class="sf-modal-footer">
          <button type="button" class="sf-modal-cancel" id="sfModalCancelBtn">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(emailModalOverlayEl);
  }

  function showDualEmailAutofillModal(userData, categoryFilter, primaryEmail, secondaryEmail) {
    if (!emailModalOverlayEl) initDualEmailModal();

    document.getElementById('sfModalPrimaryVal').textContent = primaryEmail;
    document.getElementById('sfModalSecondaryVal').textContent = secondaryEmail;

    const modalPrimaryBtn = document.getElementById('sfModalPrimaryBtn');
    const modalSecondaryBtn = document.getElementById('sfModalSecondaryBtn');
    const modalCloseBtn = document.getElementById('sfModalCloseBtn');
    const modalCancelBtn = document.getElementById('sfModalCancelBtn');

    const closeModal = () => {
      emailModalOverlayEl.classList.remove('show');
    };

    modalPrimaryBtn.onclick = () => {
      closeModal();
      executePageAutofill(userData, categoryFilter, 'primary');
    };

    modalSecondaryBtn.onclick = () => {
      closeModal();
      executePageAutofill(userData, categoryFilter, 'secondary');
    };

    modalCloseBtn.onclick = closeModal;
    modalCancelBtn.onclick = closeModal;

    emailModalOverlayEl.classList.add('show');
  }

  // =========================================================================
  // Floating Helper Badge Setup & Positioning
  // =========================================================================
  function initFloatingBadge() {
    if (document.getElementById('smartfill-floating-badge')) return;

    floatingBadgeEl = document.createElement('div');
    floatingBadgeEl.id = 'smartfill-floating-badge';
    floatingBadgeEl.innerHTML = `
      <svg class="sf-icon" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" stroke-width="2.5">
        <path d="m13 2-2 2.5h3L11 8l5-2-3 8h3L11 22l1-7H9l2-5-4 1.5L13 2z"/>
      </svg>
      <span>SmartFill</span>
    `;
    document.body.appendChild(floatingBadgeEl);

    floatingBadgeEl.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isContextValid()) return;

      try {
        if (!cachedUserData) {
          cachedUserData = await chrome.storage.local.get(null);
        }
      } catch (_) {}

      if (activeFocusedInput && cachedUserData) {
        const match = FieldMatcher.matchField(activeFocusedInput, cachedUserData);
        // If it's a generic email field and user has dual emails configured, show interactive picker
        if (match && match.isEmail && match.hasDualEmail && match.primaryEmail && match.secondaryEmail) {
          showEmailPicker(activeFocusedInput, match.primaryEmail, match.secondaryEmail);
          return;
        }

        if (match && match.value) {
          injectValue(activeFocusedInput, match.value);
          showToastHUD('Field Filled', `Inserted ${match.key}`);
        } else {
          autofillCurrentPage(cachedUserData);
        }
      } else if (cachedUserData) {
        autofillCurrentPage(cachedUserData);
      }
    });

    document.addEventListener('focusin', async (e) => {
      if (!floatingBadgeEnabled) return;
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        activeFocusedInput = target;
        positionBadge(target);
      }
    });

    document.addEventListener('focusout', () => {
      setTimeout(() => {
        if (document.activeElement !== activeFocusedInput && !floatingBadgeEl?.matches(':hover') && !emailPickerEl?.matches(':hover')) {
          floatingBadgeEl?.classList.remove('visible');
          hideEmailPicker();
        }
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (emailPickerEl && !emailPickerEl.contains(e.target) && !floatingBadgeEl?.contains(e.target)) {
        hideEmailPicker();
      }
    });

    window.addEventListener('scroll', () => {
      if (activeFocusedInput && floatingBadgeEl?.classList.contains('visible')) {
        positionBadge(activeFocusedInput);
      }
      if (activeFocusedInput && emailPickerEl?.classList.contains('visible')) {
        hideEmailPicker();
      }
    }, { passive: true });

    // MutationObserver to detect dynamically rendered SPA forms
    const observer = new MutationObserver(() => {
      if (activeFocusedInput && floatingBadgeEl?.classList.contains('visible')) {
        positionBadge(activeFocusedInput);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function positionBadge(target) {
    if (!floatingBadgeEl) return;
    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    floatingBadgeEl.style.top = `${rect.top + scrollY - 28}px`;
    floatingBadgeEl.style.left = `${rect.right + scrollX - 90}px`;
    floatingBadgeEl.classList.add('visible');
  }

  // Runtime Message Listeners
  if (isContextValid()) {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'AUTOFIL_PAGE') {
          (async () => {
            const count = await autofillCurrentPage(message.data, message.menuFilter, message.preferredEmail);
            sendResponse({ success: true, count: count });
          })();
          return true;
        }

        if (message.action === 'AUTOFIL_SINGLE_FIELD') {
          (async () => {
            if (activeFocusedInput) {
              injectValue(activeFocusedInput, message.value);
              sendResponse({ success: true });
            }
          })();
          return true;
        }
      });
    } catch (_) {}
  }

  if (document.body) {
    initFloatingBadge();
    initEmailPicker();
    initDualEmailModal();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      initFloatingBadge();
      initEmailPicker();
      initDualEmailModal();
    });
  }
})();
