chrome.omnibox.onInputEntered.addListener((noteText) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const entry = {
      url: tab.url,
      title: tab.title,
      note: noteText.trim(),
      timestamp: Date.now()
    };
    chrome.storage.local.get({ bookmarks: [] }, (res) => {
      const bookmarks = res.bookmarks;
      bookmarks.push(entry);
      chrome.storage.local.set({ bookmarks }, () => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Bookmark Added',
          message: `Saved: ${tab.title}`
        });
      });
    });
  });
});
