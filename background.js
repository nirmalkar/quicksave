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
      // Save and then call the callback
      chrome.storage.local.set({ bookmarks }, () => {
        console.log(`Saved: ${tab.title}`);
        if (typeof callback === 'function') callback();
      });
    });
  });
}

// Omnibox handler (“bn <your note>”)
chrome.omnibox.onInputEntered.addListener((noteText) => {
  const note = noteText.trim();
  if (note) saveEntry(note);
});

// Popup → background message handler (now asynchronous)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'save' && typeof msg.note === 'string') {
    const note = msg.note.trim();
    if (!note) {
      sendResponse({ success: false, error: 'Empty note' });
      return false;
    }
    // Save and only respond after storage completes
    saveEntry(note, () => {
      sendResponse({ success: true });
    });
    return true;  // Keep message channel open for async response
  }
  return false;
});
