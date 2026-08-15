/* ===========================================================
   Harmonia Prime · treinador
   -----------------------------------------------------------
   Responde a uma pergunta só:

     "qual é a menor coisa que dá para colocar debaixo dos dedos
      hoje e que produz um resultado musical perceptível?"

   Guarda o histórico no navegador, escolhe a próxima microprática
   e trava a escolha. Enquanto a atual não for marcada como
   praticada, ela continua sendo a de hoje. Nada de fila visível.
   =========================================================== */
(function (global) {
  'use strict';

  var CHAVE = 'hp-treinador';
  var PRATICAS = global.MICROPRATICAS || [];
  var CHUNKS = global.CHUNKS || [];

  /* ---------- persistência ---------- */

  function vazio() {
    return {
      versao: 1,
      atual: null,        // { id, motivo, desde }
      encerrado: null,    // dia em que o usuário disse "por hoje chega"
      sessoes: [],        // { praticaId, chunkId, data, praticou, feedback }
      praticas: {},       // { [praticaId]: { vezes, ultima, feedback } }
      chunks: {}          // { [chunkId]: { vezes, ultima, feedback } }
    };
  }

  var cache = null;

  function ler() {
    if (cache) return cache;
    try {
      var s = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      cache = (s && s.versao) ? s : vazio();
    } catch (e) {
      cache = vazio();
    }
    return cache;
  }

  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(cache)); } catch (e) { /* modo privado */ }
  }

  /* ---------- datas ---------- */

  function dia(d) {
    d = d || new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function diasEntre(iso, agora) {
    if (!iso) return Infinity;
    var a = new Date(iso), b = agora || new Date();
    return Math.floor((b - a) / 86400000);
  }

  /* ---------- consultas ---------- */

  function pratica(id) {
    for (var i = 0; i < PRATICAS.length; i++) if (PRATICAS[i].id === id) return PRATICAS[i];
    return null;
  }

  function chunk(id) {
    for (var i = 0; i < CHUNKS.length; i++) if (CHUNKS[i].id === id) return CHUNKS[i];
    return null;
  }

  function vezes(id) {
    var r = ler().praticas[id];
    return r ? r.vezes : 0;
  }

  /** Uma microprática só entra na fila quando o que ela pressupõe já foi feito. */
  function liberada(p) {
    if (!p.depende || !p.depende.length) return true;
    return p.depende.every(function (id) { return vezes(id) > 0; });
  }

  /**
   * Estado interno do chunk. O usuário nunca gerencia isto; serve para o
   * treinador saber o que ainda precisa voltar e o que já está na mão.
   * novo · praticando · praticado · revisar · automatico
   */
  function estadoDoChunk(id) {
    var r = ler().chunks[id];
    if (!r || !r.vezes) return 'novo';
    var faz = diasEntre(r.ultima);
    if (r.vezes >= 4 && r.feedback === 'legal') return faz > 21 ? 'revisar' : 'automatico';
    if (r.vezes >= 3) return faz > 10 ? 'revisar' : 'praticado';
    return faz > 7 ? 'revisar' : 'praticando';
  }

  /* ---------- escolha da próxima ---------- */

  function ultimaSessao() {
    var s = ler().sessoes;
    return s.length ? s[s.length - 1] : null;
  }

  /**
   * Depois de "travei" ou "ainda estranho", o mesmo som volta.
   * Se existir outra microprática do mesmo chunk ainda não feita, ela vem
   * (o som dentro de outra progressão). Senão, repete a mesma.
   */
  function reforco(sessao) {
    var doMesmoChunk = PRATICAS.filter(function (p) {
      return p.chunkId === sessao.chunkId && liberada(p);
    });
    var nova = doMesmoChunk.filter(function (p) { return vezes(p.id) === 0; })[0];
    if (sessao.feedback === 'estranho' && nova) return nova;
    var mesma = pratica(sessao.praticaId);
    if (mesma) return mesma;
    return nova || null;
  }

  /** Um chunk antigo que merece reencontro, sem alarde e sem lista. */
  function paraRevisar(evitarChunk) {
    var candidatos = CHUNKS.filter(function (c) {
      if (c.id === evitarChunk) return false;
      return estadoDoChunk(c.id) === 'revisar';
    });
    if (!candidatos.length) return null;
    var st = ler();
    candidatos.sort(function (a, b) {
      var ra = st.chunks[a.id] || {}, rb = st.chunks[b.id] || {};
      return new Date(ra.ultima || 0) - new Date(rb.ultima || 0);
    });
    var alvo = candidatos[0];
    var doChunk = PRATICAS.filter(function (p) { return p.chunkId === alvo.id && vezes(p.id) > 0; });
    doChunk.sort(function (a, b) {
      var ra = st.praticas[a.id] || {}, rb = st.praticas[b.id] || {};
      return new Date(ra.ultima || 0) - new Date(rb.ultima || 0);
    });
    return doChunk[0] || null;
  }

  /** A próxima nova da fila curada, respeitando o que ela pressupõe. */
  function proximaNova() {
    return PRATICAS.filter(function (p) {
      return vezes(p.id) === 0 && liberada(p);
    })[0] || null;
  }

  /** A menos praticada, quando não sobrou nada novo. */
  function menosPraticada() {
    var st = ler();
    var lista = PRATICAS.filter(liberada).slice();
    lista.sort(function (a, b) {
      var va = vezes(a.id), vb = vezes(b.id);
      if (va !== vb) return va - vb;
      var ra = st.praticas[a.id] || {}, rb = st.praticas[b.id] || {};
      return new Date(ra.ultima || 0) - new Date(rb.ultima || 0);
    });
    return lista[0] || null;
  }

  function escolher() {
    var st = ler();
    var ult = ultimaSessao();

    if (ult && ult.praticou && (ult.feedback === 'travei' || ult.feedback === 'estranho')) {
      var r = reforco(ult);
      // o mesmo som de novo: em outra progressão quando existir, senão a mesma
      if (r) return { id: r.id, motivo: r.id === ult.praticaId ? 'repetir' : 'reforco' };
    }

    // reencontro discreto: uma a cada quatro sessões, quando houver o que rever
    var feitas = st.sessoes.filter(function (s) { return s.praticou; }).length;
    if (feitas > 0 && feitas % 4 === 0) {
      var rev = paraRevisar(ult && ult.chunkId);
      if (rev) return { id: rev.id, motivo: 'revisao' };
    }

    var nova = proximaNova();
    if (nova) return { id: nova.id, motivo: 'nova' };

    var qualquer = menosPraticada();
    return qualquer ? { id: qualquer.id, motivo: 'revisao' } : null;
  }

  /* ---------- o que a home pede ---------- */

  /**
   * Devolve o que mostrar agora:
   *   { modo: 'pratica', pratica, chunk, motivo }
   *   { modo: 'feito' }        já praticou hoje e encerrou
   *   { modo: 'vazio' }        acabou o conteúdo cadastrado
   */
  function hoje() {
    var st = ler();

    if (st.atual) {
      var p = pratica(st.atual.id);
      if (p) return { modo: 'pratica', pratica: p, chunk: chunk(p.chunkId), motivo: st.atual.motivo };
      st.atual = null;
    }

    if (st.encerrado === dia()) return { modo: 'feito' };

    var e = escolher();
    if (!e) return { modo: 'vazio' };

    st.atual = { id: e.id, motivo: e.motivo, desde: new Date().toISOString() };
    gravar();
    var pr = pratica(e.id);
    return { modo: 'pratica', pratica: pr, chunk: chunk(pr.chunkId), motivo: e.motivo };
  }

  /* ---------- registro ---------- */

  /**
   * praticou = false: nada muda. A mesma microprática continua esperando.
   * praticou = true: registra e libera a próxima, que só aparece se ele pedir.
   */
  function registrar(praticaId, praticou, feedback) {
    var st = ler();
    var p = pratica(praticaId);
    if (!p) return;

    st.sessoes.push({
      praticaId: praticaId,
      chunkId: p.chunkId,
      data: new Date().toISOString(),
      duracaoPlanejada: p.duracao || 5,
      praticou: !!praticou,
      feedback: feedback || null
    });
    if (st.sessoes.length > 400) st.sessoes = st.sessoes.slice(-400);

    if (praticou) {
      var rp = st.praticas[praticaId] || { vezes: 0 };
      rp.vezes++;
      rp.ultima = new Date().toISOString();
      rp.feedback = feedback || rp.feedback || null;
      st.praticas[praticaId] = rp;

      var rc = st.chunks[p.chunkId] || { vezes: 0 };
      rc.vezes++;
      rc.ultima = rp.ultima;
      rc.feedback = feedback || rc.feedback || null;
      st.chunks[p.chunkId] = rc;

      st.atual = null;
      st.encerrado = dia();
    }
    gravar();
  }

  /** Anota o "como foi" da sessão que acabou de ser registrada. */
  function anotarFeedback(praticaId, feedback) {
    var st = ler();
    for (var i = st.sessoes.length - 1; i >= 0; i--) {
      if (st.sessoes[i].praticaId === praticaId) {
        st.sessoes[i].feedback = feedback;
        break;
      }
    }
    if (st.praticas[praticaId]) st.praticas[praticaId].feedback = feedback;
    var p = pratica(praticaId);
    if (p && st.chunks[p.chunkId]) st.chunks[p.chunkId].feedback = feedback;
    gravar();
  }

  /** Só quando o usuário pede: escolhe outra agora. */
  function maisUma() {
    var st = ler();
    st.encerrado = null;
    var e = escolher();
    if (!e) { gravar(); return null; }
    st.atual = { id: e.id, motivo: e.motivo, desde: new Date().toISOString() };
    gravar();
    return e;
  }

  function encerrarPorHoje() {
    var st = ler();
    st.encerrado = dia();
    gravar();
  }

  /* ---------- histórico, em voz baixa ---------- */

  /** "Esta semana você colocou 3 ideias novas debaixo dos dedos." */
  function resumoSemana() {
    var st = ler();
    var limite = new Date(Date.now() - 7 * 86400000);
    var chunksDaSemana = {};
    var sessoes = 0;
    st.sessoes.forEach(function (s) {
      if (!s.praticou || new Date(s.data) < limite) return;
      sessoes++;
      chunksDaSemana[s.chunkId] = true;
    });
    var ideias = Object.keys(chunksDaSemana).length;
    if (!sessoes) return null;
    if (ideias === 1) return 'Esta semana você colocou uma ideia nova debaixo dos dedos.';
    return 'Esta semana você colocou ' + ideias + ' ideias novas debaixo dos dedos.';
  }

  /** Lista tranquila para a biblioteca: o que já virou vocabulário. */
  function vocabulario() {
    return CHUNKS.map(function (c) {
      var r = ler().chunks[c.id] || {};
      return {
        chunk: c,
        estado: estadoDoChunk(c.id),
        vezes: r.vezes || 0,
        ultima: r.ultima || null
      };
    });
  }

  function historico(limite) {
    var s = ler().sessoes.slice().reverse();
    return (limite ? s.slice(0, limite) : s).map(function (x) {
      var p = pratica(x.praticaId);
      return {
        titulo: p ? p.titulo : x.praticaId,
        data: x.data,
        praticou: x.praticou,
        feedback: x.feedback
      };
    });
  }

  function apagarTudo() {
    cache = vazio();
    gravar();
  }

  global.Treinador = {
    hoje: hoje,
    registrar: registrar,
    anotarFeedback: anotarFeedback,
    maisUma: maisUma,
    encerrarPorHoje: encerrarPorHoje,
    resumoSemana: resumoSemana,
    vocabulario: vocabulario,
    historico: historico,
    estadoDoChunk: estadoDoChunk,
    pratica: pratica,
    chunk: chunk,
    apagarTudo: apagarTudo
  };

})(typeof window !== 'undefined' ? window : globalThis);
