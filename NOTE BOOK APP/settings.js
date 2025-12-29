(function(){
  const overlay = document.getElementById('prefOverlay');
  const opacity = document.getElementById('prefOpacity');
  const theme = document.getElementById('prefTheme');
  const autoStart = document.getElementById('prefAutoStart');
  const save = document.getElementById('prefSave');
  const close = document.getElementById('prefClose');

  function load() {
    const en = localStorage.getItem('bgOverlayEnabled');
    const op = localStorage.getItem('bgOverlayOpacity');
    overlay.checked = (en === '1' || en === 'true');
    opacity.value = op !== null ? op : 35;
    const t = localStorage.getItem('themePreset');
    if (theme && t) theme.value = t;
    // load auto-start from main process
    if (window.electronAPI && autoStart) {
      window.electronAPI.getAutoStart().then(r => {
        autoStart.checked = !!(r && r.openAtLogin);
      }).catch(() => {});
    }
  }
  load();

  save.addEventListener('click', () => {
    localStorage.setItem('bgOverlayEnabled', overlay.checked ? '1' : '0');
    localStorage.setItem('bgOverlayOpacity', String(opacity.value));
    if (theme) localStorage.setItem('themePreset', theme.value || 'light');
    if (window.electronAPI && autoStart) {
      window.electronAPI.setAutoStart(!!autoStart.checked).then(() => {}).catch(() => {});
    }
    alert('Preferences saved');
  });
  close.addEventListener('click', () => { window.close(); });
})();
