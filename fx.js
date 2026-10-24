/* مؤثرات خضارنا المشتركة: الوضع الليلي، الظهور عند التمرير، التموّج، العدّاد، الطيران إلى السلة، القصاصات */
(() => {
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const FX = window.FX = { reduce };

  /* تخزين آمن (قد يفشل في التصفح الخاص) */
  FX.store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* الوضع الليلي / النهاري */
  const root = document.documentElement;
  function applyTheme(t) {
    root.dataset.theme = t;
    document.querySelectorAll('[data-theme-toggle]').forEach(b => {
      b.textContent = t === 'dark' ? '☀️' : '🌙';
      b.setAttribute('aria-label', t === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي');
    });
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0b1711' : '#087443');
  }
  FX.toggleTheme = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-anim');
    applyTheme(next);
    FX.store.set('kh-theme', next);
    setTimeout(() => root.classList.remove('theme-anim'), 500);
  };

  /* ظهور العناصر عند التمرير */
  FX.reveal = (scope = document) => {
    const els = [...scope.querySelectorAll('.reveal:not(.in)')];
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    FX.io = FX.io || new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); FX.io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(e => FX.io.observe(e));
  };

  /* نبضة صغيرة لعنصر */
  FX.bump = el => { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

  /* عدّاد متحرك للأرقام */
  FX.count = (el, to, ms = 800) => {
    if (!el) return;
    to = Number(to) || 0;
    const from = Number(el.dataset.v || 0);
    el.dataset.v = to;
    if (reduce || from === to) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = t => {
      const k = Math.min(1, (t - t0) / ms);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* رمز يطير من مكان إلى آخر (إلى السلة) */
  FX.fly = (from, to, emoji) => {
    if (reduce || !from || !to) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const s = document.createElement('span');
    s.className = 'fly';
    s.textContent = emoji || '🥬';
    s.style.left = (a.left + a.width / 2 - 14) + 'px';
    s.style.top = (a.top + a.height / 2 - 14) + 'px';
    document.body.appendChild(s);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const an = s.animate([
      { transform: 'translate(0,0) scale(1.4) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * .5}px,${dy * .5 - 70}px) scale(1.15) rotate(180deg)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px,${dy}px) scale(.3) rotate(360deg)`, opacity: .3 }
    ], { duration: 780, easing: 'cubic-bezier(.45,0,.6,.5)' });
    an.onfinish = () => s.remove();
  };

  /* قصاصات خضار تتساقط عند نجاح الطلب */
  FX.confetti = (n = 38) => {
    if (reduce) return;
    const em = ['🥕', '🍅', '🥬', '🍋', '🍎', '🫑', '✨'];
    const box = document.createElement('div');
    box.className = 'confetti';
    document.body.appendChild(box);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = em[i % em.length];
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.fontSize = (16 + Math.random() * 22) + 'px';
      box.appendChild(s);
      s.animate([
        { transform: 'translateY(-12vh) rotate(0)', opacity: 1 },
        { transform: `translate(${(Math.random() - .5) * 180}px,108vh) rotate(${(Math.random() - .5) * 720}deg)`, opacity: .9 }
      ], { duration: 2200 + Math.random() * 1600, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'backwards' });
    }
    setTimeout(() => box.remove(), 4800);
  };

  /* تأثير التموّج عند الضغط */
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest && e.target.closest('.btn,.cat,.fab');
    if (!b || b.disabled || reduce) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
    const i = document.createElement('i');
    i.className = 'ripple';
    i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(i);
    setTimeout(() => i.remove(), 650);
  });

  function boot() {
    applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
    document.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', FX.toggleTheme));
    FX.reveal();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
