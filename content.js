let pasteObserver;

chrome.storage.sync.get(['autoCopyEnabled', 'pasteButtonEnabled'], (result) => {
  const isCopyEnabled = result.autoCopyEnabled ?? false;
  const isPasteEnabled = result.pasteButtonEnabled ?? true;

  if (isCopyEnabled) {
    setupAutoCopy();
  }

  handlePasteButtonToggle(isPasteEnabled);
});

chrome.storage.onChanged.addListener((changes) => {
  if ('pasteButtonEnabled' in changes) {
    const enabled = changes.pasteButtonEnabled.newValue;
    handlePasteButtonToggle(enabled);
  }
  if ('autoCopyEnabled' in changes) {
    const enabled = changes.autoCopyEnabled.newValue;
    if (enabled) {
      setupAutoCopy();
    } else {
      document.removeEventListener('mouseup', autoCopyListener);
    }
  }
});

function setupAutoCopy() {
  document.removeEventListener('mouseup', autoCopyListener);
  document.addEventListener('mouseup', autoCopyListener);
}

function autoCopyListener() {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    copyText(selectedText);
  }
}

function handlePasteButtonToggle(enabled) {
  if (pasteObserver) pasteObserver.disconnect();
  if (enabled) {
    insertPasteButtons();
    pasteObserver = new MutationObserver(() => {
      chrome.storage.sync.get(['pasteButtonEnabled'], (result) => {
        if (result.pasteButtonEnabled) insertPasteButtons();
      });
    });
    pasteObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    removePasteButtons();
  }
}

function insertPasteButtons() {
  const fields = document.querySelectorAll('input[type="text"], textarea');

  fields.forEach(field => {
    if (field.dataset.pasteButtonAdded) return;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = getComputedStyle(field).width;

    const original = field;
    original.style.width = '100%';
    original.dataset.pasteButtonAdded = 'true';

    const parent = original.parentNode;
    parent.replaceChild(wrapper, original);
    wrapper.appendChild(original);

    const pasteButton = document.createElement('button');
    pasteButton.type = 'button';
    pasteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" width="16" height="16" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
    d="M9 2h6a1 1 0 011 1v1h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2V3a1 1 0 011-1zM9 12h6m-6 4h6"/>
</svg>
    `;
    Object.assign(pasteButton.style, {
      position: 'absolute',
      top: '50%',
      right: '8px',
      transform: 'translateY(-50%)',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '0',
      margin: '0',
      color: '#555'
    });

    pasteButton.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        original.value = text;
        original.focus();
      } catch (err) {
        console.error('Failed to paste from clipboard:', err);
      }
    });

    wrapper.appendChild(pasteButton);
  });
}

function removePasteButtons() {
  document.querySelectorAll('[data-paste-button-added]').forEach(field => {
    const wrapper = field.parentNode;
    if (wrapper && wrapper.parentNode) {
      const cloned = field.cloneNode(true);
      cloned.removeAttribute('data-paste-button-added');
      wrapper.parentNode.replaceChild(cloned, wrapper);
    }
  });
}

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    saveToHistory(text);
    showCopiedPopup();
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      saveToHistory(text);
      showCopiedPopup();
    } catch (err) {
      console.error('Copy fallback failed:', err);
    }
    document.body.removeChild(textarea);
  });
}

function saveToHistory(text) {
  chrome.storage.sync.get({ copyHistory: [] }, (result) => {
    let history = result.copyHistory;
    if (history[0] !== text) history.unshift(text);
    if (history.length > 20) history = history.slice(0, 20);
    chrome.storage.sync.set({ copyHistory: history });
  });
}

function showCopiedPopup() {
  if (document.getElementById('autocopy-popup')) return;

  const popup = document.createElement('div');
  popup.id = 'autocopy-popup';
  popup.textContent = 'Copied!';
  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#323232',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '6px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    fontSize: '14px',
    zIndex: 99999,
    opacity: '0',
    transition: 'opacity 0.3s'
  });

  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.style.opacity = '1');
  setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => popup.remove(), 300);
  }, 1500);
}