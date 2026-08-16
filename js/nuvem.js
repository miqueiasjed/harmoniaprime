/* ===========================================================
   Harmonia Prime · nuvem
   -----------------------------------------------------------
   O app continua funcionando inteiro sem isto aqui. O navegador
   segue sendo a fonte de leitura: abre rápido, funciona sem
   internet, e nada espera resposta de servidor para aparecer
   na tela.

   O que a nuvem faz é levar o mesmo histórico para os outros
   aparelhos. Ao entrar, o que está aqui e o que está lá são
   MESCLADOS, nunca sobrescritos: praticar no celular sem sinal
   e depois abrir o computador soma as duas coisas.

   Carrega o SDK sob demanda. Quem nunca sincronizou não baixa
   um byte a mais.
   =========================================================== */
(function (global) {
  'use strict';

  var CDN_SUPABASE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  var CDN_GOOGLE = 'https://accounts.google.com/gsi/client';
  var ESPERA_PUSH = 2000;

  var cfg = global.HP_CONFIG || {};
  var cliente = null;
  var usuario = null;
  var ocupado = false;
  var erro = null;
  var timerPush = null;
  var ouvintes = [];

  /* ---------- utilidades ---------- */

  function configurado() {
    return !!(cfg.supabaseUrl && cfg.supabaseKey);
  }

  function avisar() {
    ouvintes.forEach(function (fn) {
      try { fn(); } catch (e) { /* uma tela quebrada não derruba as outras */ }
    });
  }

  function carregarScript(url) {
    return new Promise(function (ok, falhou) {
      var achado = document.querySelector('script[src="' + url + '"]');
      if (achado) {
        if (achado.dataset.pronto) return ok();
        achado.addEventListener('load', function () { ok(); });
        achado.addEventListener('error', function () { falhou(new Error('falhou ' + url)); });
        return;
      }
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.addEventListener('load', function () { s.dataset.pronto = '1'; ok(); });
      s.addEventListener('error', function () { falhou(new Error('falhou ' + url)); });
      document.head.appendChild(s);
    });
  }

  /* ---------- cliente ---------- */

  function garantirCliente() {
    if (cliente) return Promise.resolve(cliente);
    if (!configurado()) return Promise.reject(new Error('nuvem não configurada'));
    return carregarScript(CDN_SUPABASE).then(function () {
      cliente = global.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      cliente.auth.onAuthStateChange(function (evento, sessao) {
        usuario = sessao ? sessao.user : null;
        if (evento === 'SIGNED_OUT') avisar();
      });
      return cliente;
    });
  }

  /**
   * Já existe sessão guardada, ou estamos voltando de um redirect de login?
   * Serve para não carregar o SDK à toa em quem só quer praticar.
   */
  function jaTemSessao() {
    if (/[?&#](code|access_token)=/.test(location.href)) return true;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') !== -1) return true;
      }
    } catch (e) { /* modo privado */ }
    return false;
  }

  /* ---------- progresso ---------- */

  function baixar() {
    return cliente.from('progresso')
      .select('dados')
      .eq('usuario_id', usuario.id)
      .maybeSingle();
  }

  function subir(dados) {
    return cliente.from('progresso').upsert({
      usuario_id: usuario.id,
      dados: dados,
      atualizado_em: new Date().toISOString()
    }, { onConflict: 'usuario_id' });
  }

  /** Baixa, mescla com o que está aqui, grava dos dois lados. */
  function sincronizar() {
    if (!cliente || !usuario) return Promise.resolve();
    ocupado = true;
    erro = null;
    avisar();

    return baixar().then(function (r) {
      if (r.error) throw r.error;
      var remoto = r.data ? r.data.dados : null;
      var junto = global.Treinador.mesclar(global.Treinador.exportar(), remoto);
      global.Treinador.importar(junto);
      return subir(junto);
    }).then(function (r) {
      if (r && r.error) throw r.error;
      ocupado = false;
      avisar();
    }).catch(function (e) {
      ocupado = false;
      erro = e && e.message ? e.message : 'não deu para sincronizar';
      avisar();
    });
  }

  /** Prática registrada agora sobe daqui a pouco, sem travar a tela. */
  function agendarPush() {
    if (!cliente || !usuario) return;
    clearTimeout(timerPush);
    timerPush = setTimeout(function () {
      subir(global.Treinador.exportar()).catch(function () { /* sobe na próxima */ });
    }, ESPERA_PUSH);
  }

  function pushAgora() {
    if (!cliente || !usuario || !timerPush) return;
    clearTimeout(timerPush);
    timerPush = null;
    subir(global.Treinador.exportar()).catch(function () { /* fica para a próxima abertura */ });
  }

  /* ---------- entrar com o Google ---------- */

  function hex(buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer), function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  }

  /**
   * O Google assina o token com um nonce; o Supabase confere o par.
   * Onde não há crypto.subtle (http sem ser localhost) o login segue sem ele.
   */
  function novoNonce() {
    if (!global.crypto || !global.crypto.subtle || !global.TextEncoder) {
      return Promise.resolve(null);
    }
    var bytes = new Uint8Array(16);
    global.crypto.getRandomValues(bytes);
    var cru = hex(bytes.buffer);
    return global.crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(cru))
      .then(function (d) { return { cru: cru, hash: hex(d) }; })
      .catch(function () { return null; });
  }

  function entrarComToken(credencial, nonceCru) {
    var opcoes = { provider: 'google', token: credencial };
    if (nonceCru) opcoes.nonce = nonceCru;
    return cliente.auth.signInWithIdToken(opcoes).then(function (r) {
      if (r.error) throw r.error;
      usuario = r.data.user;
      global.Treinador.escutar(agendarPush);
      return sincronizar();
    });
  }

  /** Caminho de reserva: sai da página, volta logado. */
  function entrarPorRedirect() {
    return garantirCliente().then(function () {
      return cliente.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + location.pathname }
      });
    }).then(function (r) {
      // provider desligado no painel cai aqui; sem isto o botão morre calado
      if (r && r.error) throw r.error;
    });
  }

  /**
   * Desenha o botão do Google dentro do elemento dado. Ele abre uma janelinha
   * do próprio Google e volta na mesma página, que é o que faz o login
   * funcionar quando o app está aberto pela tela de início do celular.
   */
  function montarEntrada(caixa) {
    if (!configurado()) return Promise.reject(new Error('nuvem não configurada'));

    return garantirCliente().then(function () {
      if (!cfg.googleClientId) return entrarPorRedirect();

      return carregarScript(CDN_GOOGLE).then(novoNonce).then(function (nonce) {
        var g = global.google && global.google.accounts && global.google.accounts.id;
        if (!g) return entrarPorRedirect();

        var init = {
          client_id: cfg.googleClientId,
          callback: function (resp) {
            ocupado = true;
            avisar();
            entrarComToken(resp.credential, nonce && nonce.cru).catch(function (e) {
              ocupado = false;
              erro = e && e.message ? e.message : 'o Google não completou a entrada';
              avisar();
            });
          }
        };
        if (nonce) init.nonce = nonce.hash;

        g.initialize(init);
        caixa.innerHTML = '';
        g.renderButton(caixa, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'pt-BR'
        });
      }).catch(function () {
        return entrarPorRedirect();
      });
    });
  }

  function sair() {
    if (!cliente) return Promise.resolve();
    return cliente.auth.signOut().then(function () {
      usuario = null;
      avisar();
    });
  }

  /* ---------- abertura ---------- */

  /**
   * Chamado uma vez quando o app abre. Só faz alguma coisa se este aparelho
   * já entrou alguma vez; caso contrário devolve na hora e ninguém espera.
   */
  function iniciar() {
    if (!configurado() || !jaTemSessao()) return Promise.resolve();

    return garantirCliente().then(function () {
      return cliente.auth.getSession();
    }).then(function (r) {
      usuario = r.data.session ? r.data.session.user : null;
      if (!usuario) return;
      global.Treinador.escutar(agendarPush);
      return sincronizar();
    }).catch(function (e) {
      erro = e && e.message ? e.message : 'não deu para falar com a nuvem';
      avisar();
    });
  }

  function estado() {
    return {
      configurado: configurado(),
      ligado: !!usuario,
      email: usuario ? (usuario.email || null) : null,
      ocupado: ocupado,
      erro: erro
    };
  }

  function aoMudar(fn) {
    ouvintes.push(fn);
  }

  // liga o escutador assim que houver login por qualquer caminho
  function ligarEscuta() {
    global.Treinador.escutar(agendarPush);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') pushAgora();
  });
  global.addEventListener('pagehide', pushAgora);

  global.Nuvem = {
    iniciar: iniciar,
    estado: estado,
    montarEntrada: montarEntrada,
    sincronizar: sincronizar,
    sair: sair,
    aoMudar: aoMudar,
    ligarEscuta: ligarEscuta
  };

})(typeof window !== 'undefined' ? window : globalThis);
