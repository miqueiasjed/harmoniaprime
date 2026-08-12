/* ===========================================================
   Harmonia Prime — aplicar o estudo numa música
   Descobre o tom da cifra, numera os graus e marca, acorde por
   acorde, onde cada conceito da aula cabe. Cada conceito é um
   detector: recebe a música lida e devolve as marcas.
   =========================================================== */
(function (global) {
  'use strict';

  var M = global.Musica;

  var ESCALA_MAIOR = [0, 2, 4, 5, 7, 9, 11];
  var ESCALA_MENOR = [0, 2, 3, 5, 7, 8, 10];
  var QUAL_MAIOR = ['', 'm', 'm', '', '', 'm', 'mb5'];
  var QUAL_MENOR = ['m', 'mb5', '', 'm', 'm', '', ''];
  var ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  function mod12(n) { return ((n % 12) + 12) % 12; }

  /* ---------- tom ---------- */

  function familia(qual) {
    if (/mb5|m\(b5\)|dim|°|ø/.test(qual)) return 'mb5';
    if (/^m/.test(qual) && !/^maj/.test(qual)) return 'm';
    return '';
  }

  /** Nota quantos acordes cabem em cada um dos 24 tons e fica com o melhor. */
  function descobrirTom(lidas) {
    if (!lidas.length) return { pc: 0, menor: false };
    var melhor = null;

    for (var pc = 0; pc < 12; pc++) {
      [false, true].forEach(function (menor) {
        var escala = menor ? ESCALA_MENOR : ESCALA_MAIOR;
        var quals = menor ? QUAL_MENOR : QUAL_MAIOR;
        var nota = 0;

        lidas.forEach(function (a) {
          var g = escala.indexOf(mod12(a.raiz - pc));
          if (g === -1) return;
          nota += 2;
          if (familia(a.qual) === quals[g]) nota += 1;
        });

        var primeira = lidas[0], ultima = lidas[lidas.length - 1];
        if (mod12(primeira.raiz - pc) === 0) nota += 3;
        if (mod12(ultima.raiz - pc) === 0) nota += 4;
        if (familia(ultima.qual) === quals[0] && mod12(ultima.raiz - pc) === 0) nota += 2;

        if (!melhor || nota > melhor.nota) melhor = { pc: pc, menor: menor, nota: nota };
      });
    }
    return melhor;
  }

  /** "Bm" ou "Eb" vindos do Cifra Club viram {pc, menor}. */
  function lerTom(texto) {
    if (!texto) return null;
    var m = String(texto).trim().match(/^([A-G][#b]?)\s*(m|min)?$/i);
    if (!m) return null;
    var pc = M.pcDeNome(m[1][0].toUpperCase() + m[1].slice(1));
    if (pc === null) return null;
    return { pc: pc, menor: !!m[2] };
  }

  function nomeDoTom(tom, bemol) {
    return M.nomeDePc(tom.pc, bemol) + (tom.menor ? 'm' : '');
  }

  // Db, Eb, F, Ab e Bb maiores levam bemol; o menor segue o relativo maior.
  var COM_BEMOL = { 1: 1, 3: 1, 5: 1, 8: 1, 10: 1 };

  /** O tom se escreve com bemol ou com sustenido? */
  function usaBemol(tom) {
    return !!COM_BEMOL[tom.menor ? mod12(tom.pc + 3) : tom.pc];
  }

  /* ---------- leitura da música ---------- */

  /**
   * Monta o contexto de análise já no tom de exibição.
   * mapa: saída de Cifras.analisar*  ·  semitons: transposição
   */
  function analisar(mapa, semitons, bemol, tomManual) {
    semitons = semitons || 0;

    var itens = mapa.cifras.map(function (c, i) {
      var cifra = semitons ? M.transporCifra(c.cifra, semitons, bemol) : c.cifra;
      return {
        i: i, cifra: cifra, lida: M.lerCifra(cifra),
        secao: c.secao, col: c.col, linha: c.linha,
        posLinha: c.posLinha, ultimoDaLinha: c.ultimoDaLinha
      };
    }).filter(function (it) { return it.lida; });

    var tom = tomManual
      ? { pc: mod12(tomManual.pc + semitons), menor: tomManual.menor }
      : descobrirTom(itens.map(function (it) { return it.lida; }));

    var escala = tom.menor ? ESCALA_MENOR : ESCALA_MAIOR;

    // marca posição dentro da seção e o grau de cada acorde
    var porSecao = {};
    itens.forEach(function (it) {
      (porSecao[it.secao] = porSecao[it.secao] || []).push(it);
    });

    itens.forEach(function (it, k) {
      var interv = mod12(it.lida.raiz - tom.pc);
      it.idx = escala.indexOf(interv);
      it.grau = grauDe(interv, it.lida.qual, escala);
      it.diatonico = it.idx !== -1;
      it.anterior = itens[k - 1] || null;
      it.proximo = itens[k + 1] || null;
      it.baixoPc = it.lida.baixo !== null && it.lida.baixo !== undefined ? it.lida.baixo : it.lida.raiz;
      it.pcs = it.lida.intervalos.map(function (n) { return mod12(it.lida.raiz + n); });

      var grupo = porSecao[it.secao];
      it.posSecao = grupo.indexOf(it);
      it.primeiroDaSecao = it.posSecao === 0;
      it.ultimoDaSecao = it.posSecao === grupo.length - 1;
      it.repetido = it.proximo && it.proximo.cifra === it.cifra && it.proximo.secao === it.secao;
    });

    return {
      tom: tom, bemol: bemol, escala: escala, itens: itens,
      mapa: mapa, porSecao: porSecao,
      nomeTom: nomeDoTom(tom, bemol)
    };
  }

  function grauDe(interv, qual, escala) {
    var i = escala.indexOf(interv);
    var f = familia(qual);
    if (i === -1) {
      var abaixo = escala.indexOf(mod12(interv - 1));
      var base = abaixo !== -1 ? 'b' + ROMANOS[abaixo === 6 ? 0 : abaixo + 1] : '?';
      return f === '' ? base : base.toLowerCase();
    }
    var r = ROMANOS[i];
    return f === '' ? r : r.toLowerCase() + (f === 'mb5' ? '°' : '');
  }

  /* ---------- utilidades de acorde ---------- */

  /** Tríade pura: três notas, sem sétima nem tensão. */
  function triadePura(it) {
    return it.lida.intervalos.length === 3 && !it.lida.tensoes.length;
  }

  function grauNota(ctx, idx) {
    return mod12(ctx.tom.pc + ctx.escala[((idx % 7) + 7) % 7]);
  }

  function nome(ctx, pc) { return M.nomeDePc(pc, ctx.bemol); }

  var LETRAS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var PC_LETRA = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  /**
   * Grafa a nota pela letra certa do intervalo, e não pela tabela do tom.
   * Uma terça abaixo de ré é si bemol, nunca lá sustenido.
   */
  function grafarAbaixo(ctx, baixoNome, letrasAbaixo, semitonsAbaixo) {
    var pc = mod12(M.pcDeNome(baixoNome) - semitonsAbaixo);
    var i = LETRAS.indexOf(String(baixoNome)[0].toUpperCase());
    if (i === -1) return nome(ctx, pc);
    var letra = LETRAS[((i - letrasAbaixo) % 7 + 7) % 7];
    var d = mod12(pc - PC_LETRA[letra]);
    if (d > 6) d -= 12;
    var grafia = d === 0 ? letra : d === 1 ? letra + '#' : d === -1 ? letra + 'b' : null;
    // Cb, Fb, B# e E# são corretos no papel e ilegíveis numa cifra
    if (!grafia || /^(Cb|Fb|B#|E#)$/.test(grafia)) return nome(ctx, pc);
    return grafia;
  }

  /** Tríade diatônica do grau idx, grafada no tom. */
  function triadeDoGrau(ctx, idx) {
    idx = ((idx % 7) + 7) % 7;
    var quals = ctx.tom.menor ? QUAL_MENOR : QUAL_MAIOR;
    return nome(ctx, grauNota(ctx, idx)) + quals[idx];
  }

  /* ---------- conceitos ---------- */

  var CONCEITOS = [

    {
      id: 'pedal', nome: 'Baixo pedal', t: 2387,
      resumo: 'Segurar a tônica no baixo enquanto a direita troca de cor.',
      detectar: function (ctx) {
        var marcas = [];
        Object.keys(ctx.porSecao).forEach(function (s) {
          var grupo = ctx.porSecao[s];
          if (grupo.length < 2) return;
          var cabe = grupo.every(function (it) { return it.pcs.indexOf(ctx.tom.pc) !== -1; });
          if (!cabe) return;
          var subs = grupo.map(function (it) {
            return it.lida.raiz === ctx.tom.pc ? it.cifra : it.cifra.split('/')[0] + '/' + nome(ctx, ctx.tom.pc);
          });
          marcas.push({
            i: grupo[0].i,
            titulo: 'Segura o baixo aqui',
            texto: 'Todos os acordes desta parte têm a tônica dentro. Crave ' + nome(ctx, ctx.tom.pc) +
                   ' no baixo e deixe só a direita mudar.',
            sugestao: subs.slice(0, 4).join('  '),
            curta: '/' + nome(ctx, ctx.tom.pc),
            demo: {
              antes: grupo.slice(0, 4).map(function (it) { return { cifra: it.cifra }; }),
              depois: subs.slice(0, 4).map(function (c) { return { cifra: c }; })
            }
          });
        });
        return marcas;
      }
    },

    {
      id: 'sus2', nome: 'Sus2', t: 236,
      resumo: 'Tirar a terça dos acordes de passagem para não brigar com a melodia.',
      detectar: function (ctx) {
        function diatonico(pc) { return ctx.escala.indexOf(mod12(pc - ctx.tom.pc)) !== -1; }
        function sus2NoTom(raizPc) {
          return diatonico(raizPc) && diatonico(raizPc + 2) && diatonico(raizPc + 7);
        }
        return ctx.itens.filter(function (it) {
          if (!triadePura(it)) return false;
          if (it.idx === 0) return false;             // a tônica é destino, fica pura
          if (it.ultimoDaSecao || it.ultimoDaLinha) return false;   // fim de frase é chegada
          if (it.posLinha === 0) return false;        // início de frase também assenta
          if (!it.proximo || it.proximo.cifra === it.cifra) return false;
          return true;
        }).map(function (it) {
          var baixo = it.lida.baixoNome || it.lida.raizNome;
          var doRaiz = mod12(it.baixoPc - it.lida.raiz);   // intervalo do baixo até a fundamental
          var sug;
          if (sus2NoTom(mod12(it.baixoPc - 4))) {
            // a forma da aula: sus2 uma terça maior abaixo do baixo (C2/E, F2/A, G2/B)
            sug = grafarAbaixo(ctx, baixo, 2, 4) + '2/' + baixo;
          } else if (sus2NoTom(it.lida.raiz) && (doRaiz === 0 || doRaiz === 7)) {
            // senão, tira a terça do próprio acorde (D2, F2, G2); mas só se o baixo
            // não for a própria terça, que continuaria soando embaixo
            sug = it.lida.raizNome + '2' + (it.lida.baixoNome ? '/' + it.lida.baixoNome : '');
          } else {
            return null;                              // sairia do tom ou brigaria: dica nenhuma
          }
          return {
            i: it.i,
            titulo: 'Cabe sus2',
            texto: 'Acorde de passagem: sem a terça ele para de brigar com a melodia e não fecha a frase.',
            sugestao: sug,
            curta: sug.split('/')[0],
            demo: {
              antes: [{ cifra: it.cifra }, { cifra: it.proximo.cifra }],
              depois: [{ cifra: sug }, { cifra: it.proximo.cifra }]
            }
          };
        }).filter(Boolean);
      }
    },

    {
      id: 'sus4', nome: 'Sus4', t: 963,
      resumo: 'Pendurar o acorde antes de resolver, nos pontos em que a música para.',
      detectar: function (ctx) {
        return ctx.itens.filter(function (it) {
          if (!triadePura(it) || it.idx === 0) return false;
          // a quarta precisa ser do tom: F4 em dó maior traria um si bemol
          if (ctx.escala.indexOf(mod12(it.lida.raiz + 5 - ctx.tom.pc)) === -1) return false;
          // o ponto onde a música para: antes de voltar à tônica ou no fim da parte
          return (it.proximo && it.proximo.idx === 0 && it.proximo.secao === it.secao) || it.ultimoDaSecao;
        }).map(function (it) {
          var r = it.lida.raizNome;
          var chegada = it.proximo && it.proximo.idx === 0 && it.proximo.secao === it.secao
            ? it.proximo.cifra : null;
          return {
            i: it.i,
            titulo: 'Segura no sus4',
            texto: 'Aqui a música para. Fique no sus4 um ou dois compassos e só então resolva.',
            sugestao: r + '4 → ' + it.cifra + '   (' + [r, nome(ctx, mod12(it.lida.raiz + 5)),
              nome(ctx, mod12(it.lida.raiz + 7)), r].join(' – ') + ')',
            curta: r + '4',
            demo: {
              antes: chegada ? [{ cifra: it.cifra }, { cifra: chegada }] : [{ cifra: it.cifra }],
              depois: chegada
                ? [{ cifra: r + '4' }, { cifra: it.cifra }, { cifra: chegada }]
                : [{ cifra: r + '4' }, { cifra: it.cifra }]
            }
          };
        });
      }
    },

    {
      id: 'dobramento', nome: 'Dobramento', t: 661, porAcorde: true,
      resumo: 'Repetir a quinta ou a tônica uma oitava acima. Nunca a terça.',
      detectar: function (ctx) {
        return ctx.itens.filter(triadePura).map(function (it) {
          var quinta = mod12(it.lida.raiz + 7);
          var dobra = it.baixoPc === quinta ? 'a tônica' : 'a quinta';
          var pc = it.baixoPc === quinta ? it.lida.raiz : quinta;
          return {
            i: it.i,
            titulo: 'Dobre ' + dobra,
            texto: 'Acorde parado: engorda sem mudar a cor. A terça fica de fora, dobrada ela pesa.',
            sugestao: nome(ctx, pc) + ' repetido uma oitava acima',
            curta: '↑' + nome(ctx, pc),
            demo: {
              antes: [{ cifra: it.cifra }],
              depois: [{ cifra: it.cifra, dobrar: it.baixoPc === quinta ? '1' : '5' }]
            }
          };
        });
      }
    },

    {
      id: 'inversao', nome: 'Inversão de passagem', t: 1398,
      resumo: 'Fazer o baixo andar por grau conjunto entre dois acordes.',
      detectar: function (ctx) {
        return vaos(ctx).map(function (v) {
          var baixo = grauNota(ctx, v.idxBaixo);
          var forte = triadeDoGrau(ctx, v.idxBaixo - 2) + '/' + nome(ctx, baixo);
          return {
            i: v.de.i, entre: true,
            titulo: 'O baixo pode caminhar',
            texto: 'De ' + v.de.cifra + ' para ' + v.para.cifra + ' o baixo pula. Passando por ' +
                   nome(ctx, baixo) + ' ele anda de grau em grau.',
            sugestao: 'forte ' + forte +
                      '   ·   suave ' + triadeDoGrau(ctx, v.idxBaixo - 4) + '/' + nome(ctx, baixo),
            curta: '→' + forte,
            demo: {
              antes: [{ cifra: v.de.cifra }, { cifra: v.para.cifra }],
              depois: [{ cifra: v.de.cifra }, { cifra: forte }, { cifra: v.para.cifra }]
            }
          };
        });
      }
    },

    {
      id: 'conexoes', nome: 'As 3 conexões', t: 1156,
      resumo: 'Acordes intermediários para sair de um e chegar no outro.',
      detectar: function (ctx) {
        return vaos(ctx).map(function (v) {
          var impulso = triadeDoGrau(ctx, v.idxPara - 1);
          return {
            i: v.de.i, entre: true,
            titulo: 'Cabe conexão',
            texto: 'Vão entre ' + v.de.cifra + ' e ' + v.para.cifra + '. Impulso empurra, caminho preparado alonga.',
            sugestao: 'impulso ' + impulso +
                      '   ·   suave ' + triadeDoGrau(ctx, v.idxDe + 2) +
                      '   ·   preparado ' + triadeDoGrau(ctx, v.idxPara - 2) + ' ' + impulso,
            curta: '→' + impulso,
            demo: {
              antes: [{ cifra: v.de.cifra }, { cifra: v.para.cifra }],
              depois: [{ cifra: v.de.cifra }, { cifra: impulso }, { cifra: v.para.cifra }]
            }
          };
        });
      }
    },

    {
      id: 'mesmoBaixo', nome: 'Três tríades sobre o mesmo baixo', t: 484, porAcorde: true,
      resumo: 'Trocar o acorde mantendo o baixo. Reharmoniza sem mexer na melodia.',
      detectar: function (ctx) {
        return ctx.itens.filter(function (it) {
          return triadePura(it) && it.diatonico;
        }).map(function (it) {
          var b = it.baixoPc;
          var outras = [mod12(b - 4), mod12(b - 7)].map(function (raiz) {
            var idx = ctx.escala.indexOf(mod12(raiz - ctx.tom.pc));
            if (idx === -1) return null;
            return triadeDoGrau(ctx, idx) + '/' + nome(ctx, b);
          }).filter(Boolean);
          if (!outras.length) return null;
          return {
            i: it.i,
            titulo: 'Outra tríade no mesmo baixo',
            texto: 'A melodia continua encaixando: ' + nome(ctx, b) +
                   ' é fundamental de um acorde, terça de outro e quinta de um terceiro.',
            sugestao: outras.join('   ou   '),
            curta: outras[0],
            demo: {
              antes: [{ cifra: it.cifra }],
              depois: [{ cifra: outras[0] }]
            }
          };
        }).filter(Boolean);
      }
    },

    {
      id: 'triadeAberta', nome: 'Tríade aberta (1 – 5 – 10)', t: 2047, porAcorde: true,
      resumo: 'Subir a nota do meio uma oitava e deixar a direita livre.',
      detectar: function (ctx) {
        return ctx.itens.filter(triadePura).map(function (it) {
          var r = it.lida.raiz;
          var terca = it.lida.intervalos.indexOf(3) !== -1 ? 3 : 4;
          return {
            i: it.i,
            titulo: 'Abre a tríade',
            texto: 'Esquerda em 1 – 5 – 10 e a direita inteira livre para a melodia.',
            sugestao: [nome(ctx, r), nome(ctx, mod12(r + 7)), nome(ctx, mod12(r + terca))].join(' – ') +
                      '   (a terça uma oitava acima)',
            curta: '1·5·10',
            demo: {
              antes: [{ notas: [60 + r, 60 + r + terca, 60 + r + 7] }],
              depois: [{ notas: [60 + r, 60 + r + 7, 60 + r + terca + 12] }]
            }
          };
        });
      }
    },

    {
      id: 'poliacorde', nome: 'Poliacordes', t: 3244, porAcorde: true,
      resumo: 'Tríade na esquerda mais tríade na direita, pela regra da sétima.',
      detectar: function (ctx) {
        return ctx.itens.map(function (it) {
          // o V é dominante: mesmo maior, pede um tom abaixo, como o G4 + F da tabela da aula
          var tomAbaixo = familia(it.lida.qual) === 'm' || /sus4|^4/.test(it.lida.qual) || it.idx === 4;
          var direita = tomAbaixo ? mod12(it.lida.raiz - 2) : mod12(it.lida.raiz + 7);
          return {
            i: it.i,
            titulo: tomAbaixo ? 'Poliacorde: um tom abaixo' : 'Poliacorde: a quinta acima',
            texto: tomAbaixo
              ? 'Menor, sus4 ou dominante pede a tríade um tom abaixo, que entrega a sétima menor. Traz 7ª, 9ª e 11ª.'
              : 'Maior pede a tríade da quinta acima. Traz a 7ª maior e a 9ª.',
            sugestao: it.cifra.split('/')[0] + '  +  ' + nome(ctx, direita),
            curta: '+' + nome(ctx, direita),
            demo: {
              antes: [{ cifra: it.cifra.split('/')[0] }],
              depois: [{ lh: it.cifra.split('/')[0], rh: nome(ctx, direita) }]
            }
          };
        });
      }
    }
  ];

  /**
   * Vãos: pares de acordes seguidos cuja distância é de terça, onde
   * cabe um acorde no meio. É a matéria-prima das conexões.
   */
  function vaos(ctx) {
    var saida = [];
    ctx.itens.forEach(function (it) {
      var p = it.proximo;
      if (!p || p.secao !== it.secao) return;
      if (!it.diatonico || !p.diatonico) return;
      if (it.idx === p.idx) return;
      var passos = ((it.idx - p.idx) + 7) % 7;
      if (passos !== 2) return;                       // só terça descendente
      saida.push({ de: it, para: p, idxDe: it.idx, idxPara: p.idx, idxBaixo: it.idx - 1 });
    });
    return saida;
  }

  /** Roda os detectores dos conceitos pedidos. */
  function marcar(ctx, ids) {
    var saida = {};
    CONCEITOS.forEach(function (c) {
      if (ids && ids.indexOf(c.id) === -1) return;
      var marcas;
      try { marcas = c.detectar(ctx) || []; } catch (e) { marcas = []; }
      if (marcas.length) saida[c.id] = marcas;
    });
    return saida;
  }

  function conceito(id) {
    return CONCEITOS.filter(function (c) { return c.id === id; })[0] || null;
  }

  global.Aplicar = {
    CONCEITOS: CONCEITOS,
    analisar: analisar,
    marcar: marcar,
    conceito: conceito,
    descobrirTom: descobrirTom,
    lerTom: lerTom,
    nomeDoTom: nomeDoTom,
    usaBemol: usaBemol
  };

})(typeof window !== 'undefined' ? window : globalThis);
