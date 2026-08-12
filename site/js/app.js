/* ===========================================================
   Harmonia Prime — aplicação
   Monta a navegação, renderiza os blocos das aulas e aplica
   a transposição em tudo (cifras + teclados + áudio).
   =========================================================== */
(function (global) {
  'use strict';

  var M = global.Musica;
  var T = global.Teclado;

  var estado = {
    tom: 'C',
    aula: null
  };

  var aulaCorrente = null;

  /* ---------- utilidades ---------- */

  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function criar(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto !== undefined) e.innerHTML = interpolar(texto);
    return e;
  }

  /** Troca {C}, {G/B}, {E} no meio do texto pela cifra no tom atual. */
  function interpolar(texto) {
    if (typeof texto !== 'string' || texto.indexOf('{') === -1) return texto;
    return texto.replace(/\{([A-G][^{}]{0,14})\}/g, function (todo, cifra) {
      var t = tt(cifra);
      return t === cifra ? cifra : t;
    });
  }

  function tomAtual() {
    for (var i = 0; i < M.TONS.length; i++) if (M.TONS[i].nome === estado.tom) return M.TONS[i];
    return M.TONS[0];
  }

  /** Semitons de C até o tom atual, pelo caminho mais curto. */
  function semitons() {
    var pc = tomAtual().pc;
    return pc > 6 ? pc - 12 : pc;
  }

  function tt(cifra) {
    return M.transporCifra(cifra, semitons(), tomAtual().bemol);
  }

  var PISO = 48, TETO = 83;   // C3 .. B5 — registro padrão de todos os teclados

  function vozesDe(item) {
    var v = M.vozes(item, semitons());
    var todas = v.esquerda.concat(v.direita);
    if (!todas.length) return v;
    var desloca = 0;
    var min = Math.min.apply(null, todas), max = Math.max.apply(null, todas);
    while (min + desloca < PISO) desloca += 12;
    while (max + desloca > TETO && min + desloca - 12 >= PISO) desloca -= 12;
    if (desloca) {
      v = {
        esquerda: v.esquerda.map(function (m) { return m + desloca; }),
        direita: v.direita.map(function (m) { return m + desloca; })
      };
    }
    return v;
  }

  function tocarItem(item) {
    var v = vozesDe(item);
    M.tocarNotas(v.esquerda.concat(v.direita), { duracao: 2.2 });
  }

  /* ---------- componentes ---------- */

  function cifraChip(item, extra) {
    var it = typeof item === 'string' ? { cifra: item } : item;
    var b = criar('button', 'chip' + (extra ? ' ' + extra : ''));
    b.type = 'button';
    b.innerHTML = '<span class="chip-cifra">' + tt(it.cifra) + '</span>';
    b.setAttribute('aria-label', 'Tocar ' + tt(it.cifra));
    b.addEventListener('click', function () {
      tocarItem(it);
      b.classList.add('ativo');
      setTimeout(function () { b.classList.remove('ativo'); }, 420);
    });
    espiar(b, it);
    return b;
  }

  /* ---------- espiada no teclado (hover em qualquer cifra) ---------- */

  var espia = { caixa: null, alvo: null, timer: null, saida: null, fixado: false, ponteiro: 'mouse' };

  document.addEventListener('pointerdown', function (ev) {
    espia.ponteiro = ev.pointerType || 'mouse';
  }, true);

  function caixaEspia() {
    if (!espia.caixa) {
      espia.caixa = criar('div', 'espia');
      espia.caixa.setAttribute('role', 'tooltip');
      espia.caixa.addEventListener('mouseenter', function () { clearTimeout(espia.saida); });
      espia.caixa.addEventListener('mouseleave', fecharEspia);
      document.body.appendChild(espia.caixa);
    }
    return espia.caixa;
  }

  function abrirEspia(botao, item) {
    var c = caixaEspia();
    c.innerHTML = '';
    var cab = criar('div', 'espia-cabecalho');
    cab.appendChild(criar('span', 'espia-cifra', tt(item.cifra || (item.lh + ' + ' + item.rh))));
    var v = vozesDe(item);
    var vistos = {}, nomes = [];
    v.esquerda.concat(v.direita).forEach(function (m) {
      var n = M.midiParaNota(m, tomAtual().bemol).replace(/\d+$/, '');
      if (!vistos[n]) { vistos[n] = true; nomes.push(n); }
    });
    cab.appendChild(criar('span', 'espia-notas', nomes.join(' · ')));
    c.appendChild(cab);
    c.appendChild(tecladoDe(item));
    c.classList.add('visivel');

    var r = botao.getBoundingClientRect();
    var lc = c.getBoundingClientRect();
    var margem = 10;
    var esq = r.left + r.width / 2 - lc.width / 2;
    esq = Math.max(margem, Math.min(esq, window.innerWidth - lc.width - margem));
    var topo = r.top - lc.height - 8;
    c.classList.toggle('abaixo', topo < margem);
    if (topo < margem) topo = r.bottom + 8;
    c.style.left = Math.round(esq) + 'px';
    c.style.top = Math.round(topo) + 'px';
    espia.alvo = botao;
  }

  function fecharEspia() {
    clearTimeout(espia.timer);
    if (espia.caixa) espia.caixa.classList.remove('visivel');
    espia.alvo = null;
    espia.fixado = false;
  }

  /** Liga o preview de teclado a qualquer botão de cifra da página. */
  function espiar(botao, item) {
    if (!item || (!item.cifra && !item.lh)) return;
    function abrir() {
      clearTimeout(espia.saida);
      clearTimeout(espia.timer);
      espia.timer = setTimeout(function () { abrirEspia(botao, item); }, 110);
    }
    function fechar() {
      clearTimeout(espia.timer);
      if (espia.fixado) return;          // no toque, fica na tela até tocar fora
      espia.saida = setTimeout(fecharEspia, 160);
    }
    botao.addEventListener('mouseenter', abrir);
    botao.addEventListener('mouseleave', fechar);
    botao.addEventListener('focus', function () { abrirEspia(botao, item); });
    botao.addEventListener('blur', fecharEspia);
    // no celular não existe hover: o toque toca, mostra e deixa fixado
    botao.addEventListener('click', function () {
      clearTimeout(espia.saida);
      espia.fixado = (espia.ponteiro === 'touch');
      abrirEspia(botao, item);
    });
  }

  function tecladoDe(item, opcoes) {
    opcoes = opcoes || {};
    var caixa = criar('div', 'caixa-teclado');
    var v = vozesDe(item);
    var marc = null;
    if (item.marcadores) {
      marc = item.marcadores.map(function (mk) {
        return { de: v.direita[mk.de], para: v.direita[mk.para], texto: mk.texto };
      }).filter(function (mk) { return mk.de !== undefined && mk.para !== undefined; });
    }
    T.desenhar(caixa, {
      esquerda: v.esquerda,
      direita: v.direita,
      marcadores: marc,
      bemol: tomAtual().bemol,
      rotulos: opcoes.rotulos !== false,
      preferido: { inicio: PISO, fim: TETO }
    });
    return caixa;
  }

  function botaoTocar(texto, aoClicar) {
    var b = criar('button', 'btn-tocar', '<span class="ico">▶</span>' + (texto || 'Tocar'));
    b.type = 'button';
    b.addEventListener('click', aoClicar);
    return b;
  }

  /** "ver no vídeo": abre o player no segundo exato em que o tema aparece. */
  function relogio(seg) {
    var m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ---------- player em pop-up (sem sair da página) ---------- */

  var player = { fundo: null, moldura: null, titulo: null, fechar: null, origem: null };

  function montarPlayer() {
    if (player.fundo) return player;

    var fundo = criar('div', 'video-fundo');
    fundo.setAttribute('role', 'dialog');
    fundo.setAttribute('aria-modal', 'true');
    fundo.setAttribute('aria-label', 'Vídeo da aula');

    var caixa = criar('div', 'video-caixa');
    var barra = criar('div', 'video-barra');
    var titulo = criar('span', 'video-titulo');
    var fechar = criar('button', 'video-fechar', '✕');
    fechar.type = 'button';
    fechar.setAttribute('aria-label', 'Fechar vídeo');
    barra.appendChild(titulo);
    barra.appendChild(fechar);

    var moldura = criar('div', 'video-moldura');
    caixa.appendChild(barra);
    caixa.appendChild(moldura);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);

    fechar.addEventListener('click', fecharVideo);
    fundo.addEventListener('click', function (ev) { if (ev.target === fundo) fecharVideo(); });

    player.fundo = fundo;
    player.moldura = moldura;
    player.titulo = titulo;
    player.fechar = fechar;
    return player;
  }

  function abrirVideo(idVideo, segundos, rotulo, origem) {
    var p = montarPlayer();
    M.pararSequencia();
    fecharEspia();

    var ifr = criar('iframe');
    ifr.src = 'https://www.youtube-nocookie.com/embed/' + idVideo +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1' +
      (segundos ? '&start=' + segundos : '');
    ifr.title = rotulo || 'Vídeo da aula';
    ifr.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
    ifr.setAttribute('allowfullscreen', '');

    p.moldura.innerHTML = '';
    p.moldura.appendChild(ifr);
    p.titulo.textContent = rotulo || 'Vídeo da aula';
    p.origem = origem || null;

    document.body.classList.add('video-aberto');
    p.fundo.classList.add('visivel');
    p.fechar.focus();
  }

  function videoAberto() {
    return !!(player.fundo && player.fundo.classList.contains('visivel'));
  }

  function fecharVideo() {
    if (!videoAberto()) return;
    player.fundo.classList.remove('visivel');
    player.moldura.innerHTML = '';        // descarta o iframe: corta o som na hora
    document.body.classList.remove('video-aberto');
    if (player.origem && document.contains(player.origem)) player.origem.focus();
    player.origem = null;
  }

  /** Clique com modificador ou botão do meio continua abrindo no YouTube. */
  function aoClicarVideo(a, idVideo, segundos, rotulo) {
    a.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      abrirVideo(idVideo, segundos, rotulo, a);
    });
  }

  function linkVideo(bloco) {
    if (!aulaCorrente || !aulaCorrente.video || bloco.t === undefined) return null;
    var a = criar('a', 'ver-video', '<span class="ico">▶</span>ver no vídeo <span class="tempo">' + relogio(bloco.t) + '</span>');
    a.href = 'https://www.youtube.com/watch?v=' + aulaCorrente.video.id + '&t=' + bloco.t + 's';
    a.rel = 'noopener';
    a.title = 'Abre o vídeo da aula em ' + relogio(bloco.t);
    var nome = bloco.titulo || bloco.termo || bloco.nome || (aulaCorrente && aulaCorrente.titulo) || '';
    aoClicarVideo(a, aulaCorrente.video.id, bloco.t, (nome ? nome + ' · ' : '') + relogio(bloco.t));
    return a;
  }

  function tituloBloco(bloco) {
    var frag = document.createDocumentFragment();
    if (bloco.titulo) {
      var h = criar('h2', 'titulo-bloco', bloco.titulo);
      var lv = linkVideo(bloco);
      if (lv) h.appendChild(lv);
      frag.appendChild(h);
    }
    if (bloco.texto) frag.appendChild(criar('p', 'texto-bloco', bloco.texto));
    return frag;
  }

  /* ---------- renderizadores por tipo de bloco ---------- */

  var render = {};

  render.conceito = function (bloco) {
    var sec = criar('section', 'bloco bloco-conceito');
    sec.appendChild(tituloBloco(bloco));
    var dl = criar('div', 'conceitos');
    bloco.itens.forEach(function (it) {
      var linha = criar('div', 'conceito-linha');
      var termo = criar('div', 'conceito-termo', it.termo);
      var lvc = linkVideo(it);
      if (lvc) termo.appendChild(lvc);
      linha.appendChild(termo);
      linha.appendChild(criar('div', 'conceito-texto', it.texto));
      dl.appendChild(linha);
    });
    sec.appendChild(dl);
    return sec;
  };

  render.texto = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));
    (bloco.corpo || []).forEach(function (p) { sec.appendChild(criar('p', 'texto-bloco', p)); });
    return sec;
  };

  render.dica = function (bloco) {
    var sec = criar('section', 'bloco bloco-dica');
    if (bloco.titulo) sec.appendChild(criar('h3', 'titulo-dica', bloco.titulo));
    (bloco.corpo || []).forEach(function (p) { sec.appendChild(criar('p', '', p)); });
    return sec;
  };

  render.objetivo = function (bloco) {
    var sec = criar('section', 'bloco bloco-objetivo');
    if (bloco.titulo) sec.appendChild(criar('h2', 'titulo-objetivo', bloco.titulo));
    var ul = criar('ul', 'lista-objetivo');
    (bloco.itens || []).forEach(function (i) { ul.appendChild(criar('li', '', i)); });
    sec.appendChild(ul);
    return sec;
  };

  render.lista = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));
    var ul = criar('ul', 'lista-simples');
    (bloco.itens || []).forEach(function (i) { ul.appendChild(criar('li', '', i)); });
    sec.appendChild(ul);
    return sec;
  };

  render.acordes = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));
    var grade = criar('div', 'grade-acordes');
    bloco.itens.forEach(function (it) {
      var card = criar('article', 'card-acorde');
      var topo = criar('header', 'card-topo');
      topo.appendChild(cifraChip(it, 'grande'));
      if (it.nota) topo.appendChild(criar('span', 'card-nota', it.nota));
      card.appendChild(topo);
      card.appendChild(tecladoDe(it));
      grade.appendChild(card);
    });
    sec.appendChild(grade);
    if (bloco.legenda) sec.appendChild(criar('p', 'legenda', bloco.legenda));
    return sec;
  };

  function painelSequencia(acordes, rotulo) {
    var caixa = criar('div', 'sequencia');
    var linha = criar('div', 'sequencia-chips');
    var itens = acordes.map(function (a) { return typeof a === 'string' ? { cifra: a } : a; });
    var visor = criar('div', 'sequencia-visor');
    var chips = [];

    function mostrar(i) {
      chips.forEach(function (c, k) { c.classList.toggle('atual', k === i); });
      visor.innerHTML = '';
      visor.appendChild(tecladoDe(itens[i], {}));
    }

    itens.forEach(function (it, i) {
      var b = criar('button', 'chip');
      b.type = 'button';
      b.innerHTML = '<span class="chip-cifra">' + tt(it.cifra) + '</span>';
      b.addEventListener('click', function () { mostrar(i); tocarItem(it); });
      espiar(b, it);
      chips.push(b);
      linha.appendChild(b);
      if (i < itens.length - 1) linha.appendChild(criar('span', 'seta-seq', '→'));
    });

    var acoes = criar('div', 'sequencia-acoes');
    acoes.appendChild(botaoTocar(rotulo || 'Tocar sequência', function () {
      var listas = itens.map(function (it) {
        var v = vozesDe(it);
        return v.esquerda.concat(v.direita);
      });
      M.tocarSequencia(listas, { bpm: 52, aoTocar: mostrar });
    }));
    caixa.appendChild(linha);
    caixa.appendChild(acoes);
    caixa.appendChild(visor);
    mostrar(0);
    return caixa;
  }

  render.progressao = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));
    if (bloco.grupos) {
      var grade = criar('div', 'grade-grupos');
      bloco.grupos.forEach(function (g) {
        var cx = criar('div', 'grupo-curto');
        g.forEach(function (c, i) {
          cx.appendChild(cifraChip(c));
          if (i < g.length - 1) cx.appendChild(criar('span', 'seta-seq', '–'));
        });
        var btn = criar('button', 'mini-play', '▶');
        btn.type = 'button';
        btn.addEventListener('click', function () {
          M.tocarSequencia(g.map(function (c) {
            var v = vozesDe({ cifra: c });
            return v.esquerda.concat(v.direita);
          }), { bpm: 58 });
        });
        cx.appendChild(btn);
        grade.appendChild(cx);
      });
      sec.appendChild(grade);
    } else {
      sec.appendChild(painelSequencia(bloco.acordes));
    }
    return sec;
  };

  render.conexoes = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));
    bloco.itens.forEach(function (it) {
      var card = criar('article', 'card-conexao');
      var nome = criar('h3', 'conexao-nome', it.nome);
      var lvx = linkVideo(it);
      if (lvx) nome.appendChild(lvx);
      card.appendChild(nome);
      if (it.descricao) card.appendChild(criar('p', 'conexao-desc', it.descricao));
      [['Forte', it.forte], ['Suave', it.suave]].forEach(function (par) {
        if (!par[1]) return;
        var linha = criar('div', 'conexao-linha');
        linha.appendChild(criar('span', 'conexao-rotulo', par[0]));
        var seq = criar('div', 'conexao-chips');
        par[1].forEach(function (c, i) {
          seq.appendChild(cifraChip(c));
          if (i < par[1].length - 1) seq.appendChild(criar('span', 'seta-seq', '→'));
        });
        linha.appendChild(seq);
        var btn = criar('button', 'mini-play', '▶');
        btn.type = 'button';
        btn.addEventListener('click', function () {
          M.tocarSequencia(par[1].map(function (c) {
            var v = vozesDe({ cifra: c });
            return v.esquerda.concat(v.direita);
          }), { bpm: 56 });
        });
        linha.appendChild(btn);
        card.appendChild(linha);
      });
      sec.appendChild(card);
    });

    if (bloco.variacoes) {
      if (bloco.variacoesTitulo) sec.appendChild(criar('h3', 'sub-titulo', bloco.variacoesTitulo));
      var grade = criar('div', 'grade-grupos');
      bloco.variacoes.forEach(function (g) {
        var cx = criar('div', 'grupo-curto');
        g.forEach(function (c, i) {
          cx.appendChild(cifraChip(c));
          if (i < g.length - 1) cx.appendChild(criar('span', 'seta-seq', '–'));
        });
        var btn = criar('button', 'mini-play', '▶');
        btn.type = 'button';
        btn.addEventListener('click', function () {
          M.tocarSequencia(g.map(function (c) {
            var v = vozesDe({ cifra: c });
            return v.esquerda.concat(v.direita);
          }), { bpm: 58 });
        });
        cx.appendChild(btn);
        grade.appendChild(cx);
      });
      sec.appendChild(grade);
    }
    return sec;
  };

  render.tabela = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));

    var visor = criar('div', 'tabela-visor');
    var atual = { cifra: bloco.linhas[0].cifras[0] };

    var rolagem = criar('div', 'rolagem');
    var tab = criar('table', 'tabela-baixos');
    var thead = criar('thead');
    var trh = criar('tr');
    trh.appendChild(criar('th', 'canto', 'Baixo'));
    bloco.colunas.forEach(function (c) {
      trh.appendChild(criar('th', '', M.nomeDePc(M.pcDeNome(c) + semitons(), tomAtual().bemol)));
    });
    thead.appendChild(trh);
    tab.appendChild(thead);

    var tbody = criar('tbody');
    bloco.linhas.forEach(function (lin) {
      var tr = criar('tr');
      tr.appendChild(criar('th', 'rotulo-linha', lin.rotulo));
      lin.cifras.forEach(function (c) {
        var td = criar('td');
        var b = criar('button', 'chip chip-tabela');
        b.type = 'button';
        b.innerHTML = tt(c);
        b.addEventListener('click', function () {
          atual = { cifra: c };
          desenharVisor();
          tocarItem(atual);
          Array.prototype.forEach.call(tab.querySelectorAll('.chip-tabela'), function (o) { o.classList.remove('atual'); });
          b.classList.add('atual');
        });
        espiar(b, { cifra: c });
        td.appendChild(b);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    tab.appendChild(tbody);
    rolagem.appendChild(tab);
    sec.appendChild(rolagem);

    function desenharVisor() {
      visor.innerHTML = '';
      var cab = criar('div', 'visor-cabecalho');
      cab.appendChild(criar('span', 'visor-cifra', tt(atual.cifra)));
      cab.appendChild(botaoTocar('Tocar', function () { tocarItem(atual); }));
      visor.appendChild(cab);
      visor.appendChild(tecladoDe(atual));
    }
    desenharVisor();
    sec.appendChild(visor);
    return sec;
  };

  render.comparacao = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));
    var grade = criar('div', 'grade-comparacao' + (bloco.colunas === 3 ? ' tres' : ''));
    bloco.itens.forEach(function (it) {
      var card = criar('article', 'card-comparacao');
      card.appendChild(criar('h3', 'comparacao-rotulo', it.rotulo));
      card.appendChild(tecladoDe({ notas: it.notas }));
      if (it.legenda) card.appendChild(criar('p', 'comparacao-legenda', it.legenda));
      card.appendChild(botaoTocar('Tocar', function () { tocarItem({ notas: it.notas }); }));
      grade.appendChild(card);
    });
    sec.appendChild(grade);
    return sec;
  };

  render.poliacordes = function (bloco) {
    var sec = criar('section', 'bloco');
    sec.appendChild(tituloBloco(bloco));

    if (bloco.regras) {
      var caixaRegras = criar('div', 'regras');
      bloco.regras.forEach(function (r) {
        var card = criar('div', 'regra');
        card.appendChild(criar('span', 'regra-nome', r.nome));
        var corpo = criar('p', 'regra-corpo');
        corpo.innerHTML = '→ ' + interpolar(r.regra) + '<br><span class="regra-resultado">' + interpolar(r.resultado) + '</span>';
        card.appendChild(corpo);
        if (r.exemplo) card.appendChild(criar('span', 'regra-exemplo', r.exemplo));
        caixaRegras.appendChild(card);
      });
      sec.appendChild(caixaRegras);
    }
    if (bloco.legenda) sec.appendChild(criar('p', 'legenda legenda-topo', bloco.legenda));

    var lista = criar('div', 'lista-poli');
    bloco.itens.forEach(function (it) {
      var linha = criar('article', 'poli-linha');
      var esq = criar('div', 'poli-formula');
      esq.appendChild(criar('span', 'poli-grau', it.grau));
      var maoE = criar('span', 'poli-mao');
      maoE.appendChild(criar('span', 'poli-etiqueta', 'esquerda'));
      maoE.appendChild(cifraChip({ cifra: it.lh }, 'esq'));
      esq.appendChild(maoE);
      esq.appendChild(criar('span', 'poli-op', '+'));
      var maoD = criar('span', 'poli-mao');
      maoD.appendChild(criar('span', 'poli-etiqueta', 'direita'));
      maoD.appendChild(cifraChip({ cifra: it.rh }, 'dir'));
      esq.appendChild(maoD);
      esq.appendChild(criar('span', 'poli-op', '='));
      esq.appendChild(cifraChip({ lh: it.lh, rh: it.rh, cifra: it.resultado }, 'resultado'));
      linha.appendChild(esq);
      linha.appendChild(tecladoDe({ lh: it.lh, rh: it.rh }, {}));
      lista.appendChild(linha);
    });
    sec.appendChild(lista);
    return sec;
  };

  function linhaCifras(acordes, bpm) {
    var caixa = criar('div', 'linha-cifras');
    var chips = [];
    acordes.forEach(function (c, i) {
      var b = cifraChip(c);
      chips.push(b);
      caixa.appendChild(b);
      if (i < acordes.length - 1) caixa.appendChild(criar('span', 'seta-seq', '→'));
    });
    var btn = criar('button', 'mini-play', '▶');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Tocar a sequência');
    btn.addEventListener('click', function () {
      M.tocarSequencia(acordes.map(function (c) {
        var v = vozesDe({ cifra: c });
        return v.esquerda.concat(v.direita);
      }), {
        bpm: bpm || 54,
        aoTocar: function (i) {
          chips.forEach(function (ch, k) { ch.classList.toggle('atual', k === i); });
        },
        aoTerminar: function () {
          chips.forEach(function (ch) { ch.classList.remove('atual'); });
        }
      });
    });
    caixa.appendChild(btn);
    return caixa;
  }

  render.exercicios = function (bloco) {
    var sec = criar('section', 'bloco bloco-exercicios');
    sec.appendChild(tituloBloco(bloco));
    var lista = criar('div', 'lista-exercicios');
    bloco.itens.forEach(function (it) {
      var card = criar('article', 'card-exercicio');

      var topo = criar('header', 'exercicio-topo');
      topo.appendChild(criar('span', 'exercicio-n', String(it.n).padStart(2, '0')));
      var tit = criar('div', 'exercicio-tit');
      tit.appendChild(criar('h3', 'exercicio-tema', it.tema));
      tit.appendChild(criar('span', 'exercicio-tempo', it.tempo));
      topo.appendChild(tit);
      card.appendChild(topo);

      var ol = criar('ol', 'exercicio-passos');
      (it.passos || []).forEach(function (p) { ol.appendChild(criar('li', '', p)); });
      card.appendChild(ol);

      if (it.acordes) card.appendChild(linhaCifras(it.acordes, it.bpm));

      if (it.criterio) {
        var cr = criar('p', 'exercicio-criterio');
        cr.innerHTML = '<span class="criterio-rotulo">passou quando</span> ' + it.criterio;
        card.appendChild(cr);
      }
      lista.appendChild(card);
    });
    sec.appendChild(lista);
    return sec;
  };

  render.repertorio = function (bloco) {
    var sec = criar('section', 'bloco bloco-repertorio');
    sec.appendChild(tituloBloco(bloco));

    (bloco.grupos || []).forEach(function (g) {
      var grupo = criar('div', 'repertorio-grupo');
      grupo.appendChild(criar('h3', 'repertorio-estilo', g.estilo));
      if (g.nota) grupo.appendChild(criar('p', 'repertorio-nota', g.nota));

      var grade = criar('div', 'grade-padroes');
      (g.itens || []).forEach(function (it) {
        var card = criar('article', 'card-padrao');
        card.appendChild(criar('h4', 'padrao-nome', it.nome));
        if (it.graus) card.appendChild(criar('p', 'padrao-graus', it.graus));
        if (it.acordes) card.appendChild(linhaCifras(it.acordes, it.bpm));
        if (it.contexto) card.appendChild(criar('p', 'padrao-contexto', it.contexto));
        if (it.aplicar) {
          var ap = criar('p', 'padrao-aplicar');
          ap.innerHTML = '<span class="aplicar-rotulo">o que usar da aula</span> ' + it.aplicar;
          card.appendChild(ap);
        }
        grade.appendChild(card);
      });
      grupo.appendChild(grade);
      sec.appendChild(grupo);
    });

    if (bloco.rodape) sec.appendChild(criar('p', 'legenda', bloco.rodape));
    return sec;
  };

  /* ---------- páginas ---------- */

  function renderAula(aula) {
    var main = $('#conteudo');
    main.innerHTML = '';
    M.pararSequencia();
    fecharEspia();
    fecharVideo();

    aulaCorrente = aula;
    var cab = criar('header', 'cabecalho-aula');
    cab.appendChild(criar('p', 'aula-kicker', 'Aula ' + String(aula.numero).padStart(2, '0') + ' / 12' + (aula.data ? ' · ' + aula.data : '')));
    cab.appendChild(criar('h1', 'aula-titulo', aula.titulo));
    if (aula.subtitulo) cab.appendChild(criar('p', 'aula-subtitulo', aula.subtitulo));
    if (aula.resumo) cab.appendChild(criar('p', 'aula-resumo', aula.resumo));
    if (aula.video) {
      var av = criar('a', 'assistir-aula', '<span class="ico">▶</span>Assistir a aula completa');
      av.href = 'https://www.youtube.com/watch?v=' + aula.video.id;
      av.rel = 'noopener';
      aoClicarVideo(av, aula.video.id, 0, aula.titulo);
      cab.appendChild(av);
    }
    main.appendChild(cab);

    if (aula.pendente || !aula.blocos) {
      var vazio = criar('div', 'vazio');
      vazio.appendChild(criar('p', '', '<b>Ainda não tem anotação aqui.</b>'));
      vazio.appendChild(criar('p', '', 'Quando você fizer essa aula, é só mandar a foto do caderno que eu transformo nesta página — com teclado, som e transposição, igual à Aula 01.'));
      main.appendChild(vazio);
      return;
    }

    var indice = criar('nav', 'indice');
    var temIndice = false;

    aula.blocos.forEach(function (bloco, i) {
      var fn = render[bloco.tipo];
      if (!fn) return;
      var sec = fn(bloco);
      if (bloco.titulo && bloco.tipo !== 'objetivo') {
        sec.id = 'b' + i;
        var a = criar('a', 'indice-item', bloco.curto || bloco.titulo);
        a.href = '#' + aula.id;
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        indice.appendChild(a);
        temIndice = true;
      }
      main.appendChild(sec);
    });
    if (temIndice) main.insertBefore(indice, main.children[1] || null);

    main.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'auto' : 'auto' });
  }

  function renderMenu() {
    var nav = $('#lista-aulas');
    nav.innerHTML = '';
    AULAS.forEach(function (aula) {
      var b = criar('button', 'item-aula' + (aula.pendente ? ' pendente' : '') + (estado.aula === aula.id ? ' atual' : ''));
      b.type = 'button';
      b.innerHTML =
        '<span class="item-num">' + String(aula.numero).padStart(2, '0') + '</span>' +
        '<span class="item-txt"><span class="item-titulo">' + aula.titulo + '</span>' +
        (aula.subtitulo ? '<span class="item-sub">' + aula.subtitulo + '</span>' : '') + '</span>';
      b.addEventListener('click', function () {
        irPara(aula.id);
        document.body.classList.remove('menu-aberto');
      });
      nav.appendChild(b);
    });
  }

  function irPara(id) {
    var aula = AULAS.filter(function (a) { return a.id === id; })[0] || AULAS[0];
    estado.aula = aula.id;
    salvar();
    renderMenu();
    renderAula(aula);
    if (location.hash !== '#' + aula.id) history.replaceState(null, '', '#' + aula.id);
  }

  function redesenhar() {
    var aula = AULAS.filter(function (a) { return a.id === estado.aula; })[0] || AULAS[0];
    renderAula(aula);
  }

  /* ---------- seletor de tom ---------- */

  function renderTons() {
    var caixa = $('#seletor-tom');
    caixa.innerHTML = '';
    M.TONS.forEach(function (t) {
      var b = criar('button', 'tom' + (t.nome === estado.tom ? ' atual' : ''), t.nome);
      b.type = 'button';
      b.addEventListener('click', function () {
        estado.tom = t.nome;
        salvar();
        renderTons();
        redesenhar();
        M.ativarAudio();
      });
      caixa.appendChild(b);
    });
  }

  /* ---------- persistência ---------- */

  function salvar() {
    try {
      localStorage.setItem('hp-estado', JSON.stringify({ tom: estado.tom, aula: estado.aula }));
    } catch (e) { /* modo privado: segue sem salvar */ }
  }

  function carregar() {
    try {
      var s = JSON.parse(localStorage.getItem('hp-estado') || '{}');
      if (s.tom) estado.tom = s.tom;
      if (s.aula) estado.aula = s.aula;
    } catch (e) { /* ignora */ }
  }

  /* ---------- início ---------- */

  function iniciar() {
    carregar();
    var hash = (location.hash || '').replace('#', '');
    if (hash) estado.aula = hash;
    if (!estado.aula) estado.aula = AULAS[0].id;

    renderTons();
    renderMenu();
    irPara(estado.aula);

    $('#abrir-menu').addEventListener('click', function () {
      document.body.classList.toggle('menu-aberto');
    });
    $('#fundo-menu').addEventListener('click', function () {
      document.body.classList.remove('menu-aberto');
    });

    document.addEventListener('click', function (ev) {
      if (!espia.fixado) return;
      if (ev.target.closest && (ev.target.closest('.chip') || ev.target.closest('.espia'))) return;
      fecharEspia();
    });
    window.addEventListener('scroll', fecharEspia, { passive: true });
    window.addEventListener('resize', fecharEspia);
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if (videoAberto()) fecharVideo();
      else fecharEspia();
    });

    // o navegador só libera áudio depois de um gesto do usuário
    document.addEventListener('pointerdown', function liberar() {
      M.ativarAudio();
      document.removeEventListener('pointerdown', liberar);
    }, { once: true });

    window.addEventListener('hashchange', function () {
      var h = (location.hash || '').replace('#', '');
      if (h && h !== estado.aula) irPara(h);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

})(typeof window !== 'undefined' ? window : globalThis);
