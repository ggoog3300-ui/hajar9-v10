(() => {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let installPrompt = null;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'install';
  btn.textContent = '📲 تثبيت خضارنا';
  btn.setAttribute('aria-label', 'تثبيت تطبيق خضارنا');
  document.body.appendChild(btn);
  const show = () => { if (!isStandalone) btn.style.display = 'block'; };
  if (isIOS && !isStandalone) show();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); installPrompt = event; show();
  });
  btn.addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      try { await installPrompt.userChoice; } catch (_) {}
      installPrompt = null;
      btn.style.display = 'none';
      return;
    }
    const message = isIOS
      ? 'لتثبيت خضارنا على iPhone أو iPad: اضغط زر المشاركة في Safari، ثم اختر «إضافة إلى الشاشة الرئيسية» وبعدها «إضافة».'
      : 'من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». إذا لم يظهر الخيار، افتح الموقع في Chrome أو Safari بعد نشره عبر HTTPS.';
    window.alert(message);
  });
  window.addEventListener('appinstalled', () => { btn.style.display = 'none'; installPrompt = null; });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(err => console.warn('PWA service worker registration failed:', err)));
  }
})();
