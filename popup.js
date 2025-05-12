const listEl = document.getElementById('list');

function renderList() {
  chrome.storage.local.get({ bookmarks: [] }, (res) => {
    listEl.innerHTML = '';
    // Show newest first
    res.bookmarks.slice().reverse().forEach(bm => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = bm.url;
      link.textContent = bm.title || bm.url;
      link.target = '_blank';

      const note = document.createElement('p');
      note.textContent = bm.note;

      const ts = document.createElement('small');
      ts.textContent = new Date(bm.timestamp).toLocaleString();

      li.append(link, note, ts);
      listEl.appendChild(li);
    });
  });
}

document.addEventListener('DOMContentLoaded', renderList);
