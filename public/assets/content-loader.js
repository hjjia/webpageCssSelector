(() => {
  const url = chrome.runtime.getURL('assets/content.js');
  import(url).catch((e) => {
    console.error('Failed to import content module:', e);
  });
})();
