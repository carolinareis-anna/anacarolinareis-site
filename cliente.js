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
    sb.auth.getSession().then(function (r) {
      var s = r.data.session;
      if (!s) return location.replace('area-do-cliente');
      Promise.all([
        sb.from('clientes').select('nome, cpf, email, telefone, endereco').eq('id', s.user.id).maybeSingle(),
        sb.from('conteudos').select('chave, titulo, html').eq('chave', 'acompanhamento').maybeSingle()
      ]).then(function (res) {
        var c = res[0].data || { email: s.user.email }, ct = res[1].data;
        $('[data-nome]').textContent = (c.nome || '').split(' ')[0] || 'cliente';
        var cpf = c.cpf ? c.cpf.replace(/^(\d{3})\.?\d{3}\.?\d{3}-?(\d{2})$/, '$1.***.***-$2') : '—';
        $('[data-dados]').innerHTML = [['Nome', c.nome], ['CPF', cpf], ['E-mail', c.email || s.user.email], ['WhatsApp', c.telefone], ['Endereço', c.endereco]]
          .map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1] || '—') + '</dd></div>'; }).join('');
        var fe = $('[data-editar]'); fe.telefone.value = c.telefone || ''; fe.endereco.value = c.endereco || '';
        $('[data-conteudo]').innerHTML = ct ? '<h2>' + esc(ct.titulo) + '</h2>' + ct.html : '<h2>Acompanhamento</h2><p>As orientações serão publicadas em breve.</p>';
        $('[data-espera]').hidden = true; painel.hidden = false;
      });
      $('[data-editar]').addEventListener('submit', function (e) {
        e.preventDefault(); var f = e.target, ok = $('.pn-ok', f);
        sb.from('clientes').update({ telefone: f.telefone.value.trim(), endereco: f.endereco.value.trim() }).eq('id', s.user.id).then(function (r) {
          ok.textContent = r.error ? 'Não foi possível salvar agora.' : 'Contato atualizado.';
        });
      });
    });
    $('[data-sair]').addEventListener('click', function () { sb.auth.signOut().then(function () { location.replace('area-do-cliente'); }); });
  }
})();
