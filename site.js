(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // tema claro/escuro (lembra a escolha neste navegador)
  var tbtn = document.querySelector('[data-theme-toggle]');
  if (tbtn) tbtn.addEventListener('click', function () {
    var dark = root.dataset.theme === 'dark';
    root.dataset.theme = dark ? 'light' : 'dark';
    try { sessionStorage.setItem('acr-tema', root.dataset.theme); } catch (e) {}
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


  // guia rápido: filtro + lista + painel (no celular o painel abre embaixo do item)
  var gx = document.querySelector('[data-guia]');
  if (gx) {
    var qs = [].slice.call(gx.querySelectorAll('.gx-q'));
    var gp = gx.querySelector('.gx-panel'), gb = gx.querySelector('.gx-b');
    var cur = 0;
    var mob = function () { return window.matchMedia('(max-width: 900px)').matches; };
    var shut = mob(); // no celular, todas as perguntas começam fechadas
    var mark = function () {
      qs.forEach(function (q, k) { q.setAttribute('aria-pressed', (k === cur && !(mob() && shut)) ? 'true' : 'false'); });
    };
    var place = function () {
      if (mob()) {
        if (shut) { gp.style.display = 'none'; }
        else { qs[cur].parentNode.appendChild(gp); gp.style.display = ''; }
      } else { gp.style.display = ''; if (gp.parentNode !== gb) gb.appendChild(gp); }
      mark();
    };
    var pick = function (i, user) {
      if (user && mob() && i === cur && !shut) { shut = true; place(); return; }
      if (user) shut = false;
      cur = i;
      gp.innerHTML = document.getElementById('gq-t' + qs[i].dataset.g).innerHTML;
      place();
    };
    qs.forEach(function (q, i) { q.addEventListener('click', function () { pick(i, true); }); });
    [].slice.call(gx.querySelectorAll('.gx-chip')).forEach(function (c, _, all) {
      c.addEventListener('click', function () {
        all.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
        var f = c.dataset.f, first = -1;
        qs.forEach(function (q, i) {
          var li = q.parentNode, show = f === 'all' || li.dataset.cat === f;
          li.hidden = !show; if (show && first < 0) first = i;
        });
        if (mob()) shut = true;
        if (qs[cur].parentNode.hidden && first >= 0) pick(first); else place();
      });
    });
    window.addEventListener('resize', place);
    pick(0);
    var c0 = gx.querySelector('.gx-chip[aria-pressed=true]'); if (c0) c0.click();
  }

  // carrossel das áreas: dois cards visíveis, anda um por vez e volta ao início sem salto
  var car = document.querySelector('[data-car]');
  if (car) {
    var track = car.querySelector('.car-track');
    var orig = [].slice.call(track.children), n = orig.length;
    orig.forEach(function (c) { var k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); k.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; }); track.appendChild(k); });
    var dots = [].slice.call(car.querySelectorAll('.cs-dot'));
    var pos = 0;
    var step = function () { var c = track.children[0]; return c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 24); };
    var paint = function (anim) {
      track.classList.toggle('no-anim', !anim);
      track.style.transform = 'translateX(' + (-pos * step()) + 'px)';
      var cur = pos % n;
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === cur ? 'true' : 'false'); var i2 = d.querySelector('i'); i2.style.animation = 'none'; void i2.offsetWidth; i2.style.animation = ''; });
    };
    var go = function (p) {
      if (p < 0) { pos = n; paint(false); void track.offsetWidth; p = n - 1; }
      pos = p; paint(true);
      if (pos >= n) setTimeout(function () { pos = pos % n; paint(false); }, 720);
    };
    if (!calm) {
      car.classList.add('auto');
      dots.forEach(function (d) { d.querySelector('i').addEventListener('animationend', function () { if (car.classList.contains('auto')) go(pos + 1); }); });
    }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    car.querySelector('[data-prev]').addEventListener('click', function () { go(pos - 1); });
    car.querySelector('[data-next]').addEventListener('click', function () { go(pos + 1); });
    var sx = null;
    car.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(pos + (dx < 0 ? 1 : -1)); sx = null; });
    window.addEventListener('resize', function () { paint(false); });
    paint(false);
  }

  // botões "entrar em contato": levam ao formulário com o assunto já escolhido
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-assunto]');
    if (!a) return;
    var sel = document.getElementById('f-area');
    if (sel) sel.value = a.dataset.assunto;
  });


  // título do banner: segunda linha sempre inteira, reduzindo a fonte se a cidade for longa
  var fitH = document.querySelector('[data-fit]');
  var fit = function () {
    if (!fitH) return;
    var l2 = fitH.querySelector('.hx-l2'), box = fitH.parentNode;
    fitH.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(fitH).fontSize);
    var min = window.innerWidth < 600 ? 30 : 40;
    while (l2.getBoundingClientRect().width > box.clientWidth && fs > min) { fs -= 1; fitH.style.fontSize = fs + 'px'; }
    var cid2 = fitH.querySelector('[data-cidade]');
    if (l2.getBoundingClientRect().width > box.clientWidth && cid2 && cid2.textContent !== 'Arujá') { cid2.textContent = 'Arujá'; fit(); }
  };
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  fit();

  // cidade de quem visita: só troca "Arujá" quando dois serviços de localização concordam
  // e a cidade fica fora da região (até 35 km de Arujá mostra sempre Arujá)
  var cid = document.querySelector('[data-cidade]');
  if (cid && window.fetch && window.Promise) {
    var put = function (c) { if (c) { cid.textContent = c; fit(); } };
    var norm = function (x) { return (x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); };
    var km = function (la, lo) {
      var r = Math.PI / 180, a1 = -23.3965 * r, b1 = -46.3208 * r, a2 = la * r, b2 = lo * r;
      return 6371 * Math.acos(Math.min(1, Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(b2 - b1)));
    };
    var saved = null;
    try { saved = sessionStorage.getItem('acr-cidade2'); } catch (e) {}
    if (saved !== null) put(saved);
    else {
      var get = function (u, map) { return fetch(u).then(function (r) { return r.json(); }).then(map).catch(function () { return null; }); };
      Promise.all([
        get('https://get.geojs.io/v1/ip/geo.json', function (g) { return { city: g.city, uf: g.region, cc: g.country_code, lat: +g.latitude, lon: +g.longitude }; }),
        get('https://freeipapi.com/api/json', function (g) { return { city: g.cityName, uf: g.regionName, cc: g.countryCode, lat: +g.latitude, lon: +g.longitude }; })
      ]).then(function (res) {
        var a = res[0], b = res[1], c = '';
        if (a && b && a.cc === 'BR' && norm(a.uf) === 'sao paulo' && norm(a.city) && norm(a.city) === norm(b.city) && km(a.lat, a.lon) > 35) c = a.city;
        try { sessionStorage.setItem('acr-cidade2', c); } catch (e) {}
        put(c);
      });
    }
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
