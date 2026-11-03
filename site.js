(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // tema claro/escuro (lembra a escolha neste navegador)
  var tbtn = document.querySelector('[data-theme-toggle]');
  if (tbtn) tbtn.addEventListener('click', function () {
    var dark = root.dataset.theme === 'dark';
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('acr-tema', root.dataset.theme); } catch (e) {}
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

  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;


  // áreas de atuação: lista + painel
  var ar = document.querySelector('[data-areas]');
  if (ar) {
    var items = [].slice.call(ar.querySelectorAll('.ar-item'));
    items.forEach(function (it) {
      it.querySelector('.ar-tab').addEventListener('click', function () {
        var mobile = window.matchMedia('(max-width: 900px)').matches;
        var was = it.hasAttribute('data-on');
        items.forEach(function (o) { o.removeAttribute('data-on'); o.querySelector('.ar-tab').setAttribute('aria-expanded', 'false'); });
        if (!(mobile && was)) { it.setAttribute('data-on', ''); this.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  // guia rápido: o detalhe abre logo abaixo da linha do card escolhido
  var gq = document.querySelector('[data-guia]');
  if (gq) {
    var cards = [].slice.call(gq.querySelectorAll('.gq-card'));
    var panel = gq.querySelector('.gq-panel'), body = panel.querySelector('.gq-body');
    var cur = null;
    var close = function () {
      panel.hidden = true; cur = null;
      cards.forEach(function (c) { c.setAttribute('aria-expanded', 'false'); });
    };
    var open = function (c, focus) {
      var top = c.offsetTop, last = c;
      cards.forEach(function (o) { if (o.offsetTop === top) last = o; });
      last.after(panel);
      body.innerHTML = document.getElementById('gq-t' + c.dataset.g).innerHTML;
      cards.forEach(function (o) { o.setAttribute('aria-expanded', o === c ? 'true' : 'false'); });
      panel.hidden = false; cur = c;
      if (focus) {
        var r = panel.getBoundingClientRect();
        if (r.bottom > window.innerHeight || r.top < 80) panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    cards.forEach(function (c) {
      c.addEventListener('click', function () { if (cur === c) close(); else open(c, true); });
    });
    panel.querySelector('.gq-x').addEventListener('click', function () { var c = cur; close(); if (c) c.focus(); });
    var rz;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (cur) open(cur, false); }, 150); });
    open(cards[0], false);
  }

  // frase digitada no banner
  var tw = document.querySelector('.tw');
  if (tw && !calm) {
    var fr = tw.dataset.frases.split('|'), fi = 0, ci = fr[0].length, del = true;
    var tick = function () {
      var f = fr[fi];
      if (del) {
        ci--; tw.textContent = f.slice(0, ci);
        if (ci <= 0) { del = false; fi = (fi + 1) % fr.length; }
        setTimeout(tick, 28);
      } else {
        var g = fr[fi]; ci++; tw.textContent = g.slice(0, ci);
        if (ci >= g.length) { del = true; setTimeout(tick, 2200); } else setTimeout(tick, 55);
      }
    };
    setTimeout(tick, 2600);
  }

  // item do menu da seção visível
  var links = [].slice.call(document.querySelectorAll('.nav a[href*="#"]'));
  var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').split('#')[1]); });
  var onScroll = function () {
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 140) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // formulário de contato: monta a mensagem e abre o WhatsApp ou o app de e-mail da pessoa
  var form = document.querySelector('[data-contato]');
  if (form) {
    var err = form.querySelector('.err');
    var val = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.querySelectorAll('[data-send]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!val('nome') || !val('telefone') || !val('mensagem') || !form.elements.lgpd.checked) {
          err.classList.add('on');
          form.reportValidity && form.reportValidity();
          return;
        }
        err.classList.remove('on');
        var area = val('area') || 'Atendimento';
        var linhas = [
          'Olá, Dra. Ana Carolina. Meu nome é ' + val('nome') + '.',
          'Assunto: ' + area,
          '',
          val('mensagem'),
          '',
          'Telefone/WhatsApp: ' + val('telefone') + (val('email') ? ' | E-mail: ' + val('email') : '')
        ];
        var texto = linhas.join('\n');
        if (b.dataset.send === 'wa') {
          window.open('https://wa.me/5511975875004?text=' + encodeURIComponent(texto), '_blank', 'noopener');
        } else {
          window.location.href = 'mailto:carolinareis.ana@adv.oabsp.org.br?subject=' +
            encodeURIComponent('Contato pelo site — ' + area) + '&body=' + encodeURIComponent(texto);
        }
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
