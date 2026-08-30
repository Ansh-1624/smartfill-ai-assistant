/**
 * SmartFill AI Assistant — Background Service Worker (background.js)
 * Manages context menu registration, message routing, and ephemeral event dispatching.
 */

// 1. Setup Context Menus on Extension Install/Update
chrome.runtime.onInstalled.addListener(async () => {
  // Remove existing menus to prevent duplicates
  await chrome.contextMenus.removeAll();

  // Root Menu Item
  chrome.contextMenus.create({
    id: 'smartfill_root',
    title: '⚡ SmartFill AI Assistant',
    contexts: ['editable', 'page']
  });

  // Submenu: Fill Entire Form
  chrome.contextMenus.create({
    parentId: 'smartfill_root',
    id: 'smartfill_fill_all',
    title: '⚡ Autofill Entire Page',
    contexts: ['editable', 'page']
  });

  // Submenu: Fill Personal Info
  chrome.contextMenus.create({
    parentId: 'smartfill_root',
    id: 'smartfill_fill_personal',
    title: '👤 Fill Personal Details',
    contexts: ['editable']
  });

  // Submenu: Fill Address
  chrome.contextMenus.create({
    parentId: 'smartfill_root',
    id: 'smartfill_fill_address',
    title: '📍 Fill Address Details',
    contexts: ['editable']
  });

  // Submenu: Fill Professional
  chrome.contextMenus.create({
    parentId: 'smartfill_root',
    id: 'smartfill_fill_pro',
    title: '💼 Fill Professional Details',
    contexts: ['editable']
  });

  // Submenu: Open Dashboard
  chrome.contextMenus.create({
    parentId: 'smartfill_root',
    id: 'smartfill_open_vault',
    title: '🛡️ Open SmartFill Vault...',
    contexts: ['editable', 'page']
  });
});

// 2. Handle Context Menu Actions
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'smartfill_open_vault') {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
    }
    return;
  }

  // Fetch full stored profile data
  const userData = await chrome.storage.local.get(null);

  try {
    // Send action to active tab
    await chrome.tabs.sendMessage(tab.id, {
      action: 'AUTOFIL_PAGE',
      data: userData,
      menuFilter: info.menuItemId
    });

    // Provide badge visual confirmation
    await chrome.action.setBadgeText({ tabId: tab.id, text: '✓' });
    await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#10B981' });
    setTimeout(async () => {
      try {
        await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
      } catch (_) {}
    }, 2000);
  } catch (err) {
    console.warn('Content script not reachable, injecting fallback:', err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['utils/fieldMatcher.js', 'content/content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/content.css']
      });
      await chrome.tabs.sendMessage(tab.id, {
        action: 'AUTOFIL_PAGE',
        data: userData,
        menuFilter: info.menuItemId
      });
    } catch (e) {
      console.error('Failed to inject autofill script:', e);
    }
  }
});

// 3. Handle Keyboard Shortcuts (e.g. Alt + Shift + F)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'trigger_autofill') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    const userData = await chrome.storage.local.get(null);

    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'AUTOFIL_PAGE',
        data: userData
      });
      await chrome.action.setBadgeText({ tabId: tab.id, text: '⚡' });
      await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#00d2ff' });
      setTimeout(async () => {
        try {
          await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
        } catch (_) {}
      }, 1800);
    } catch (_) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['utils/fieldMatcher.js', 'content/content.js']
        });
        await chrome.tabs.sendMessage(tab.id, {
          action: 'AUTOFIL_PAGE',
          data: userData
        });
      } catch (e) {
        console.error('Command dispatch error:', e);
      }
    }
  }
});

