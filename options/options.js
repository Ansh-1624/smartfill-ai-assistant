/**
 * SmartFill AI Assistant — Options Page Controller (options.js)
 */

document.addEventListener('DOMContentLoaded', async () => {
  let appData = {
    personal: {},
    address: {},
    professional: {},
    documents: [],
    customFields: [],
    settings: { theme: 'dark' },
    pinConfig: { enabled: false }
  };

  let isSettingPin = false;

  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  const pageSectionTitle = document.getElementById('pageSectionTitle');
  const optSaveBtn = document.getElementById('optSaveBtn');
  const sidebarLockStatus = document.getElementById('sidebarLockStatus');
  const sidebarLockText = document.getElementById('sidebarLockText');
  const sidebarUnlockBtn = document.getElementById('sidebarUnlockBtn');

  // Stats Elements
  const statStorageText = document.getElementById('statStorageText');
  const optStorageMeterFill = document.getElementById('optStorageMeterFill');
  const statDocsCount = document.getElementById('statDocsCount');
  const statAliasesCount = document.getElementById('statAliasesCount');

  // Inputs
  const optFullName = document.getElementById('optFullName');
  const optFirstName = document.getElementById('optFirstName');
  const optLastName = document.getElementById('optLastName');
  const optEmail = document.getElementById('optEmail');
  const optSecondaryEmail = document.getElementById('optSecondaryEmail');
  const optPhone = document.getElementById('optPhone');
  const optDob = document.getElementById('optDob');
  const optGender = document.getElementById('optGender');

  const optFlatNo = document.getElementById('optFlatNo');
  const optStreet = document.getElementById('optStreet');
  const optCity = document.getElementById('optCity');
  const optState = document.getElementById('optState');
  const optZip = document.getElementById('optZip');
  const optCountry = document.getElementById('optCountry');
  const optFullAddress = document.getElementById('optFullAddress');

  const optJobTitle = document.getElementById('optJobTitle');
  const optCompany = document.getElementById('optCompany');
  const optLinkedIn = document.getElementById('optLinkedIn');
  const optGithub = document.getElementById('optGithub');
  const optSkills = document.getElementById('optSkills');
  const optBio = document.getElementById('optBio');

  // Documents
  const optUploadTriggerBtn = document.getElementById('optUploadTriggerBtn');
  const optFileInput = document.getElementById('optFileInput');
  const optDocsGrid = document.getElementById('optDocsGrid');
  const docPreviewModal = document.getElementById('docPreviewModal');
  const previewDocTitle = document.getElementById('previewDocTitle');
  const previewFrameContainer = document.getElementById('previewFrameContainer');
  const closeDocPreviewBtn = document.getElementById('closeDocPreviewBtn');

  // Custom Fields
  const optAddAliasBtn = document.getElementById('optAddAliasBtn');
  const optCustomList = document.getElementById('optCustomList');

  // Security
  const optPinToggle = document.getElementById('optPinToggle');
  const optPinActions = document.getElementById('optPinActions');
  const optChangePinBtn = document.getElementById('optChangePinBtn');
  const optExportBtn = document.getElementById('optExportBtn');
  const optImportBtn = document.getElementById('optImportBtn');
  const optImportFile = document.getElementById('optImportFile');
  const optResetBtn = document.getElementById('optResetBtn');

  // PIN Modal
  const optPinModal = document.getElementById('optPinModal');
  const optPinModalTitle = document.getElementById('optPinModalTitle');
  const optPinModalSubtitle = document.getElementById('optPinModalSubtitle');
  const optPinBoxes = document.querySelectorAll('[data-opt-pin]');
  const optPinErrorMsg = document.getElementById('optPinErrorMsg');
  const optCancelPinBtn = document.getElementById('optCancelPinBtn');
  const optSubmitPinBtn = document.getElementById('optSubmitPinBtn');
  const optToast = document.getElementById('optToast');

  // Section titles dictionary
  const sectionTitles = {
    overview: 'Overview & Storage Quota',
    profile: 'Personal Profile & Address',
    professional: 'Professional Experience & Bio',
    documents: 'Identity Documents & File Vault',
    custom: 'Custom Form Aliases & Key Mappings',
    security: 'Cryptographic Security, Backups & Reset'
  };

  async function init() {
    await loadData();
    setupNavigation();
    setupEventListeners();
    setupPinInputs();
    await checkLockState();
  }

  async function loadData() {
    const stored = await chrome.storage.local.get(null);
    if (stored.personal) appData.personal = stored.personal;
    if (stored.address) appData.address = stored.address;
    if (stored.professional) appData.professional = stored.professional;
    if (stored.documents) appData.documents = stored.documents;
    if (stored.customFields) appData.customFields = stored.customFields;
    if (stored.settings) appData.settings = stored.settings;
    if (stored.pinConfig) appData.pinConfig = stored.pinConfig;

    // Apply theme
    document.documentElement.dataset.theme = appData.settings.theme || 'dark';

    // Populate Fields
    optFullName.value = appData.personal.fullName || '';
    optFirstName.value = appData.personal.firstName || '';
    optLastName.value = appData.personal.lastName || '';
    optEmail.value = appData.personal.email || '';
    if (optSecondaryEmail) {
      optSecondaryEmail.value = appData.personal.secondaryEmail || '';
    }
    optPhone.value = appData.personal.phone || '';
    optDob.value = appData.personal.dob || '';
    optGender.value = appData.personal.gender || '';

    optFlatNo.value = appData.address.flatNo || '';
    optStreet.value = appData.address.streetAddress || '';
    optCity.value = appData.address.city || '';
    optState.value = appData.address.state || '';
    optZip.value = appData.address.zipCode || '';
    optCountry.value = appData.address.country || '';
    optFullAddress.value = appData.address.fullAddress || '';

    optJobTitle.value = appData.professional.jobTitle || '';
    optCompany.value = appData.professional.company || '';
    optLinkedIn.value = appData.professional.linkedin || '';
    optGithub.value = appData.professional.github || '';
    optSkills.value = appData.professional.skills || '';
    optBio.value = appData.professional.bio || '';

    optPinToggle.checked = !!appData.pinConfig.enabled;
    optPinActions.style.display = appData.pinConfig.enabled ? 'block' : 'none';

    await refreshStats();
    renderDocsGrid();
    renderCustomList();
  }

  async function refreshStats() {
    const usage = await FileHandler.getStorageUsage();
    statStorageText.textContent = `${usage.formattedUsed} / ${usage.formattedQuota}`;
    optStorageMeterFill.style.width = `${Math.min(100, Math.max(3, usage.percentage))}%`;
    if (usage.isWarning) optStorageMeterFill.classList.add('warning');
    else optStorageMeterFill.classList.remove('warning');

    statDocsCount.textContent = `${appData.documents.length} Document${appData.documents.length === 1 ? '' : 's'}`;
    statAliasesCount.textContent = `${appData.customFields.length} Alias${appData.customFields.length === 1 ? '' : 'es'}`;
  }

  async function checkLockState() {
    if (!appData.pinConfig.enabled) {
      setLockUI(false);
      return;
    }
    const unlocked = await CryptoManager.isSessionUnlocked();
    setLockUI(!unlocked);
  }

  function setLockUI(isLocked) {
    if (isLocked) {
      sidebarLockText.textContent = 'Vault Locked';
      sidebarLockStatus.querySelector('.lock-icon').textContent = '🔒';
      sidebarUnlockBtn.style.display = 'block';
      disableInputs(true);
    } else {
      sidebarLockText.textContent = 'Vault Unlocked';
      sidebarLockStatus.querySelector('.lock-icon').textContent = '🔓';
      sidebarUnlockBtn.style.display = 'none';
      disableInputs(false);
    }
  }

  function disableInputs(disabled) {
    const inputs = document.querySelectorAll('input:not([data-opt-pin]), select, textarea');
    inputs.forEach(i => { i.disabled = disabled; });
  }

  function setupNavigation() {
    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        navItems.forEach(b => b.classList.remove('active'));
        contentSections.forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        const secId = btn.getAttribute('data-section');
        const targetSec = document.getElementById(`sec-${secId}`);
        if (targetSec) targetSec.classList.add('active');
        pageSectionTitle.textContent = sectionTitles[secId] || 'Settings';
      });
    });
  }

  function setupEventListeners() {
    optSaveBtn.addEventListener('click', async () => {
      collectData();

      const emailCheck = DataValidator.validateEmail(appData.personal.email);
      const phoneCheck = DataValidator.validatePhone(appData.personal.phone);
      const dobCheck = DataValidator.validateDob(appData.personal.dob);

      if (!emailCheck.isValid) {
        showToast('⚠️ Please correct invalid email address format');
        optEmail.focus();
        return;
      }
      if (appData.personal.secondaryEmail) {
        const secEmailCheck = DataValidator.validateEmail(appData.personal.secondaryEmail);
        if (!secEmailCheck.isValid) {
          showToast('⚠️ Please correct invalid secondary email format');
          if (optSecondaryEmail) optSecondaryEmail.focus();
          return;
        }
      }
      if (!phoneCheck.isValid) {
        showToast('⚠️ Please verify phone number digits');
        optPhone.focus();
        return;
      }
      if (!dobCheck.isValid) {
        showToast(`⚠️ ${dobCheck.message}`);
        optDob.focus();
        return;
      }

      await chrome.storage.local.set({
        personal: appData.personal,
        address: appData.address,
        professional: appData.professional,
        customFields: appData.customFields
      });
      await refreshStats();
      showToast('All changes validated & saved! 💾');
    });

    sidebarUnlockBtn.addEventListener('click', () => {
      openPinModal(false);
    });

    // Upload Document
    optUploadTriggerBtn.addEventListener('click', () => optFileInput.click());
    optFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
          showToast('Compressing file via canvas...');
          const processed = await FileHandler.processFile(file);
          const docName = prompt('Enter document name / title:', file.name.replace(/\.[^/.]+$/, '')) || file.name;
          const docNum = prompt('Enter document / ID number (optional):', '') || '';

          const newDoc = {
            id: 'doc_' + Date.now(),
            type: file.type.includes('pdf') ? 'PDF' : 'Image',
            name: docName,
            number: docNum,
            fileBase64: processed.base64,
            fileSize: processed.size,
            fileName: processed.name,
            fileType: processed.type,
            uploadedAt: new Date().toLocaleDateString()
          };

          appData.documents.push(newDoc);
          await chrome.storage.local.set({ documents: appData.documents });
          await refreshStats();
          renderDocsGrid();
          showToast('Document saved to vault! 📄');
        } catch (err) {
          alert('Upload failed: ' + err.message);
        }
      }
    });

    closeDocPreviewBtn.addEventListener('click', () => {
      docPreviewModal.classList.remove('active');
      previewFrameContainer.innerHTML = '';
    });

    // Custom Aliases
    optAddAliasBtn.addEventListener('click', () => {
      appData.customFields.push({ id: 'cf_' + Date.now(), key: '', value: '' });
      renderCustomList();
    });

    // PIN Toggle
    optPinToggle.addEventListener('change', async (e) => {
      if (e.target.checked) {
        openPinModal(true, 'Enable Vault PIN');
      } else {
        if (confirm('Disable PIN security protection?')) {
          appData.pinConfig.enabled = false;
          await chrome.storage.local.set({ pinConfig: appData.pinConfig });
          await CryptoManager.lockSession();
          setLockUI(false);
          optPinActions.style.display = 'none';
          showToast('PIN disabled');
        } else {
          optPinToggle.checked = true;
        }
      }
    });

    optChangePinBtn.addEventListener('click', () => {
      openPinModal(true, 'Change Vault PIN', 'Set a new 4-digit code');
    });

    // Backups
    optExportBtn.addEventListener('click', async () => {
      const json = await FileHandler.exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartfill_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup file exported 📥');
    });

    optImportBtn.addEventListener('click', () => optImportFile.click());
    optImportFile.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            await FileHandler.importBackup(evt.target.result);
            await loadData();
            showToast('Backup restored! 🎉');
          } catch (err) {
            alert('Import failed: ' + err.message);
          }
        };
        reader.readAsText(e.target.files[0]);
      }
    });

    optResetBtn.addEventListener('click', async () => {
      if (confirm('Erase all saved records, credentials and documents?')) {
        await chrome.storage.local.clear();
        await loadData();
        showToast('Vault wiped clean');
      }
    });

    optSubmitPinBtn.addEventListener('click', handlePinSubmit);
    optCancelPinBtn.addEventListener('click', closePinModal);
  }

  function collectData() {
    appData.personal = {
      fullName: optFullName.value.trim(),
      firstName: optFirstName.value.trim(),
      lastName: optLastName.value.trim(),
      email: optEmail.value.trim(),
      secondaryEmail: (optSecondaryEmail?.value || '').trim(),
      phone: optPhone.value.trim(),
      dob: optDob.value,
      gender: optGender.value
    };

    appData.address = {
      flatNo: optFlatNo.value.trim(),
      streetAddress: optStreet.value.trim(),
      city: optCity.value.trim(),
      state: optState.value.trim(),
      zipCode: optZip.value.trim(),
      country: optCountry.value.trim(),
      fullAddress: optFullAddress.value.trim()
    };

    appData.professional = {
      jobTitle: optJobTitle.value.trim(),
      company: optCompany.value.trim(),
      linkedin: optLinkedIn.value.trim(),
      github: optGithub.value.trim(),
      skills: optSkills.value.trim(),
      bio: optBio.value.trim()
    };

    const rows = optCustomList.querySelectorAll('.custom-field-row');
    const customs = [];
    rows.forEach(r => {
      const k = r.querySelector('.key-input').value.trim();
      const v = r.querySelector('.val-input').value.trim();
      const id = r.getAttribute('data-id');
      if (k || v) customs.push({ id: id || 'cf_' + Math.random(), key: k, value: v });
    });
    appData.customFields = customs;
  }

  function renderDocsGrid() {
    optDocsGrid.innerHTML = '';
    if (!appData.documents.length) {
      optDocsGrid.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">No documents in vault.</p>';
      return;
    }

    appData.documents.forEach((doc, idx) => {
      const card = document.createElement('div');
      card.className = 'glass-card-3d doc-card-expanded';
      const sizeStr = doc.fileSize ? Math.round(doc.fileSize/1024) + ' KB' : 'Unknown';

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h4 style="font-size:14px; font-weight:700;">${escapeHTML(doc.name)}</h4>
            <span class="badge-tag">${escapeHTML(doc.type || 'Doc')}</span>
          </div>
          <p style="font-family:'JetBrains Mono',monospace; font-size:12px; color:var(--text-secondary); margin:6px 0;">
            ${doc.number ? escapeHTML(doc.number) : 'No ID number'}
          </p>
          <p style="font-size:11px; color:var(--text-muted);">Uploaded: ${doc.uploadedAt || 'N/A'} • ${sizeStr}</p>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
          ${doc.fileBase64 ? `<button class="btn-3d btn-secondary btn-sm preview-btn">👁️ Preview</button>` : ''}
          <button class="btn-3d btn-danger btn-sm del-btn">Delete</button>
        </div>
      `;

      if (card.querySelector('.preview-btn')) {
        card.querySelector('.preview-btn').addEventListener('click', () => {
          previewDocTitle.textContent = doc.name;
          previewFrameContainer.innerHTML = `<iframe src="${doc.fileBase64}" style="width:100%; height:100%; border:none;"></iframe>`;
          docPreviewModal.classList.add('active');
        });
      }

      card.querySelector('.del-btn').addEventListener('click', async () => {
        if (confirm(`Delete "${doc.name}"?`)) {
          appData.documents.splice(idx, 1);
          await chrome.storage.local.set({ documents: appData.documents });
          await refreshStats();
          renderDocsGrid();
          showToast('Document deleted');
        }
      });

      optDocsGrid.appendChild(card);
    });
  }

  function renderCustomList() {
    optCustomList.innerHTML = '';
    if (!appData.customFields.length) {
      optCustomList.innerHTML = '<p style="color:var(--text-muted); font-size:12px;">No custom field aliases created.</p>';
      return;
    }

    appData.customFields.forEach((cf, idx) => {
      const row = document.createElement('div');
      row.className = 'custom-field-row';
      row.setAttribute('data-id', cf.id || 'cf_' + idx);
      row.innerHTML = `
        <input type="text" class="input-3d key-input" placeholder="Field Name (e.g. Passport Alias)" value="${escapeHTML(cf.key || '')}">
        <input type="text" class="input-3d val-input" placeholder="Value" value="${escapeHTML(cf.value || '')}">
        <button class="btn-icon delete-cf-btn" title="Remove" style="color:#f43f5e;">✕</button>
      `;

      row.querySelector('.delete-cf-btn').addEventListener('click', () => {
        appData.customFields.splice(idx, 1);
        renderCustomList();
      });

      optCustomList.appendChild(row);
    });
  }

  // PIN Helpers
  function openPinModal(isSetup = false, title = '', subtitle = '') {
    isSettingPin = isSetup;
    optPinErrorMsg.textContent = '';
    optPinBoxes.forEach(b => { b.value = ''; });
    optPinModalTitle.textContent = title || (isSetup ? 'Create 4-Digit PIN' : 'Enter Security PIN');
    optPinModalSubtitle.textContent = subtitle || (isSetup ? 'Enter code to secure vault' : 'Unlock your vault to edit profile');
    optPinModal.classList.add('active');
    setTimeout(() => optPinBoxes[0].focus(), 150);
  }

  function closePinModal() {
    optPinModal.classList.remove('active');
    optPinBoxes.forEach(b => { b.value = ''; });
    optPinErrorMsg.textContent = '';
  }

  function setupPinInputs() {
    optPinBoxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
          if (idx < optPinBoxes.length - 1) optPinBoxes[idx + 1].focus();
          else optSubmitPinBtn.focus();
        }
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) optPinBoxes[idx - 1].focus();
        else if (e.key === 'Enter') handlePinSubmit();
      });
    });
  }

  async function handlePinSubmit() {
    const pin = Array.from(optPinBoxes).map(b => b.value).join('');
    if (pin.length < 4) {
      optPinErrorMsg.textContent = 'Please enter 4 digits';
      return;
    }

    if (isSettingPin) {
      const salt = CryptoManager.generateSalt();
      const hash = await CryptoManager.hashPin(pin, salt);
      appData.pinConfig = { enabled: true, hash, salt };
      await chrome.storage.local.set({ pinConfig: appData.pinConfig });
      await CryptoManager.setSessionUnlocked();
      setLockUI(false);
      optPinToggle.checked = true;
      optPinActions.style.display = 'block';
      closePinModal();
      showToast('PIN security active! 🛡️');
    } else {
      const valid = await CryptoManager.verifyPin(pin, appData.pinConfig.hash, appData.pinConfig.salt);
      if (valid) {
        await CryptoManager.setSessionUnlocked();
        setLockUI(false);
        closePinModal();
        showToast('Vault unlocked! 🔓');
      } else {
        optPinErrorMsg.textContent = 'Incorrect PIN';
        optPinBoxes.forEach(b => { b.value = ''; });
        optPinBoxes[0].focus();
      }
    }
  }

  function showToast(msg) {
    optToast.textContent = msg;
    optToast.classList.add('show');
    setTimeout(() => optToast.classList.remove('show'), 2800);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  await init();
});
