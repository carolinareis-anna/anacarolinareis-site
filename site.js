(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // tema claro/escuro (lembra a escolha neste navegador)
  var tbtn = document.querySelector('[data-theme-toggle]');
  if (tbtn) tbtn.addEventListener('click', function () {
    var dark = root.dataset.theme ? root.dataset.theme === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('acr-theme', root.dataset.theme); } catch (e) {}
  });

  // menu no celular
  var top = document.querySelector('.top'), mbtn = document.querySelector('[data-menu]');
  if (mbtn) {
    mbtn.addEventListener('click', function () {
      var open = top.classList.toggle('open');
      mbtn.setAttribute('aria-expanded', open);
    });
    top.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { top.classList.remove('open'); mbtn.setAttribute('aria-expanded', false); });
    });
  }

  // "Qual é a sua situação?" — abas + respostas em tese
  var panel = document.querySelector('[data-situacoes]');
  if (panel) {
    var tabs = panel.querySelectorAll('[role=tab]');
    var show = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        var n = tabs[(i + d + tabs.length) % tabs.length]; show(n); n.focus();
      });
    });
    panel.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        var pane = c.closest('[role=tabpanel]');
        var on = c.getAttribute('aria-pressed') !== 'true';
        pane.querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        pane.querySelectorAll('.answer').forEach(function (a) { a.hidden = true; });
        if (on) { c.setAttribute('aria-pressed', 'true'); document.getElementById(c.dataset.a).hidden = false; }
      });
    });
  }

  // entrada suave das seções
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
