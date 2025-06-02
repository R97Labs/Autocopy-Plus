chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    autoCopyEnabled: true,
    pasteButtonEnabled: true
  }, () => {
    console.log('AutoCopy and Paste Button enabled by default.');
  });
});