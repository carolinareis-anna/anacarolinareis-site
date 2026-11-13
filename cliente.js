/* Área do cliente — login e painel (Supabase). Os dados só chegam ao navegador depois do login,
   e as regras do banco (RLS) só deixam cada cliente ler o próprio cadastro. */
(function () {
  var SUPA_URL = '';   // https://xxxx.supabase.co
  var SUPA_KEY = '';   // chave pública "anon" do projeto
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var auth = $('[data-auth]'), painel = $('[data-painel]');
  var msg = auth ? $('.lg-msg', auth) : null;
  var say = function (t) { if (msg) msg.textContent = t; };

  if (!SUPA_URL || !window.supabase) {
    if (auth) auth.addEventListener('submit', function (e) { e.preventDefault(); say('O acesso on-line está sendo liberado pelo escritório. Enquanto isso, fale pelo WhatsApp.'); });
    if (painel) location.replace('area-do-cliente');
    return;
  }
  var sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

  // ─── login ───
  if (auth) {
    var show = function (v) { auth.querySelectorAll('form').forEach(function (f) { f.hidden = f.dataset.view !== v; }); say(''); };
    auth.querySelectorAll('[data-to]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.to); }); });
    var h = location.hash;
    if (/type=(invite|recovery)/.test(h)) show('nova');
    else sb.auth.getSession().then(function (r) { if (r.data.session) location.replace('painel'); });

    $('[data-view=login]', auth).addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target;
      say('Entrando…');
      sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.senha.value }).then(function (r) {
        if (r.error) say('E-mail ou senha incorretos.'); else location.replace('painel');
      });
    });
    $('[data-view=reset]', auth).addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target;
      sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: location.href.split('#')[0] }).then(function () {
        say('Se o e-mail for de um cliente, o link chega em alguns minutos. Confira também o spam.');
      });
    });
    $('[data-view=nova]', auth).addEventListener('submit', function (e) {
      e.preventDefault(); var f = e.target;
      if (f.senha.value.length < 8) return say('A senha precisa ter pelo menos 8 caracteres.');
      if (f.senha.value !== f.senha2.value) return say('As senhas não são iguais.');
      sb.auth.updateUser({ password: f.senha.value }).then(function (r) {
        if (r.error) say('O link expirou. Peça um novo em "Esqueci a senha".'); else location.replace('painel');
      });
    });
  }

  // ─── painel ───
  if (painel) {
    var esc = function (t) { var d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; };
    var dataBR = function (d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d; };
    var reais = function (v) { return v == null ? '' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
    var url = function (u) { return /^https:\/\//i.test(u || '') ? u : ''; };
    var vazio = function (t) { return '<li class="pn-empty">' + t + '</li>'; };
    var conta = function (sel, n) { var e = $(sel); if (e) { e.hidden = !n; e.textContent = n || ''; } };

    // abas
    var tabs = [].slice.call(painel.querySelectorAll('[data-tab]'));
    var abrir = function (nome) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.tab === nome ? 'true' : 'false'); });
      painel.querySelectorAll('[data-sec]').forEach(function (s) { s.hidden = s.dataset.sec !== nome; });
    };
    tabs.forEach(function (t) { t.addEventListener('click', function () { abrir(t.dataset.tab); }); });
    painel.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { abrir(b.dataset.go); var n = $('.pn-lay'); if (n && n.scrollIntoView) n.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
    var put = function (sel, t) { var e = $(sel); if (e) e.textContent = t; };
    var CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
    var CLK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    var arqIn = $('#u-arq'); if (arqIn) arqIn.addEventListener('change', function () { put('[data-arq-nome]', arqIn.files[0] ? arqIn.files[0].name : 'Toque para selecionar ou tirar uma foto do documento'); });

    sb.auth.getSession().then(function (r) {
      var s = r.data.session;
      if (!s) return location.replace('area-do-cliente');
      var uid = s.user.id;

      var listarArquivos = function () {
        return sb.storage.from('documentos').list(uid, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }).then(function (x) {
          var arr = (x.data || []).filter(function (f) { return f.name && f.id; });
          $('[data-arquivos]').innerHTML = arr.length ? arr.map(function (f) {
            return '<li class="pn-item"><div class="pn-row"><div><h3>' + esc(f.name.replace(/^\d+-/, '')) + '</h3><span class="meta">Enviado em ' + dataBR(f.created_at) + '</span></div><button class="btn btn-g btn-sm" type="button" data-abrir="' + esc(f.name) + '">Abrir</button></div></li>';
          }).join('') : vazio('Nenhum arquivo enviado ainda.');
        });
      };
      $('[data-arquivos]').addEventListener('click', function (e) {
        var b = e.target.closest('[data-abrir]'); if (!b) return;
        sb.storage.from('documentos').createSignedUrl(uid + '/' + b.dataset.abrir, 60).then(function (x) { if (x.data && x.data.signedUrl) window.open(x.data.signedUrl, '_blank', 'noopener'); });
      });

      Promise.all([
        sb.from('clientes').select('nome, cpf, email, telefone, endereco').eq('id', uid).maybeSingle(),
        sb.from('conteudos').select('chave, titulo, html').eq('chave', 'acompanhamento').maybeSingle(),
        sb.from('processos').select('titulo, numero, vara, fase, proximo_passo, atualizado_em').order('atualizado_em', { ascending: false }),
        sb.from('documentos_pedidos').select('titulo, obs, status').order('criado_em', { ascending: true }),
        sb.from('honorarios').select('descricao, vencimento, valor, status, link').order('vencimento', { ascending: true }),
        sb.from('avisos').select('titulo, texto, criado_em').order('criado_em', { ascending: false }).limit(20),
        listarArquivos()
      ]).then(function (res) {
        var c = res[0].data || { email: s.user.email }, ct = res[1].data;
        var procs = res[2].data || [], ped = res[3].data || [], hon = res[4].data || [], av = res[5].data || [];
        $('[data-nome]').textContent = (c.nome || '').split(' ')[0] || 'cliente';
        var cpf = c.cpf ? c.cpf.replace(/^(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})$/, '$1.***.***-$2') : '—';
        $('[data-dados]').innerHTML = [['Nome', c.nome], ['CPF', cpf], ['E-mail', c.email || s.user.email], ['WhatsApp', c.telefone], ['Endereço', c.endereco]]
          .map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1] || '—') + '</dd></div>'; }).join('');
        var fe = $('[data-editar]'); fe.telefone.value = c.telefone || ''; fe.endereco.value = c.endereco || '';
        $('[data-conteudo]').innerHTML = ct ? ct.html : '<p>As orientações serão publicadas em breve.</p>';

        $('[data-processos]').innerHTML = procs.length ? procs.map(function (p) {
          var f = [['Processo nº', p.numero], ['Onde tramita', p.vara], ['Atualizado em', dataBR(p.atualizado_em)]].filter(function (x) { return x[1]; })
            .map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('');
          return '<li class="pn-item"><div class="pn-row"><h3>' + esc(p.titulo) + '</h3>' + (p.fase ? '<span class="pn-tag">' + esc(p.fase) + '</span>' : '') + '</div>' +
            (f ? '<dl class="pn-facts">' + f + '</dl>' : '') +
            (p.proximo_passo ? '<div class="pn-next">' + CLK + '<div><b>Próximo passo</b>' + esc(p.proximo_passo) + '</div></div>' : '') + '</li>';
        }).join('') : vazio('Assim que o seu processo for cadastrado, ele aparece aqui.');
        var p0 = procs[0];
        put('[data-s-proc]', p0 ? (p0.fase || p0.titulo) : 'Sem processo cadastrado');
        put('[data-s-proc2]', p0 ? (p0.proximo_passo ? String(p0.proximo_passo).slice(0, 70) + (String(p0.proximo_passo).length > 70 ? '…' : '') : p0.titulo) : 'Aparece aqui quando houver');

        var pend = ped.filter(function (d) { return d.status === 'pendente'; }).length;
        conta('[data-n-docs]', pend);
        put('[data-s-doc]', pend ? pend + (pend > 1 ? ' pendentes' : ' pendente') : 'Tudo em dia');
        put('[data-s-doc2]', pend ? 'Envie pelo painel' : (ped.length ? 'Nada a enviar agora' : 'Nenhum pedido no momento'));
        $('[data-pedidos]').innerHTML = ped.length ? ped.map(function (d) {
          var cls = d.status === 'conferido' ? 'done' : d.status === 'enviado' ? 'sent' : '';
          var tag = d.status === 'conferido' ? '<span class="pn-tag ok">Conferido</span>' : d.status === 'enviado' ? '<span class="pn-tag">Recebido</span>' : '<span class="pn-tag warn">Pendente</span>';
          return '<li class="pn-item ' + cls + '"><span class="dot">' + CHK + '</span><div><div class="pn-row"><h3>' + esc(d.titulo) + '</h3>' + tag + '</div>' + (d.obs ? '<p>' + esc(d.obs) + '</p>' : '') + '</div></li>';
        }).join('') : vazio('Nenhum documento pendente no momento.');

        var ab = hon.filter(function (h) { return h.status !== 'pago'; });
        conta('[data-n-hon]', ab.length);
        var tot = ab.reduce(function (s, h) { return s + Number(h.valor || 0); }, 0);
        var ht = $('[data-hon-total]'); ht.hidden = !ab.length; ht.innerHTML = '<span>Em aberto</span><b>' + reais(tot) + '</b>';
        put('[data-s-hon]', ab.length ? 'Próxima: ' + (dataBR(ab[0].vencimento) || 'a combinar') : (hon.length ? 'Tudo quitado' : 'Sem lançamentos'));
        put('[data-s-hon2]', ab.length ? [ab[0].descricao, reais(ab[0].valor)].filter(Boolean).join(' · ') : '');
        $('[data-honorarios]').innerHTML = hon.length ? hon.map(function (h) {
          var pago = h.status === 'pago', lk = url(h.link);
          return '<li class="pn-item"><div><h3>' + esc(h.descricao) + '</h3><span class="meta">' + (h.vencimento ? 'Vencimento ' + dataBR(h.vencimento) : '') + '</span></div>' +
            '<span class="val">' + reais(h.valor) + '</span><span class="pn-tag ' + (pago ? 'ok' : 'warn') + '">' + (pago ? 'Pago' : 'Em aberto') + '</span>' +
            (!pago && lk ? '<a class="pn-link pay" href="' + esc(lk) + '" target="_blank" rel="noopener">Abrir boleto ou link de pagamento →</a>' : '') + '</li>';
        }).join('') : vazio('Nenhum lançamento por aqui.');

        conta('[data-n-av]', av.length);
        $('[data-avisos]').innerHTML = av.length ? av.map(function (a) {
          return '<li class="pn-item"><div class="pn-row"><h3>' + esc(a.titulo) + '</h3><span class="meta">' + dataBR(a.criado_em) + '</span></div><p>' + esc(a.texto) + '</p></li>';
        }).join('') : vazio('Sem avisos por enquanto.');

        $('[data-espera]').hidden = true; painel.hidden = false;
      });

      $('[data-upload]').addEventListener('submit', function (e) {
        e.preventDefault(); var f = e.target, m = $('.pn-msg', f), arq = f.arquivo.files[0];
        if (!arq) return (m.textContent = 'Escolha um arquivo.');
        if (arq.size > 10 * 1024 * 1024) return (m.textContent = 'O arquivo passa de 10 MB. Reduza ou divida o arquivo.');
        if (!/^(application\/pdf|image\/jpeg|image\/png)$/.test(arq.type)) return (m.textContent = 'Envie PDF, JPG ou PNG.');
        var nome = arq.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80);
        m.textContent = 'Enviando…';
        sb.storage.from('documentos').upload(uid + '/' + Date.now() + '-' + nome, arq, { contentType: arq.type, upsert: false }).then(function (x) {
          if (x.error) { m.textContent = 'Não foi possível enviar agora. Tente de novo ou fale com o escritório.'; return; }
          m.textContent = 'Arquivo enviado.'; f.reset(); put('[data-arq-nome]', 'Toque para selecionar ou tirar uma foto do documento'); listarArquivos();
        });
      });

      $('[data-editar]').addEventListener('submit', function (e) {
        e.preventDefault(); var f = e.target, ok = $('.pn-ok', f);
        sb.from('clientes').update({ telefone: f.telefone.value.trim(), endereco: f.endereco.value.trim() }).eq('id', uid).then(function (r) {
          ok.textContent = r.error ? 'Não foi possível salvar agora.' : 'Contato atualizado.';
        });
      });
    });
    $('[data-sair]').addEventListener('click', function () { sb.auth.signOut().then(function () { location.replace('area-do-cliente'); }); });
  }
})();
