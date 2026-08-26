/* ===========================================================
   Harmonia Prime · treinador
   -----------------------------------------------------------
   Responde a uma pergunta só:

     "qual é a menor coisa que dá para colocar debaixo dos dedos
      hoje e que produz um resultado musical perceptível?"

   Guarda o histórico no navegador, escolhe a próxima microprática
   e trava a escolha. Enquanto a atual não for marcada como
   praticada, ela continua sendo a de hoje. Nada de fila visível.

   O que já saiu legal volta em prazos cada vez mais longos; o que
   travou volta amanhã. A conta fica aqui dentro: na tela continua
   sendo uma prática por vez, sem lista de atrasados.
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
  var ouvinte = null;   // a nuvem escuta aqui para saber que tem coisa nova a subir

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

  function guardar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(cache)); } catch (e) { /* modo privado */ }
  }

  function gravar() {
    guardar();
    if (ouvinte) ouvinte();
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

  /* ---------- repetição espaçada ---------- */

  var PRIMEIRO = 2;        // dias até o primeiro reencontro
  var CRESCIMENTO = 2.5;   // quanto o prazo estica a cada "saiu legal"
  var TETO = 120;          // acima disso o som já é seu; esperar mais não ensina nada

  function chunkDaSessao(s) {
    if (s.chunkId) return s.chunkId;
    var p = pratica(s.praticaId);
    return p ? p.chunkId : null;
  }

  /**
   * O prazo de um chunk sai do log de sessões, nunca de um campo guardado.
   * É o que mantém a junção entre dois aparelhos sendo união de conjuntos:
   * quem praticou nos dois refaz a escada do zero e chega no mesmo lugar.
   *
   * A escada: "saiu legal" estica o prazo, "ainda estranho" o congela e
   * "travei" devolve o som para amanhã. Praticar duas vezes no mesmo dia não
   * estica nada, porque repetir agora não prova que daqui a uma semana
   * continua na mão.
   *
   * Devolve null enquanto o chunk nunca foi praticado.
   */
  function escadaDoChunk(id) {
    var intervalo = 0, ultima = null, anterior = null;
    ler().sessoes.forEach(function (s) {
      if (!s.praticou || chunkDaSessao(s) !== id) return;
      var mesmoDia = anterior && dia(new Date(s.data)) === dia(new Date(anterior));
      if (!intervalo) intervalo = PRIMEIRO;
      else if (s.feedback === 'travei') intervalo = 1;
      else if (s.feedback === 'legal' && !mesmoDia) intervalo = Math.min(Math.round(intervalo * CRESCIMENTO), TETO);
      anterior = s.data;
      ultima = s.data;
    });
    if (!intervalo) return null;
    // atraso ≥ 0 quer dizer vencido; quanto maior, mais tempo o som está largado
    return { intervalo: intervalo, ultima: ultima, atraso: diasEntre(ultima) - intervalo };
  }

  /**
   * Estado interno do chunk. O usuário nunca gerencia isto; serve para o
   * treinador saber o que ainda precisa voltar e o que já está na mão.
   * novo · praticando · praticado · revisar · automatico
   */
  function estadoDoChunk(id) {
    var e = escadaDoChunk(id);
    if (!e) return 'novo';
    if (e.atraso >= 0) return 'revisar';
    if (e.intervalo >= 30) return 'automatico';
    if (e.intervalo >= 7) return 'praticado';
    return 'praticando';
  }

  /* ---------- escolha da próxima ---------- */

  function ultimaSessao() {
    var s = ler().sessoes;
    return s.length ? s[s.length - 1] : null;
  }

  function ultimaPraticada() {
    var s = ler().sessoes;
    for (var i = s.length - 1; i >= 0; i--) if (s[i].praticou) return s[i];
    return null;
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

  /** O chunk vencido que mais precisa voltar, sem alarde e sem lista. */
  function paraRevisar(evitarChunk) {
    var candidatos = [];
    CHUNKS.forEach(function (c) {
      if (c.id === evitarChunk) return;
      var e = escadaDoChunk(c.id);
      if (e && e.atraso >= 0) candidatos.push({ chunk: c, escada: e });
    });
    if (!candidatos.length) return null;
    var st = ler();
    // o mais vencido primeiro; empatou, o de prazo mais curto, que é o mais frágil
    candidatos.sort(function (a, b) {
      if (b.escada.atraso !== a.escada.atraso) return b.escada.atraso - a.escada.atraso;
      return a.escada.intervalo - b.escada.intervalo;
    });
    var alvo = candidatos[0].chunk;
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

    var nova = proximaNova();

    // dívida de revisão: som vencido passa na frente do conteúdo novo, com um
    // freio para o avanço não parar, nunca dois reencontros seguidos enquanto
    // houver som novo esperando
    var rev = paraRevisar(ult && ult.chunkId);
    if (rev) {
      var anterior = ultimaPraticada();
      var seguidas = anterior && anterior.motivo === 'revisao';
      if (!seguidas || !nova) return { id: rev.id, motivo: 'revisao' };
    }

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

    // o motivo entra na sessão: é assim que a escolha de amanhã sabe que a de
    // hoje já foi um reencontro, sem guardar estado à parte do log
    var motivo = (st.atual && st.atual.id === praticaId) ? st.atual.motivo : null;

    st.sessoes.push({
      praticaId: praticaId,
      chunkId: p.chunkId,
      data: new Date().toISOString(),
      duracaoPlanejada: p.duracao || 5,
      praticou: !!praticou,
      motivo: motivo,
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
      var e = escadaDoChunk(c.id);
      return {
        chunk: c,
        estado: estadoDoChunk(c.id),
        vezes: r.vezes || 0,
        ultima: r.ultima || null,
        intervalo: e ? e.intervalo : 0,
        volta: e ? Math.max(0, -e.atraso) : null   // dias até o próximo reencontro
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

  /* ---------- sincronização entre aparelhos ---------- */

  /**
   * O histórico é um log de sessões carimbadas com a hora. Isso torna a
   * junção de dois aparelhos uma união de conjuntos, sem escolher um lado
   * nem perder prática de ninguém: os contadores saem recalculados do log.
   */

  function exportar() {
    return JSON.parse(JSON.stringify(ler()));
  }

  /** Grava vindo de fora sem avisar a nuvem de volta, senão vira eco. */
  function importar(estado) {
    if (!estado || !estado.versao) return;
    cache = estado;
    guardar();
  }

  function recomputar(st) {
    st.praticas = {};
    st.chunks = {};
    st.sessoes.forEach(function (s) {
      if (!s.praticou) return;
      var p = pratica(s.praticaId);
      var chunkId = s.chunkId || (p && p.chunkId);

      var rp = st.praticas[s.praticaId] || { vezes: 0, ultima: null, feedback: null };
      rp.vezes++;
      rp.ultima = s.data;
      if (s.feedback) rp.feedback = s.feedback;
      st.praticas[s.praticaId] = rp;

      if (!chunkId) return;
      var rc = st.chunks[chunkId] || { vezes: 0, ultima: null, feedback: null };
      rc.vezes++;
      rc.ultima = s.data;
      if (s.feedback) rc.feedback = s.feedback;
      st.chunks[chunkId] = rc;
    });
  }

  function mesclar(local, remoto) {
    if (!remoto || !remoto.versao) return local;
    if (!local || !local.versao) return remoto;

    var st = vazio();
    var vistas = {};

    local.sessoes.concat(remoto.sessoes).forEach(function (s) {
      if (!s || !s.data) return;
      var k = s.praticaId + '|' + s.data;
      if (vistas[k]) {
        // a mesma sessão nos dois lados: o feedback anotado depois prevalece
        if (!vistas[k].feedback && s.feedback) vistas[k].feedback = s.feedback;
        if (!vistas[k].motivo && s.motivo) vistas[k].motivo = s.motivo;
        return;
      }
      vistas[k] = s;
      st.sessoes.push(s);
    });

    st.sessoes.sort(function (a, b) { return a.data < b.data ? -1 : (a.data > b.data ? 1 : 0); });
    if (st.sessoes.length > 400) st.sessoes = st.sessoes.slice(-400);

    recomputar(st);

    st.encerrado = [local.encerrado, remoto.encerrado]
      .filter(Boolean).sort().pop() || null;

    // a prática travada é a do aparelho que mexeu por último, e some se
    // qualquer um dos dois já a registrou depois de ela ter sido escolhida
    var a = local.atual, b = remoto.atual;
    var esc = (a && b) ? (a.desde >= b.desde ? a : b) : (a || b);
    if (esc) {
      var praticouDepois = st.sessoes.some(function (s) {
        return s.praticou && s.data > esc.desde;
      });
      if (!praticouDepois) st.atual = esc;
    }

    return st;
  }

  /** A nuvem chama isto para saber quando existe coisa nova a subir. */
  function escutar(fn) {
    ouvinte = fn;
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
    escadaDoChunk: escadaDoChunk,
    pratica: pratica,
    chunk: chunk,
    apagarTudo: apagarTudo,
    exportar: exportar,
    importar: importar,
    mesclar: mesclar,
    escutar: escutar
  };

})(typeof window !== 'undefined' ? window : globalThis);
