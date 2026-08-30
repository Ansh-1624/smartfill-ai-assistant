/**
 * SmartFill AI Assistant — Popup Controller (popup.js)
 * Manages UI interactions, dynamic greeting, storage meter, PIN vault lock/unlock,
 * data persistence, file compression, custom fields, and autofill triggering.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Pre-configured default profile data for instant 1-click test out of the box
  const DEFAULT_DEMO_DATA = {
    personal: {
      fullName: 'Alex Morgan',
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      dob: '1995-06-15',
      gender: 'Male'
    },
    address: {
      streetAddress: '123 Innovation Way',
      addressLine2: 'Suite 400',
      city: 'San Francisco',
      state: 'California',
      zipCode: '94105',
      country: 'United States'
    },
    professional: {
      jobTitle: 'Senior AI Software Engineer',
      company: 'Tech Innovations Inc.',
      linkedin: 'https://linkedin.com/in/alexmorgan',
      github: 'https://github.com/alexmorgan',
      skills: 'JavaScript, Python, React, Cloud Architecture, UI/UX',
      bio: 'Experienced software engineer specializing in modern web applications, intelligent assistants, and scalable cloud systems.'
    },
    documents: [
      {
        id: 'doc_passport_sample',
        type: 'Passport',
        name: 'Passport',
        number: 'X1234567',
        uploadedAt: '2026-08-30'
      },
      {
        id: 'doc_pan_sample',
        type: 'PAN',
        name: 'PAN Card',
        number: 'ABCDE1234F',
        uploadedAt: '2026-08-30'
      }
    ],
    customFields: [
      {
        id: 'cf_voter_sample',
        key: 'Voter ID',
        value: 'VOTER-12345'
      }
    ],
    settings: {
      theme: 'dark',
      floatingBadge: true
    },
    pinConfig: {
      enabled: false,
      hash: null,
      salt: null
    }
  };

  // State variables
  let appData = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
  let pendingUploadedFile = null;
  let isSettingNewPin = false;

  // DOM Elements
  const greetingText = document.getElementById('greetingText');
  const userGreetingName = document.getElementById('userGreetingName');
  const storageUsageText = document.getElementById('storageUsageText');
  const storageMeterFill = document.getElementById('storageMeterFill');
  const quickFillBtn = document.getElementById('quickFillBtn');
  const lockToggleBtn = document.getElementById('lockToggleBtn');
  const lockIcon = document.getElementById('lockIcon');
  const lockBtnText = document.getElementById('lockBtnText');
  const navTabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const saveAllBtn = document.getElementById('saveAllBtn');
  const toastNotification = document.getElementById('toastNotification');

  // Documents elements
  const dropzone = document.getElementById('dropzone');
  const docFileInput = document.getElementById('docFileInput');
  const docMetaForm = document.getElementById('docMetaForm');
  const newDocType = document.getElementById('newDocType');
  const newDocName = document.getElementById('newDocName');
  const newDocNumber = document.getElementById('newDocNumber');
  const saveDocBtn = document.getElementById('saveDocBtn');
  const cancelDocBtn = document.getElementById('cancelDocBtn');
  const docsList = document.getElementById('docsList');

  // Custom Fields elements
  const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
  const customFieldsList = document.getElementById('customFieldsList');

  // Settings elements
  const loadDemoDataBtn = document.getElementById('loadDemoDataBtn');
  const themeToggle = document.getElementById('themeToggle');
  const floatingBadgeToggle = document.getElementById('floatingBadgeToggle');
  const pinProtectionToggle = document.getElementById('pinProtectionToggle');
  const pinConfigActions = document.getElementById('pinConfigActions');
  const changePinBtn = document.getElementById('changePinBtn');
  const exportBackupBtn = document.getElementById('exportBackupBtn');
  const importBackupBtn = document.getElementById('importBackupBtn');
  const importFileInput = document.getElementById('importFileInput');
  const openOptionsBtn = document.getElementById('openOptionsBtn');
  const clearDataBtn = document.getElementById('clearDataBtn');

  // PIN Modal elements
  const pinModal = document.getElementById('pinModal');
  const pinModalCard = document.getElementById('pinModalCard');
  const pinModalTitle = document.getElementById('pinModalTitle');
  const pinModalSubtitle = document.getElementById('pinModalSubtitle');
  const pinDigitBoxes = document.querySelectorAll('.pin-digit-box');
  const pinErrorMsg = document.getElementById('pinErrorMsg');
  const cancelPinBtn = document.getElementById('cancelPinBtn');
  const submitPinBtn = document.getElementById('submitPinBtn');

  // =========================================================================
  // 1. Initialization & Greeting
  // =========================================================================
  async function init() {
    await loadStoredData();
    updateDynamicGreeting();
    await updateStorageMeter();
    setupTabNavigation();
    setupPinInputs();
    setupEventListeners();
    await checkVaultLockState();
  }

  function updateDynamicGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour >= 5 && hour < 12) greeting = 'Good Morning';
    else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17 && hour < 22) greeting = 'Good Evening';
    else greeting = 'Welcome';

    const name = appData.personal?.firstName || appData.personal?.fullName?.split(' ')[0] || '';
    greetingText.textContent = `${greeting}${name ? ', ' + name : ''} 👋`;
    userGreetingName.textContent = appData.personal?.jobTitle ? `${appData.personal.jobTitle} • Active` : 'SmartFill Vault Active';
  }

  async function updateStorageMeter() {
    const usage = await FileHandler.getStorageUsage();
    storageUsageText.textContent = `${usage.formattedUsed} / ${usage.formattedQuota} (${usage.percentage}%)`;
    storageMeterFill.style.width = `${Math.min(100, Math.max(4, usage.percentage))}%`;

    if (usage.isWarning) {
      storageMeterFill.classList.add('warning');
    } else {
      storageMeterFill.classList.remove('warning');
    }
  }

  // =========================================================================
  // 2. Data Load & Populate Form
  // =========================================================================
  async function loadStoredData() {
    try {
      const stored = await chrome.storage.local.get(null);

      // If storage is empty, initialize with default demo profile
      if (!stored.personal || Object.keys(stored.personal).length === 0) {
        await chrome.storage.local.set(DEFAULT_DEMO_DATA);
        appData = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
      } else {
        if (stored.personal) appData.personal = stored.personal;
        if (stored.address) appData.address = stored.address;
        if (stored.professional) appData.professional = stored.professional;
        if (stored.documents) appData.documents = stored.documents;
        if (stored.customFields) appData.customFields = stored.customFields;
        if (stored.settings) appData.settings = { ...appData.settings, ...stored.settings };
        if (stored.pinConfig) appData.pinConfig = stored.pinConfig;
      }

      populateFormFields();
    } catch (e) {
      console.error('Failed to load stored data:', e);
    }
  }

  function populateFormFields() {
    // Personal
    document.getElementById('pFullName').value = appData.personal?.fullName || '';
    document.getElementById('pFirstName').value = appData.personal?.firstName || '';
    document.getElementById('pLastName').value = appData.personal?.lastName || '';
    document.getElementById('pEmail').value = appData.personal?.email || '';
    document.getElementById('pPhone').value = appData.personal?.phone || '';
    document.getElementById('pDob').value = appData.personal?.dob || '';
    document.getElementById('pGender').value = appData.personal?.gender || '';

    // Address
    document.getElementById('aFlatNo').value = appData.address?.flatNo || '';
    document.getElementById('aStreet').value = appData.address?.streetAddress || '';
    document.getElementById('aCity').value = appData.address?.city || '';
    document.getElementById('aState').value = appData.address?.state || '';
    document.getElementById('aZip').value = appData.address?.zipCode || '';
    document.getElementById('aCountry').value = appData.address?.country || '';
    document.getElementById('aFullAddress').value = appData.address?.fullAddress || '';

    // Professional
    document.getElementById('prJobTitle').value = appData.professional?.jobTitle || '';
    document.getElementById('prCompany').value = appData.professional?.company || '';
    document.getElementById('prLinkedIn').value = appData.professional?.linkedin || '';
    document.getElementById('prGithub').value = appData.professional?.github || '';
    document.getElementById('prSkills').value = appData.professional?.skills || '';
    document.getElementById('prBio').value = appData.professional?.bio || '';

    // Settings
    themeToggle.checked = appData.settings?.theme === 'light';
    applyTheme(appData.settings?.theme || 'dark');

    floatingBadgeToggle.checked = appData.settings?.floatingBadge !== false;
    pinProtectionToggle.checked = !!appData.pinConfig?.enabled;
    pinConfigActions.style.display = appData.pinConfig?.enabled ? 'block' : 'none';

    renderDocumentsList();
    renderCustomFieldsList();
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (appData.settings) appData.settings.theme = theme;
  }

  // =========================================================================
  // 3. Vault Lock & PIN Security Flow
  // =========================================================================
  async function checkVaultLockState() {
    if (!appData.pinConfig || !appData.pinConfig.enabled) {
      setVaultUIState(false);
      return;
    }

    const isUnlocked = await CryptoManager.isSessionUnlocked();
    setVaultUIState(!isUnlocked);
  }

  function setVaultUIState(isLocked) {
    if (isLocked) {
      document.body.classList.add('vault-locked');
      lockIcon.textContent = '🔒';
      lockBtnText.textContent = 'Locked';
      lockToggleBtn.classList.remove('btn-emerald');
      lockToggleBtn.classList.add('btn-secondary');
    } else {
      document.body.classList.remove('vault-locked');
      lockIcon.textContent = '🔓';
      lockBtnText.textContent = 'Unlocked';
      lockToggleBtn.classList.add('btn-emerald');
      lockToggleBtn.classList.remove('btn-secondary');
    }
  }

  function openPinModal(isSetup = false, title = '', subtitle = '') {
    isSettingNewPin = isSetup;
    pinErrorMsg.textContent = '';
    pinDigitBoxes.forEach(box => { box.value = ''; });

    if (isSetup) {
      pinModalTitle.textContent = title || 'Create 4-Digit PIN';
      pinModalSubtitle.textContent = subtitle || 'Enter a memorable PIN to secure your data vault';
      submitPinBtn.textContent = 'Save PIN';
    } else {
      pinModalTitle.textContent = 'Enter Security PIN';
      pinModalSubtitle.textContent = 'Unlock your vault to view and modify your private data';
      submitPinBtn.textContent = 'Unlock Vault';
    }

    pinModal.classList.add('active');
    setTimeout(() => { pinDigitBoxes[0].focus(); }, 150);
  }

  function closePinModal() {
    pinModal.classList.remove('active');
    pinDigitBoxes.forEach(box => { box.value = ''; });
    pinErrorMsg.textContent = '';
  }

  function setupPinInputs() {
    pinDigitBoxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length === 1) {
          if (idx < pinDigitBoxes.length - 1) {
            pinDigitBoxes[idx + 1].focus();
          } else {
            submitPinBtn.focus();
          }
        }
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          pinDigitBoxes[idx - 1].focus();
        } else if (e.key === 'Enter') {
          handlePinSubmit();
        }
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (text.length >= 4) {
          for (let i = 0; i < 4; i++) {
            pinDigitBoxes[i].value = text[i];
          }
          submitPinBtn.focus();
        }
      });
    });
  }

  async function handlePinSubmit() {
    const pin = Array.from(pinDigitBoxes).map(b => b.value).join('');
    if (pin.length < 4) {
      showPinError('Please enter all 4 digits');
      return;
    }

    if (isSettingNewPin) {
      const salt = CryptoManager.generateSalt();
      const hash = await CryptoManager.hashPin(pin, salt);

      appData.pinConfig = {
        enabled: true,
        hash: hash,
        salt: salt
      };

      await chrome.storage.local.set({ pinConfig: appData.pinConfig });
      await CryptoManager.setSessionUnlocked();
      setVaultUIState(false);
      pinProtectionToggle.checked = true;
      pinConfigActions.style.display = 'block';
      closePinModal();
      showToast('Security PIN enabled! 🛡️');
    } else {
      const isValid = await CryptoManager.verifyPin(pin, appData.pinConfig.hash, appData.pinConfig.salt);
      if (isValid) {
        await CryptoManager.setSessionUnlocked();
        setVaultUIState(false);
        closePinModal();
        showToast('Vault unlocked! 🔓');
      } else {
        showPinError('Incorrect PIN. Please try again.');
        pinModalCard.classList.add('shake');
        setTimeout(() => pinModalCard.classList.remove('shake'), 500);
        pinDigitBoxes.forEach(b => b.value = '');
        pinDigitBoxes[0].focus();
      }
    }
  }

  function showPinError(msg) {
    pinErrorMsg.textContent = msg;
  }

  // =========================================================================
  // 4. Tab Navigation
  // =========================================================================
  function setupTabNavigation() {
    navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navTabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        const panel = document.getElementById(`tab-${targetTab}`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // =========================================================================
  // 5. Event Listeners & Quick Fill
  // =========================================================================
  function setupEventListeners() {
    // Lock Button
    lockToggleBtn.addEventListener('click', async () => {
      if (document.body.classList.contains('vault-locked')) {
        openPinModal(false);
      } else if (appData.pinConfig && appData.pinConfig.enabled) {
        await CryptoManager.lockSession();
        setVaultUIState(true);
        showToast('Vault locked 🔒');
      } else {
        openPinModal(true, 'Enable PIN Protection', 'Create a 4-digit PIN to lock your private records');
      }
    });

    // Dropzone & File Pickers
    dropzone.addEventListener('click', () => docFileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await handleIncomingFile(e.dataTransfer.files[0]);
      }
    });

    docFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await handleIncomingFile(e.target.files[0]);
      }
    });

    // Document Meta Form actions
    saveDocBtn.addEventListener('click', async () => {
      if (!pendingUploadedFile) return;

      const docItem = {
        id: 'doc_' + Date.now(),
        type: newDocType.value,
        name: newDocName.value.trim() || newDocType.value,
        number: newDocNumber.value.trim(),
        fileBase64: pendingUploadedFile.base64,
        fileSize: pendingUploadedFile.size,
        fileName: pendingUploadedFile.name,
        fileType: pendingUploadedFile.type,
        uploadedAt: new Date().toLocaleDateString()
      };

      if (!Array.isArray(appData.documents)) appData.documents = [];
      appData.documents.push(docItem);
      await chrome.storage.local.set({ documents: appData.documents });
      await updateStorageMeter();

      pendingUploadedFile = null;
      docFileInput.value = '';
      newDocName.value = '';
      newDocNumber.value = '';
      docMetaForm.style.display = 'none';
      dropzone.style.display = 'block';

      renderDocumentsList();
      showToast('Document saved & compressed! 📄');
    });

    cancelDocBtn.addEventListener('click', () => {
      pendingUploadedFile = null;
      docFileInput.value = '';
      docMetaForm.style.display = 'none';
      dropzone.style.display = 'block';
    });

    // Custom Fields
    addCustomFieldBtn.addEventListener('click', () => {
      if (!Array.isArray(appData.customFields)) appData.customFields = [];
      appData.customFields.push({ id: 'cf_' + Date.now(), key: '', value: '' });
      renderCustomFieldsList();
    });

    // Demo Data Loader
    if (loadDemoDataBtn) {
      loadDemoDataBtn.addEventListener('click', async () => {
        appData = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
        await chrome.storage.local.set(appData);
        populateFormFields();
        await updateStorageMeter();
        updateDynamicGreeting();
        showToast('Demo profile loaded! ✨');
      });
    }

    // Settings
    themeToggle.addEventListener('change', async (e) => {
      const theme = e.target.checked ? 'light' : 'dark';
      applyTheme(theme);
      await chrome.storage.local.set({ settings: appData.settings });
    });

    floatingBadgeToggle.addEventListener('change', async (e) => {
      if (!appData.settings) appData.settings = {};
      appData.settings.floatingBadge = e.target.checked;
      await chrome.storage.local.set({ settings: appData.settings });
      showToast('Floating badge updated');
    });

    pinProtectionToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        openPinModal(true, 'Setup Security PIN');
      } else {
        if (confirm('Disable PIN protection?')) {
          appData.pinConfig.enabled = false;
          await chrome.storage.local.set({ pinConfig: appData.pinConfig });
          await CryptoManager.lockSession();
          setVaultUIState(false);
          pinConfigActions.style.display = 'none';
          showToast('PIN protection disabled');
        } else {
          pinProtectionToggle.checked = true;
        }
      }
    });

    changePinBtn.addEventListener('click', () => {
      openPinModal(true, 'Change Security PIN', 'Enter a new 4-digit PIN for your vault');
    });

    exportBackupBtn.addEventListener('click', async () => {
      const json = await FileHandler.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartfill_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup downloaded! 📥');
    });

    importBackupBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            await FileHandler.importBackup(evt.target.result);
            await loadStoredData();
            await updateStorageMeter();
            showToast('Backup restored! 🎉');
          } catch (err) {
            alert('Restore failed: ' + err.message);
          }
        };
        reader.readAsText(file);
      }
    });

    openOptionsBtn.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options/options.html'));
      }
    });

    clearDataBtn.addEventListener('click', async () => {
      if (confirm('⚠️ Erase all saved data, documents, and credentials?')) {
        await chrome.storage.local.clear();
        await CryptoManager.lockSession();
        appData = {
          personal: {},
          address: {},
          professional: {},
          documents: [],
          customFields: [],
          settings: { theme: 'dark', floatingBadge: true },
          pinConfig: { enabled: false }
        };
        populateFormFields();
        await updateStorageMeter();
        showToast('All data cleared');
      }
    });

    // Real-Time Input Validation Handlers
    const pEmail = document.getElementById('pEmail');
    const pEmailHint = document.getElementById('pEmailHint');
    const pPhone = document.getElementById('pPhone');
    const pPhoneHint = document.getElementById('pPhoneHint');
    const pDob = document.getElementById('pDob');
    const pDobHint = document.getElementById('pDobHint');
    const prLinkedIn = document.getElementById('prLinkedIn');
    const prGithub = document.getElementById('prGithub');

    function updateValidationUI(inputEl, hintEl, res) {
      if (!inputEl.value.trim()) {
        inputEl.classList.remove('input-valid', 'input-invalid');
        if (hintEl) {
          hintEl.textContent = '';
          hintEl.className = 'validation-hint';
        }
        return;
      }
      if (res.isValid) {
        inputEl.classList.add('input-valid');
        inputEl.classList.remove('input-invalid');
        if (hintEl) {
          hintEl.textContent = res.message;
          hintEl.className = 'validation-hint valid';
        }
      } else {
        inputEl.classList.add('input-invalid');
        inputEl.classList.remove('input-valid');
        if (hintEl) {
          hintEl.textContent = res.message;
          hintEl.className = 'validation-hint invalid';
        }
      }
    }

    pEmail.addEventListener('input', () => {
      const res = DataValidator.validateEmail(pEmail.value);
      updateValidationUI(pEmail, pEmailHint, res);
    });

    pPhone.addEventListener('input', () => {
      const res = DataValidator.validatePhone(pPhone.value);
      updateValidationUI(pPhone, pPhoneHint, res);
    });

    pDob.addEventListener('change', () => {
      const res = DataValidator.validateDob(pDob.value);
      updateValidationUI(pDob, pDobHint, res);
    });

    prLinkedIn.addEventListener('blur', () => {
      if (prLinkedIn.value.trim()) {
        const res = DataValidator.validateUrl(prLinkedIn.value);
        if (res.isValid) prLinkedIn.value = res.formatted;
      }
    });

    prGithub.addEventListener('blur', () => {
      if (prGithub.value.trim()) {
        const res = DataValidator.validateUrl(prGithub.value);
        if (res.isValid) prGithub.value = res.formatted;
      }
    });

    const autoFormatAddressBtn = document.getElementById('autoFormatAddressBtn');
    if (autoFormatAddressBtn) {
      autoFormatAddressBtn.addEventListener('click', () => {
        const flatNo = document.getElementById('aFlatNo').value.trim();
        const street = document.getElementById('aStreet').value.trim();
        const city = document.getElementById('aCity').value.trim();
        const state = document.getElementById('aState').value.trim();
        const zip = document.getElementById('aZip').value.trim();
        const country = document.getElementById('aCountry').value.trim();

        const parts = [flatNo, street, city, state, zip, country].filter(Boolean);
        document.getElementById('aFullAddress').value = parts.join(', ');
        showToast('Full address synced! 📍');
      });
    }

    // Save All Button
    saveAllBtn.addEventListener('click', async () => {
      collectFormData();

      // Validate critical fields before saving
      const emailCheck = DataValidator.validateEmail(appData.personal.email);
      const phoneCheck = DataValidator.validatePhone(appData.personal.phone);
      const dobCheck = DataValidator.validateDob(appData.personal.dob);

      if (!emailCheck.isValid) {
        showToast('⚠️ Please check invalid email format');
        pEmail.focus();
        return;
      }
      if (!phoneCheck.isValid) {
        showToast('⚠️ Please check phone number digits');
        pPhone.focus();
        return;
      }
      if (!dobCheck.isValid) {
        showToast(`⚠️ ${dobCheck.message}`);
        pDob.focus();
        return;
      }

      await chrome.storage.local.set({
        personal: appData.personal,
        address: appData.address,
        professional: appData.professional,
        customFields: appData.customFields,
        documents: appData.documents,
        settings: appData.settings
      });
      await updateStorageMeter();
      updateDynamicGreeting();
      showToast('All changes validated & saved! 💾');
    });

    // Quick Fill Form Button (Robust with dynamic injection fallback)
    quickFillBtn.addEventListener('click', async () => {
      collectFormData();
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          showToast('No active tab found');
          return;
        }

        // Proactively ensure content script and CSS are injected on the tab
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['utils/fieldMatcher.js', 'content/content.js']
          });
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['content/content.css']
          });
        } catch (_) {
          // May fail if already injected or on restricted chrome:// page, proceed to message
        }

        const response = await chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOFIL_PAGE',
          data: appData
        });

        if (response && response.count !== undefined) {
          showToast(`⚡ Filled ${response.count} field${response.count === 1 ? '' : 's'}!`);
        } else {
          showToast('Autofilled page!');
        }
      } catch (err) {
        console.error('Autofill dispatch error:', err);
        showToast('Autofill sent. Refresh page if fields did not highlight.');
      }
    });

    // PIN Modal Buttons
    submitPinBtn.addEventListener('click', handlePinSubmit);
    cancelPinBtn.addEventListener('click', closePinModal);
  }

  async function handleIncomingFile(file) {
    try {
      showToast('Compressing file with Canvas engine...');
      pendingUploadedFile = await FileHandler.processFile(file);
      
      newDocName.value = file.name.replace(/\.[^/.]+$/, '');
      docMetaForm.style.display = 'block';
      dropzone.style.display = 'none';
      newDocNumber.focus();
    } catch (err) {
      alert(err.message);
    }
  }

  function collectFormData() {
    appData.personal = {
      fullName: document.getElementById('pFullName').value.trim(),
      firstName: document.getElementById('pFirstName').value.trim(),
      lastName: document.getElementById('pLastName').value.trim(),
      email: document.getElementById('pEmail').value.trim(),
      phone: document.getElementById('pPhone').value.trim(),
      dob: document.getElementById('pDob').value,
      gender: document.getElementById('pGender').value
    };

    appData.address = {
      flatNo: (document.getElementById('aFlatNo')?.value || '').trim(),
      streetAddress: (document.getElementById('aStreet')?.value || '').trim(),
      city: (document.getElementById('aCity')?.value || '').trim(),
      state: (document.getElementById('aState')?.value || '').trim(),
      zipCode: (document.getElementById('aZip')?.value || '').trim(),
      country: (document.getElementById('aCountry')?.value || '').trim(),
      fullAddress: (document.getElementById('aFullAddress')?.value || '').trim()
    };

    appData.professional = {
      jobTitle: document.getElementById('prJobTitle').value.trim(),
      company: document.getElementById('prCompany').value.trim(),
      linkedin: document.getElementById('prLinkedIn').value.trim(),
      github: document.getElementById('prGithub').value.trim(),
      skills: document.getElementById('prSkills').value.trim(),
      bio: document.getElementById('prBio').value.trim()
    };

    const fieldRows = customFieldsList.querySelectorAll('.custom-field-row');
    const updatedCustoms = [];
    fieldRows.forEach(row => {
      const k = row.querySelector('.key-input').value.trim();
      const v = row.querySelector('.val-input').value.trim();
      const id = row.getAttribute('data-id');
      if (k || v) {
        updatedCustoms.push({ id: id || 'cf_' + Math.random(), key: k, value: v });
      }
    });
    appData.customFields = updatedCustoms;
  }

  // =========================================================================
  // 6. Dynamic Renders (Documents & Custom Fields)
  // =========================================================================
  function renderDocumentsList() {
    docsList.innerHTML = '';
    if (!appData.documents || appData.documents.length === 0) {
      docsList.innerHTML = '<p style="text-align:center; font-size:11.5px; color:var(--text-muted); padding:10px;">No documents saved yet.</p>';
      return;
    }

    appData.documents.forEach((doc, idx) => {
      const card = document.createElement('div');
      card.className = 'doc-item-card';

      const maskedNum = doc.number ? (doc.number.length > 4 ? '•••• ' + doc.number.slice(-4) : '••••') : 'No number';
      const formattedSize = doc.fileSize ? (doc.fileSize < 1024 ? doc.fileSize + 'B' : Math.round(doc.fileSize/1024) + ' KB') : '';

      card.innerHTML = `
        <div class="doc-item-info">
          <span class="doc-item-title">${escapeHTML(doc.name)} <span style="font-size:10px; font-weight:normal; color:var(--text-muted)">(${escapeHTML(doc.type)}${formattedSize ? ' • ' + formattedSize : ''})</span></span>
          <span class="doc-item-num"><span class="masked-num" data-full="${escapeHTML(doc.number || '')}">${maskedNum}</span></span>
        </div>
        <div class="doc-item-actions">
          ${doc.number ? `<button class="btn-icon copy-num-btn" title="Copy Number">📋</button>` : ''}
          ${doc.fileBase64 ? `<button class="btn-icon view-doc-btn" title="View / Download">👁️</button>` : ''}
          <button class="btn-icon delete-doc-btn" title="Delete" style="color:#f43f5e;">✕</button>
        </div>
      `;

      const copyBtn = card.querySelector('.copy-num-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(doc.number);
          showToast(`Copied ${doc.name} number! 📋`);
        });
      }

      const viewBtn = card.querySelector('.view-doc-btn');
      if (viewBtn) {
        viewBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const win = window.open();
          win.document.write(`<iframe src="${doc.fileBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        });
      }

      const delBtn = card.querySelector('.delete-doc-btn');
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete document "${doc.name}"?`)) {
          appData.documents.splice(idx, 1);
          await chrome.storage.local.set({ documents: appData.documents });
          await updateStorageMeter();
          renderDocumentsList();
          showToast('Document deleted');
        }
      });

      docsList.appendChild(card);
    });
  }

  function renderCustomFieldsList() {
    customFieldsList.innerHTML = '';
    if (!appData.customFields || appData.customFields.length === 0) {
      customFieldsList.innerHTML = '<p style="text-align:center; font-size:11.5px; color:var(--text-muted); padding:8px;">No custom field aliases yet.</p>';
      return;
    }

    appData.customFields.forEach((cf, idx) => {
      const row = document.createElement('div');
      row.className = 'custom-field-row';
      row.setAttribute('data-id', cf.id || 'cf_' + idx);

      row.innerHTML = `
        <input type="text" class="input-3d key-input" placeholder="Field Alias (e.g. Voter ID)" value="${escapeHTML(cf.key || '')}">
        <input type="text" class="input-3d val-input" placeholder="Value" value="${escapeHTML(cf.value || '')}">
        <button class="btn-icon delete-cf-btn" title="Remove" style="color:#f43f5e;">✕</button>
      `;

      row.querySelector('.delete-cf-btn').addEventListener('click', () => {
        appData.customFields.splice(idx, 1);
        renderCustomFieldsList();
      });

      customFieldsList.appendChild(row);
    });
  }

  function showToast(msg) {
    toastNotification.textContent = msg;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2800);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  await init();
});
