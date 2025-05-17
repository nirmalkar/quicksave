// popup.js

const noteInput = document.getElementById('noteInput');
const saveBtn   = document.getElementById('saveBtn');
const listEl    = document.getElementById('list');

// Helper: fetch all bookmarks from storage
function getBookmarks(callback) {
  chrome.storage.local.get({ bookmarks: [] }, (res) => {
    callback(res.bookmarks);
  });
}

// Save new or updated bookmarks
function setBookmarks(bookmarks, callback) {
  chrome.storage.local.set({ bookmarks }, () => {
    if (callback) callback();
  });
}

/**
 * Render the list of bookmarks with edit & delete controls.
 */
function renderList() {
  getBookmarks((bookmarks) => {
    listEl.innerHTML = '';

    if (bookmarks.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.textContent = 'No saved bookmarks yet.';
      listEl.appendChild(emptyMsg);
      return;
    }

    // Newest first
    bookmarks.slice().reverse().forEach(bm => {
      const li = document.createElement('li');
      li.style.marginBottom = '12px';
      li.dataset.ts = bm.timestamp;

      // Title link
      const link = document.createElement('a');
      link.href = bm.url;
      link.textContent = bm.title || bm.url;
      link.target = '_blank';
      link.style.fontWeight = 'bold';
      link.style.display = 'block';

      // Note text or editor
      const noteP = document.createElement('p');
      noteP.textContent = bm.note;
      noteP.style.margin = '6px 0';

      // Timestamp
      const ts = document.createElement('small');
      ts.textContent = new Date(bm.timestamp).toLocaleString();
      ts.style.color = '#555';

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.style.marginRight = '6px';
      editBtn.addEventListener('click', () => startEdit(bm.timestamp));

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => deleteEntry(bm.timestamp));

      li.append(link, noteP, ts, editBtn, delBtn);
      listEl.appendChild(li);
    });
  });
}

// Save button handler for new entries
saveBtn.addEventListener('click', () => {
  const noteText = noteInput.value.trim();
  if (!noteText) return;

  chrome.runtime.sendMessage(
    { action: 'save', note: noteText },
    response => {
      if (response?.success) {
        noteInput.value = '';
        renderList();
      } else {
        console.error('Save failed', response);
      }
    }
  );
});

// Delete a bookmark by timestamp
function deleteEntry(timestamp) {
  getBookmarks(bookmarks => {
    const updated = bookmarks.filter(bm => bm.timestamp !== timestamp);
    setBookmarks(updated, renderList);
  });
}

// Start editing: replace note <p> with textarea + save/cancel
function startEdit(timestamp) {
  const li = listEl.querySelector(`li[data-ts="${timestamp}"]`);
  if (!li) return;
  const bmIndex = parseInt(timestamp);

  // Get current bookmark
  getBookmarks(bookmarks => {
    const idx = bookmarks.findIndex(bm => bm.timestamp === timestamp);
    if (idx < 0) return;
    const bm = bookmarks[idx];

    // Replace note paragraph with textarea
    const existingP = li.querySelector('p');
    const textarea = document.createElement('textarea');
    textarea.value = bm.note;
    textarea.style.width = '100%';
    textarea.style.height = '60px';
    li.replaceChild(textarea, existingP);

    // Change Edit button to Save and add Cancel
    const [editBtn, delBtn] = li.querySelectorAll('button');
    editBtn.textContent = 'Save';
    editBtn.removeEventListener('click', () => startEdit(timestamp));
    editBtn.addEventListener('click', () => saveEdit(timestamp, textarea.value));

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginLeft = '6px';
    cancelBtn.addEventListener('click', () => renderList());
    li.appendChild(cancelBtn);
  });
}

// Save the edited note text
function saveEdit(timestamp, newNote) {
  getBookmarks(bookmarks => {
    const idx = bookmarks.findIndex(bm => bm.timestamp === timestamp);
    if (idx < 0) return;
    bookmarks[idx].note = newNote;
    setBookmarks(bookmarks, renderList);
  });
}

// Initial render when popup opens
document.addEventListener('DOMContentLoaded', renderList);

const viewAllBtn = document.getElementById('viewAllBtn');
console.log(viewAllBtn, 'hello!')

viewAllBtn.addEventListener('click', () => {
  // Opens list.html in a new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('list.html')
  });
});
