// list.js

const container = document.getElementById('container');
const template  = document.getElementById('card-template');

/** Fetch all bookmarks */
function fetchBookmarks(callback) {
  chrome.storage.local.get({ bookmarks: [] }, ({ bookmarks }) => {
    callback(bookmarks);
  });
}

/** Save updated bookmarks array */
function saveBookmarks(bookmarks, callback) {
  chrome.storage.local.set({ bookmarks }, callback);
}

/** Render the entire list */
function render() {
  container.innerHTML = '';
  fetchBookmarks(bookmarks => {
    if (!bookmarks.length) {
      container.textContent = 'No bookmarks saved yet.';
      return;
    }
    // Newest first
    bookmarks.slice().reverse().forEach(bm => {
      const card = template.content.cloneNode(true);
      const root = card.querySelector('.card');
      root.dataset.ts = bm.timestamp;
      card.querySelector('.link').href        = bm.url;
      card.querySelector('.link').textContent = bm.title || bm.url;
      card.querySelector('.note').textContent = bm.note;
      card.querySelector('.ts').textContent   = new Date(bm.timestamp).toLocaleString();

      // Delete handler
      card.querySelector('.delete').onclick = () => {
        const ts = bm.timestamp;
        fetchBookmarks(list => {
          const updated = list.filter(x => x.timestamp !== ts);
          saveBookmarks(updated, render);
        });
      };

      // Edit handler
      card.querySelector('.edit').onclick = () => startEdit(root, bm);
      container.appendChild(card);
    });
  });
}

/** Swap card into edit mode */
function startEdit(cardEl, bm) {
  // Replace note <p> with <textarea>
  const noteP = cardEl.querySelector('.note');
  const textarea = document.createElement('textarea');
  textarea.value = bm.note;
  textarea.rows  = 4;
  textarea.style.width = '100%';
  cardEl.replaceChild(textarea, noteP);

  // Swap buttons: Save / Cancel
  const actions = cardEl.querySelector('.actions');
  actions.innerHTML = '';
  const saveBtn   = document.createElement('button');
  const cancelBtn = document.createElement('button');
  saveBtn.textContent   = 'Save';
  cancelBtn.textContent = 'Cancel';
  actions.append(saveBtn, cancelBtn);

  saveBtn.onclick = () => {
    const newNote = textarea.value.trim();
    fetchBookmarks(list => {
      const idx = list.findIndex(x => x.timestamp === bm.timestamp);
      if (idx > -1) list[idx].note = newNote;
      saveBookmarks(list, render);
    });
  };
  cancelBtn.onclick = render;
}

// Initial load
document.addEventListener('DOMContentLoaded', render);
