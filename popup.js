const pasteToggle = document.getElementById('pasteToggle');

chrome.storage.sync.get(['pasteButtonEnabled'], (result) => {
  pasteToggle.checked = result.pasteButtonEnabled ?? true;
});

pasteToggle.addEventListener('change', () => {
  chrome.storage.sync.set({ pasteButtonEnabled: pasteToggle.checked });
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleButton');
  const historyList = document.getElementById('historyList');
  const clearBtn = document.getElementById('clearHistory');

  chrome.storage.sync.get(['autoCopyEnabled', 'copyHistory'], (result) => {
    const isEnabled = result.autoCopyEnabled ?? false;
    const history = result.copyHistory ?? [];
    updateButtonUI(isEnabled);
    updateHistoryUI(history);
  });

  toggleButton.addEventListener('click', () => {
    chrome.storage.sync.get(['autoCopyEnabled'], (result) => {
      const currentState = result.autoCopyEnabled ?? false;
      const newState = !currentState;
      chrome.storage.sync.set({ autoCopyEnabled: newState }, () => {
        updateButtonUI(newState);
      });
    });
  });

  historyList.addEventListener('click', (e) => {
    if (e.target.classList.contains('history-item')) {
      const text = e.target.textContent;
      navigator.clipboard.writeText(text).then(() => {
        showCopyMessage();
      }).catch(() => {
        alert('Failed to copy');
      });
    }
  });

  clearBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ copyHistory: [] }, () => {
      updateHistoryUI([]);
    });
  });

  function updateButtonUI(enabled) {
    if (enabled) {
      toggleButton.classList.remove('off');
      toggleButton.classList.add('on');
      toggleButton.textContent = 'Turn OFF AutoCopy';
    } else {
      toggleButton.classList.remove('on');
      toggleButton.classList.add('off');
      toggleButton.textContent = 'Turn ON AutoCopy';
    }
  }

  function updateHistoryUI(history) {
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.textContent = 'No history yet.';
      return;
    }

    history.forEach(text => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.textContent = text.length > 100 ? text.slice(0, 100) + '…' : text;
      historyList.appendChild(div);
    });
  }

  function showCopyMessage() {
    const msg = document.getElementById('copyMessage');
    msg.style.display = 'block';
    msg.classList.add('show');

    setTimeout(() => {
      msg.classList.remove('show');
      setTimeout(() => {
        msg.style.display = 'none';
      }, 300);
    }, 1200);
  }
});