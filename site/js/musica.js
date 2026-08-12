/* ===========================================================
   Harmonia Prime — motor musical
   Teoria (parser de acordes, transposição, vozes) + áudio
   Sem dependências. Funciona em file:// e em GitHub Pages.
   =========================================================== */
(function (global) {
  'use strict';

  var SUSTENIDOS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var BEMOIS     = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  var BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  // Tons disponíveis no seletor. "bemol" = como grafar as alterações nesse tom.
  var TONS = [
    { nome: 'C',  pc: 0,  bemol: false },
    { nome: 'Db', pc: 1,  bemol: true  },
    { nome: 'D',  pc: 2,  bemol: false },
    { nome: 'Eb', pc: 3,  bemol: true  },
    { nome: 'E',  pc: 4,  bemol: false },
    { nome: 'F',  pc: 5,  bemol: true  },
    { nome: 'F#', pc: 6,  bemol: false },
    { nome: 'G',  pc: 7,  bemol: false },
    { nome: 'Ab', pc: 8,  bemol: true  },
    { nome: 'A',  pc: 9,  bemol: false },
    { nome: 'Bb', pc: 10, bemol: true  },
    { nome: 'B',  pc: 11, bemol: false }
  ];

  function pcDeNome(nome) {
    if (!nome) return null;
    var letra = nome[0].toUpperCase();
    if (!(letra in BASE)) return null;
    var pc = BASE[letra];
    for (var i = 1; i < nome.length; i++) {
      if (nome[i] === '#') pc += 1;
      else if (nome[i] === 'b') pc -= 1;
      else break;
    }
    return ((pc % 12) + 12) % 12;
  }

  function nomeDePc(pc, bemol) {
    pc = ((pc % 12) + 12) % 12;
    return bemol ? BEMOIS[pc] : SUSTENIDOS[pc];
  }

  /* ---------- Qualidades e tensões ---------- */

  var QUALIDADES = {
    '':        [0, 4, 7],
    'M':       [0, 4, 7],
    'maj':     [0, 4, 7],
    'm':       [0, 3, 7],
    'min':     [0, 3, 7],
    '-':       [0, 3, 7],
    '5':       [0, 7],
    '2':       [0, 2, 7],
    'sus2':    [0, 2, 7],
    '4':       [0, 5, 7],
    'sus4':    [0, 5, 7],
    '6':       [0, 4, 7, 9],
    'm6':      [0, 3, 7, 9],
    '7':       [0, 4, 7, 10],
    'm7':      [0, 3, 7, 10],
    '7M':      [0, 4, 7, 11],
    '7+':      [0, 4, 7, 11],
    'maj7':    [0, 4, 7, 11],
    'm7M':     [0, 3, 7, 11],
    'mb5':     [0, 3, 6],
    'm(b5)':   [0, 3, 6],
    'dim':     [0, 3, 6],
    '°':       [0, 3, 6],
    'm7b5':    [0, 3, 6, 10],
    'm7(b5)':  [0, 3, 6, 10],
    'ø':       [0, 3, 6, 10],
    '°7':      [0, 3, 6, 9],
    'dim7':    [0, 3, 6, 9],
    'aug':     [0, 4, 8],
    '5+':      [0, 4, 8],
    '7(5+)':   [0, 4, 8, 10],
    '47':      [0, 5, 7, 10],
    '4(7)':    [0, 5, 7, 10],
    '7sus4':   [0, 5, 7, 10]
  };

  var TENSOES = {
    '2': 2, '4': 5, '6': 9,
    '7': 10, '7M': 11, '7+': 11,
    'b9': 13, '9': 14, '#9': 15, '9+': 15, '9-': 13,
    '11': 17, '#11': 18, '11+': 18,
    'b13': 20, '13': 21, '13-': 20
  };

  /**
   * Interpreta uma cifra: "C", "Am/C", "C2/E", "G4(7/9)", "Dm7(9/11)", "Bmb5"
   * Retorna { raiz, raizNome, qual, tensoes, baixo, baixoNome, intervalos, cifra }
   */
  function lerCifra(cifra) {
    if (!cifra || typeof cifra !== 'string') return null;
    var txt = cifra.trim();
    if (!txt) return null;

    // 1. tira o que está entre parênteses (tensões)
    var tensoes = [];
    var semParenteses = txt.replace(/\(([^)]*)\)/g, function (_, dentro) {
      dentro.split(/[\/,]/).forEach(function (t) {
        t = t.trim();
        if (t) tensoes.push(t);
      });
      return ''; // marcador para saber onde estavam
    });

    // 2. separa o baixo (barra que sobrou fora dos parênteses)
    var baixoNome = null;
    var partes = semParenteses.split('/');
    var corpo = partes[0];
    if (partes.length > 1) baixoNome = partes[partes.length - 1].trim();
    corpo = corpo.replace(//g, '');
    if (baixoNome) baixoNome = baixoNome.replace(//g, '');

    // 3. raiz
    var m = corpo.match(/^([A-Ga-g][#b]?)(.*)$/);
    if (!m) return null;
    var raizNome = m[1][0].toUpperCase() + m[1].slice(1);
    var qual = (m[2] || '').trim();

    var intervalos = QUALIDADES[qual];
    if (!intervalos) {
      // tenta normalizações comuns
      var alt = qual.replace(/\s/g, '');
      intervalos = QUALIDADES[alt];
    }
    if (!intervalos) intervalos = QUALIDADES[''];
    intervalos = intervalos.slice();

    tensoes.forEach(function (t) {
      var v = TENSOES[t];
      if (v === undefined) return;
      if (intervalos.indexOf(v) === -1) intervalos.push(v);
      // 9/11/13 implicam a sétima quando o acorde já é de sétima
      if (v >= 13 && intervalos.indexOf(10) === -1 && intervalos.indexOf(11) === -1) {
        // acorde de tríade com tensão: mantém sem sétima (ex.: Cadd9)
      }
    });
    intervalos.sort(function (a, b) { return a - b; });

    return {
      cifra: txt,
      raiz: pcDeNome(raizNome),
      raizNome: raizNome,
      qual: qual,
      tensoes: tensoes,
      baixoNome: baixoNome,
      baixo: baixoNome ? pcDeNome(baixoNome) : null,
      intervalos: intervalos
    };
  }

  /** Transpõe uma cifra por N semitons, grafando conforme o tom de destino. */
  function transporCifra(cifra, semitons, bemol) {
    var a = lerCifra(cifra);
    if (!a) return cifra;
    var novaRaiz = nomeDePc(a.raiz + semitons, bemol);
    var resto = cifra.trim().replace(/^[A-Ga-g][#b]?/, '');
    if (a.baixoNome) {
      var novoBaixo = nomeDePc(a.baixo + semitons, bemol);
      // troca só o último trecho depois da última barra
      var idx = resto.lastIndexOf('/');
      resto = resto.slice(0, idx + 1) + novoBaixo;
    }
    return novaRaiz + resto;
  }

  /* ---------- Notas e MIDI ---------- */

  // "C4" -> 60 (padrão MIDI: C4 = 60)
  function notaParaMidi(nota) {
    var m = String(nota).match(/^([A-Ga-g][#b]?)(-?\d+)$/);
    if (!m) return null;
    return (parseInt(m[2], 10) + 1) * 12 + pcDeNome(m[1]);
  }

  function midiParaNota(midi, bemol) {
    var pc = ((midi % 12) + 12) % 12;
    var oitava = Math.floor(midi / 12) - 1;
    return nomeDePc(pc, bemol) + oitava;
  }

  function freq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /* ---------- Geração de vozes ---------- */

  /**
   * Gera as notas (MIDI) de um item de acorde.
   * item = {
   *   cifra: "C2/E",
   *   notas: ["E2","G3","C4","D4","G4"],   // opcional: voicing exato
   *   esquerda: [...], direita: [...],      // opcional: separação de mãos
   *   lh: "C", rh: "G",                     // poliacorde: tríade esquerda + direita
   *   baixoEsquerda: true                   // toca a fundamental na esquerda
   * }
   * Retorna { esquerda:[midi], direita:[midi] }
   */
  function vozes(item, semitons) {
    semitons = semitons || 0;
    var esq = [], dir = [];

    function desloca(arr) {
      return arr.map(function (n) {
        var m = typeof n === 'number' ? n : notaParaMidi(n);
        return m + semitons;
      });
    }

    if (item.esquerda || item.direita) {
      esq = desloca(item.esquerda || []);
      dir = desloca(item.direita || []);
      return normaliza(esq, dir);
    }

    if (item.notas) {
      dir = desloca(item.notas);
      return normaliza(esq, dir);
    }

    if (item.lh && item.rh) {
      var ae = lerCifra(item.lh), ad = lerCifra(item.rh);
      var raizE = 48 + ae.raiz;                 // C3..B3
      esq = ae.intervalos.map(function (i) { return raizE + i; });
      var topoE = Math.max.apply(null, esq);
      var raizD = 60 + ad.raiz;
      while (raizD < topoE) raizD += 12;
      dir = ad.intervalos.map(function (i) { return raizD + i; });
      return normaliza(desloca(esq), desloca(dir));
    }

    var a = lerCifra(item.cifra);
    if (!a) return { esquerda: [], direita: [] };

    if (a.baixo !== null && a.baixo !== undefined) {
      esq = [48 + a.baixo];                     // C3..B3
      var pcs = a.intervalos.map(function (i) { return (a.raiz + i) % 12; });
      var ehTom = pcs.indexOf(a.baixo) !== -1;
      if (ehTom && a.intervalos.length <= 4) {
        // inversão: reordena a partir do baixo
        var base = 60 + a.baixo;
        if (base > 71) base -= 12;
        dir = pcs.map(function (pc) { return base + (((pc - a.baixo) % 12) + 12) % 12; });
      } else {
        var r = 60 + a.raiz;
        dir = a.intervalos.map(function (i) { return r + i; });
      }
    } else {
      var raiz = 60 + a.raiz;
      dir = a.intervalos.map(function (i) { return raiz + i; });
      if (item.baixoEsquerda) esq = [raiz - 12];
    }

    if (item.dobrar) {
      var grau = { '1': 0, '3': 4, '5': 7, '8': 12 }[item.dobrar];
      if (grau !== undefined) {
        var alvo = (a.raiz + grau) % 12;
        var achou = dir.filter(function (m) { return m % 12 === alvo; });
        if (achou.length) dir.push(Math.min.apply(null, achou) + 12);
      }
    }

    return normaliza(desloca(esq), desloca(dir));
  }

  function normaliza(esq, dir) {
    function limpa(arr) {
      var vistos = {}, saida = [];
      arr.slice().sort(function (a, b) { return a - b; }).forEach(function (m) {
        if (!vistos[m]) { vistos[m] = true; saida.push(m); }
      });
      return saida;
    }
    esq = limpa(esq); dir = limpa(dir);
    var todos = esq.concat(dir);
    if (!todos.length) return { esquerda: esq, direita: dir };
    // se ficou muito agudo ou muito grave, desloca oitavas até caber em 36..96
    var min = Math.min.apply(null, todos), max = Math.max.apply(null, todos);
    var shift = 0;
    while (max + shift > 96) shift -= 12;
    while (min + shift < 33) shift += 12;
    if (shift) {
      esq = esq.map(function (m) { return m + shift; });
      dir = dir.map(function (m) { return m + shift; });
    }
    return { esquerda: esq, direita: dir };
  }

  /* ---------- Áudio ---------- */

  var ctx = null;
  var master = null;

  function audio() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      // um leve "corpo" para não soar tão seco
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  var PARCIAIS = [
    { mult: 1, ganho: 1.00, tipo: 'triangle' },
    { mult: 2, ganho: 0.32, tipo: 'sine' },
    { mult: 3, ganho: 0.14, tipo: 'sine' },
    { mult: 4, ganho: 0.07, tipo: 'sine' }
  ];

  function tocarNota(midi, quando, duracao, volume) {
    var c = audio();
    if (!c) return;
    quando = quando === undefined ? c.currentTime : quando;
    duracao = duracao || 1.6;
    volume = volume === undefined ? 0.22 : volume;

    var f = freq(midi);
    var env = c.createGain();
    env.gain.setValueAtTime(0.0001, quando);
    env.gain.exponentialRampToValueAtTime(volume, quando + 0.012);
    env.gain.exponentialRampToValueAtTime(volume * 0.32, quando + 0.35);
    env.gain.exponentialRampToValueAtTime(0.0001, quando + duracao);

    var filtro = c.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.setValueAtTime(Math.min(9000, f * 8 + 900), quando);
    filtro.Q.value = 0.4;

    env.connect(filtro);
    filtro.connect(master);

    PARCIAIS.forEach(function (p) {
      var osc = c.createOscillator();
      osc.type = p.tipo;
      osc.frequency.setValueAtTime(f * p.mult, quando);
      var g = c.createGain();
      g.gain.value = p.ganho;
      osc.connect(g);
      g.connect(env);
      osc.start(quando);
      osc.stop(quando + duracao + 0.1);
    });
  }

  /** Toca um conjunto de notas. modo: 'bloco' | 'arpejo' */
  function tocarNotas(notas, opcoes) {
    opcoes = opcoes || {};
    var c = audio();
    if (!c) return;
    var t0 = c.currentTime + 0.02;
    var passo = opcoes.modo === 'arpejo' ? (opcoes.passo || 0.13) : 0.012;
    var dur = opcoes.duracao || 1.8;
    var vol = opcoes.volume === undefined ? 0.20 : opcoes.volume;
    notas.slice().sort(function (a, b) { return a - b; }).forEach(function (m, i) {
      tocarNota(m, t0 + i * passo, dur - i * passo * 0.25, vol);
    });
  }

  /** Toca uma sequência de acordes (cada item = array de midis). */
  var sequenciaAtiva = null;
  function tocarSequencia(acordes, opcoes) {
    opcoes = opcoes || {};
    var c = audio();
    if (!c) return;
    pararSequencia();
    var bpm = opcoes.bpm || 60;
    var intervalo = 60 / bpm;
    var i = 0;
    var aoTocar = opcoes.aoTocar || function () {};
    function passo() {
      if (i >= acordes.length) { pararSequencia(); if (opcoes.aoTerminar) opcoes.aoTerminar(); return; }
      tocarNotas(acordes[i], { duracao: intervalo * 1.6, volume: 0.18 });
      aoTocar(i);
      i++;
      sequenciaAtiva = setTimeout(passo, intervalo * 1000);
    }
    passo();
    return function () { pararSequencia(); };
  }

  function pararSequencia() {
    if (sequenciaAtiva) { clearTimeout(sequenciaAtiva); sequenciaAtiva = null; }
  }

  global.Musica = {
    TONS: TONS,
    pcDeNome: pcDeNome,
    nomeDePc: nomeDePc,
    lerCifra: lerCifra,
    transporCifra: transporCifra,
    notaParaMidi: notaParaMidi,
    midiParaNota: midiParaNota,
    freq: freq,
    vozes: vozes,
    tocarNota: tocarNota,
    tocarNotas: tocarNotas,
    tocarSequencia: tocarSequencia,
    pararSequencia: pararSequencia,
    ativarAudio: audio
  };
})(typeof window !== 'undefined' ? window : globalThis);
