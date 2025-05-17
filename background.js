// background.js - service worker for Quick Bookmark & Note

/**
 * Saves a bookmark entry (URL, title, note, timestamp) to chrome.storage.local,
 * then invokes an optional callback once storage is complete.
 *
 * @param {string} note - The user-provided note text.
 * @param {Function} [callback] - Called after the bookmark is saved.
 */
function saveEntry(note, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    const entry = {
      url:       tab.url,
      title:     tab.title,
      note,
      timestamp: Date.now()
    };

    chrome.storage.local.get({ bookmarks: [] }, (res) => {
      const bookmarks = res.bookmarks;
      bookmarks.push(entry);
      chrome.storage.local.set({ bookmarks }, () => {
        console.log(`Saved: ${tab.title}`);
        if (typeof callback === 'function') callback();
      });
    });
  });
}

// Handler for omnibox input: “bn <note>”
chrome.omnibox.onInputEntered.addListener((noteText) => {
  const note = noteText.trim();
  if (note) saveEntry(note);
});

/**
 * Opens all saved bookmark URLs in new tabs.
 * @param {Function} [callback] - Called after all tabs are created.
 */
function openAllEntries(callback) {
  chrome.storage.local.get({ bookmarks: [] }, (res) => {
    const bookmarks = res.bookmarks;
    bookmarks.forEach(bm => {
      chrome.tabs.create({ url: bm.url });
    });
    if (typeof callback === 'function') callback();
  });
}

// Popup → background message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'save' && typeof msg.note === 'string') {
    const note = msg.note.trim();
    if (!note) {
      sendResponse({ success: false, error: 'Empty note' });
      return false;
    }
    saveEntry(note, () => sendResponse({ success: true }));
    return true;  // Keep channel open for async
  }

  if (msg.action === 'openAll') {
    openAllEntries(() => sendResponse({ success: true }));
    return true;  // Async response
  }

  return false;
});
