/* ===========================================================
   Harmonia Prime — teclado em SVG
   Desenha um teclado com as teclas acesas (esquerda / direita),
   rótulos de dobramento e clique para tocar nota a nota.
   =========================================================== */
(function (global) {
  'use strict';

  var M = global.Musica;
  var PRETAS = { 1: 1, 3: 1, 6: 1, 8: 1, 10: 1 };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function ehPreta(midi) { return !!PRETAS[((midi % 12) + 12) % 12]; }

  function el(nome, attrs) {
    var e = document.createElementNS(SVGNS, nome);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    return e;
  }

  /**
   * Janela do teclado: parte de uma faixa padrão (para todos os teclados do
   * site ficarem do mesmo tamanho) e só cresce se alguma nota ficar de fora.
   */
  function janela(notas, preferido) {
    var inicio = preferido ? preferido.inicio : 48;
    var fim = preferido ? preferido.fim : 83;
    if (notas.length) {
      var min = Math.min.apply(null, notas);
      var max = Math.max.apply(null, notas);
      if (min < inicio) inicio = Math.floor(min / 12) * 12;
      if (max > fim) fim = max;
    }
    return { inicio: inicio, fim: fim };
  }

  /**
   * desenha(container, dados)
   * dados = {
   *   esquerda: [midi], direita: [midi],
   *   marcadores: [{de: midi, para: midi, texto: 'quinta dobrada'}],
   *   rotulos: bool  // escreve o nome da nota nas teclas acesas
   * }
   */
  function desenhar(container, dados) {
    var esq = dados.esquerda || [];
    var dir = dados.direita || [];
    var todas = esq.concat(dir);
    var j = janela(todas, dados.preferido);

    var LB = 26, AB = 132;         // largura/altura tecla branca
    var LP = 15, AP = 84;          // largura/altura tecla preta
    var margem = 6;
    var temMarcadores = dados.marcadores && dados.marcadores.length;
    var alturaMarc = temMarcadores ? 30 : 0;

    var brancas = [];
    for (var m = j.inicio; m <= j.fim; m++) if (!ehPreta(m)) brancas.push(m);

    var largura = brancas.length * LB + margem * 2;
    var altura = AB + margem * 2 + alturaMarc;

    var svg = el('svg', {
      viewBox: '0 0 ' + largura + ' ' + altura,
      class: 'teclado',
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img'
    });

    var posX = {};
    var idx = 0;
    var i;

    // brancas
    for (i = j.inicio; i <= j.fim; i++) {
      if (ehPreta(i)) continue;
      var x = margem + idx * LB;
      posX[i] = { x: x, w: LB, preta: false, centro: x + LB / 2 };
      var aceso = dir.indexOf(i) !== -1 ? 'dir' : (esq.indexOf(i) !== -1 ? 'esq' : '');
      var r = el('rect', {
        x: x, y: margem, width: LB - 1.5, height: AB, rx: 3,
        class: 'tecla branca' + (aceso ? ' acesa-' + aceso : ''),
        'data-midi': i
      });
      svg.appendChild(r);
      idx++;
    }

    // pretas
    idx = 0;
    for (i = j.inicio; i <= j.fim; i++) {
      if (ehPreta(i)) {
        var xb = margem + idx * LB - LP / 2;
        posX[i] = { x: xb, w: LP, preta: true, centro: xb + LP / 2 };
        var acesoP = dir.indexOf(i) !== -1 ? 'dir' : (esq.indexOf(i) !== -1 ? 'esq' : '');
        var rp = el('rect', {
          x: xb, y: margem, width: LP, height: AP, rx: 2.5,
          class: 'tecla preta' + (acesoP ? ' acesa-' + acesoP : ''),
          'data-midi': i
        });
        svg.appendChild(rp);
      } else {
        idx++;
      }
    }

    // rótulos de nota nas teclas acesas
    if (dados.rotulos !== false) {
      todas.forEach(function (n) {
        var p = posX[n];
        if (!p) return;
        var nome = M.midiParaNota(n, dados.bemol).replace(/\d+$/, '');
        var t = el('text', {
          x: p.centro,
          y: margem + (p.preta ? AP - 10 : AB - 12),
          class: 'rotulo-nota' + (p.preta ? ' em-preta' : ''),
          'text-anchor': 'middle'
        });
        t.textContent = nome;
        svg.appendChild(t);
      });
    }

    // marcadores (setas de dobramento)
    if (temMarcadores) {
      dados.marcadores.forEach(function (mk) {
        var a = posX[mk.de], b = posX[mk.para];
        if (!a || !b) return;
        var y = margem + AB + 12;
        var g = el('g', { class: 'marcador' });
        g.appendChild(el('path', { d: 'M' + a.centro + ' ' + y + ' L' + a.centro + ' ' + (y - 7), class: 'seta' }));
        g.appendChild(el('path', { d: 'M' + b.centro + ' ' + y + ' L' + b.centro + ' ' + (y - 7), class: 'seta' }));
        g.appendChild(el('line', { x1: a.centro, y1: y, x2: b.centro, y2: y, class: 'seta' }));
        var t2 = el('text', {
          x: (a.centro + b.centro) / 2, y: y + 14,
          class: 'rotulo-marcador', 'text-anchor': 'middle'
        });
        t2.textContent = mk.texto || '';
        g.appendChild(t2);
        svg.appendChild(g);
      });
    }

    svg.addEventListener('click', function (ev) {
      var alvo = ev.target;
      if (!alvo || !alvo.getAttribute) return;
      var midi = alvo.getAttribute('data-midi');
      if (!midi) return;
      M.tocarNota(parseInt(midi, 10), undefined, 1.4, 0.24);
      alvo.classList.add('tocando');
      setTimeout(function () { alvo.classList.remove('tocando'); }, 260);
    });

    container.innerHTML = '';
    container.appendChild(svg);
    return svg;
  }

  global.Teclado = { desenhar: desenhar, ehPreta: ehPreta };
})(typeof window !== 'undefined' ? window : globalThis);
