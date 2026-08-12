/* ===========================================================
   Harmonia Prime — cifras de fora
   Busca no acervo do Cifra Club, importa a cifra escolhida e
   quebra o texto em seções, linhas e acordes, guardando a
   coluna de cada acorde para manter o alinhamento com a letra.
   =========================================================== */
(function (global) {
  'use strict';

  var BUSCA  = 'https://solr.sscdn.co/cifraclub/h/?q=';
  var SITE   = 'https://www.cifraclub.com.br/';
  // leitores públicos que repassam a página com CORS liberado
  var LEITORES = [
    function (alvo) { return { url: 'https://r.jina.ai/' + alvo, cabecalhos: { 'X-Return-Format': 'html' } }; },
    function (alvo) { return { url: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(alvo), cabecalhos: {} }; }
  ];

  /* ---------- busca ---------- */

  /** Busca instantânea no acervo. Devolve só músicas, com artista e slug. */
  function buscar(termo, limite) {
    termo = (termo || '').trim();
    if (termo.length < 2) return Promise.resolve([]);
    var url = BUSCA + encodeURIComponent(termo) + '&wt=json&rows=' + (limite || 14);
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('a busca não respondeu (' + r.status + ')');
      return r.json();
    }).then(function (d) {
      var docs = (d && d.response && d.response.docs) || [];
      var vistos = {}, saida = [];
      docs.forEach(function (x) {
        if (x.t !== '2' || !x.url || !x.dns) return;   // t=2 é música; t=1 é artista
        var chave = x.dns + '/' + x.url;
        if (vistos[chave]) return;
        vistos[chave] = true;
        saida.push({ titulo: x.txt, artista: x.art, dns: x.dns, slug: x.url });
      });
      return saida;
    });
  }

  /* ---------- importação ---------- */

  function baixar(alvo, i) {
    i = i || 0;
    if (i >= LEITORES.length) {
      return Promise.reject(new Error('não consegui trazer a cifra automaticamente'));
    }
    var pedido = LEITORES[i](alvo);
    return fetch(pedido.url, { headers: pedido.cabecalhos })
      .then(function (r) {
        if (!r.ok) throw new Error('status ' + r.status);
        return r.text();
      })
      .then(function (txt) {
        if (txt.indexOf('<pre') === -1) throw new Error('veio sem a cifra');
        return txt;
      })
      .catch(function () { return baixar(alvo, i + 1); });
  }

  /** Traz a cifra de uma música do acervo. */
  function importar(dns, slug) {
    var alvo = SITE + dns + '/' + slug + '/imprimir.html';
    return baixar(alvo).then(function (html) {
      var blocos = html.match(/<pre>[\s\S]*?<\/pre>/g) || [];
      if (!blocos.length) throw new Error('a página veio sem a cifra');
      var corpo = blocos.map(function (b) {
        return b.replace(/^<pre>/, '').replace(/<\/pre>$/, '');
      }).join('\n\n');

      var tom = (html.match(/id="cifra_tom"[\s\S]{0,240}?>\s*([A-G][#b]?m?)\s*<\/a>/) || [])[1] || null;
      var titulo = (html.match(/<h1[^>]*>[\s\S]{0,200}?>([^<]+)<\/a>/) || [])[1];

      return {
        titulo: titulo ? titulo.trim() : null,
        tomOriginal: tom,
        fonte: SITE + dns + '/' + slug + '/',
        mapa: analisarHtml(corpo)
      };
    });
  }

  /* ---------- leitura do texto ---------- */

  var ENTIDADES = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' '
  };

  function entidade(e) {
    if (ENTIDADES[e]) return ENTIDADES[e];
    var m = e.match(/^&#(\d+);$/);
    if (m) return String.fromCharCode(parseInt(m[1], 10));
    return e;
  }

  /**
   * Lê uma linha vinda do <pre>, onde cada acorde está dentro de <b>.
   * Devolve o texto sem marcação e a coluna exata de cada acorde.
   */
  function lerLinhaHtml(bruta) {
    var re = /<b[^>]*>([\s\S]*?)<\/b>|(<[^>]*>)|(&[a-zA-Z#0-9]+;)|([\s\S])/g;
    var cifras = [], texto = '', m;
    while ((m = re.exec(bruta)) !== null) {
      if (m[1] !== undefined) {
        var c = m[1].replace(/<[^>]*>/g, '').replace(/&[a-zA-Z#0-9]+;/g, entidade).trim();
        if (c) {
          cifras.push({ cifra: c, col: texto.length });
          texto += c;
        }
      } else if (m[2] !== undefined) {
        // tag que não é <b> (span de tablatura etc.): some sem virar texto
      } else if (m[3] !== undefined) {
        texto += entidade(m[3]);
      } else {
        texto += m[4];
      }
    }
    return { texto: texto.replace(/\s+$/, ''), cifras: cifras };
  }

  /** Linha de tablatura de violão: não serve para o piano, cai fora. */
  function ehTablatura(texto) {
    if (/^\s*\[tab[^\]]*\]\s*$/i.test(texto)) return true;
    return /^\s*[EADGBe][b#]?\|/.test(texto) && /[-–—]{3,}/.test(texto);
  }

  /* ---------- reconhecimento de acorde em texto colado ---------- */

  var RE_ACORDE = /^[A-G][#b]?(?:m|M|maj|min|dim|aug|sus|add|°|ø|\+|-)?[0-9°ø#b+\-()\/A-Za-z]*$/;

  /** Um token isolado tem cara de cifra? */
  function pareceAcorde(tok) {
    if (!tok || tok.length > 14) return false;
    if (!RE_ACORDE.test(tok)) return false;
    return !!(global.Musica && global.Musica.lerCifra(tok));
  }

  /** Só letra maiúscula solta (A, E, D) é ambígua: em português também é palavra. */
  function acordeForte(tok) {
    return pareceAcorde(tok) && (tok.length > 1 || /[#b]/.test(tok));
  }

  function ehLinhaDeAcordes(linha) {
    var limpa = linha.replace(/[|()\[\]]/g, ' ').replace(/\bx\d+\b/gi, ' ').trim();
    if (!limpa) return false;
    var toks = limpa.split(/\s+/);
    if (toks.length > 14) return false;
    if (!toks.every(pareceAcorde)) return false;
    return toks.some(acordeForte);
  }

  /** Acha a coluna de cada acorde numa linha de texto puro. */
  function cifrasDaLinha(linha) {
    var saida = [], re = /\S+/g, m;
    while ((m = re.exec(linha)) !== null) {
      var tok = m[0].replace(/^[(\[|]+|[)\]|]+$/g, '');
      if (tok && pareceAcorde(tok)) saida.push({ cifra: tok, col: m.index });
    }
    return saida;
  }

  /* ---------- montagem do mapa ---------- */

  function novoMapa() {
    return { secoes: [], cifras: [] };
  }

  /** Junta as linhas lidas num mapa de seções, numerando os acordes. */
  function montar(linhas) {
    var mapa = novoMapa();
    var secao = null;
    var i = 0;

    function garanteSecao() {
      if (!secao) { secao = { nome: '', linhas: [] }; mapa.secoes.push(secao); }
      return secao;
    }

    while (i < linhas.length) {
      var l = linhas[i];
      if (ehTablatura(l.texto)) { i++; continue; }
      var cab = l.texto.match(/^\s*\[([^\]]+)\]/);

      // "[Intro]" sozinho abre a seção; "[Intro] Bm A D" abre e ainda traz acordes
      if (cab) {
        secao = { nome: cab[1].trim(), linhas: [] };
        mapa.secoes.push(secao);
        var recorte = cab[0].length;
        if (!l.texto.slice(recorte).trim() && !l.cifras.length) { i++; continue; }
        l = {
          texto: ' '.repeat(recorte) + l.texto.slice(recorte),
          cifras: l.cifras.filter(function (c) { return c.col >= recorte; })
        };
      }

      if (!l.texto.trim() && !l.cifras.length) {
        if (secao && secao.linhas.length) secao.linhas.push({ tipo: 'espaco' });
        i++;
        continue;
      }

      garanteSecao();

      if (l.cifras.length) {
        // sobrou letra na mesma linha? então é linha mista e não casa com a de baixo
        var soAcordes = ehSoAcordes(l);
        var prox = linhas[i + 1];
        var letra = null;
        if (soAcordes && prox && !prox.cifras.length && prox.texto.trim()) {
          letra = prox.texto;
          i++;
        }
        secao.linhas.push({ tipo: 'par', cifras: l.cifras, texto: soAcordes ? '' : l.texto, letra: letra });
      } else {
        secao.linhas.push({ tipo: 'letra', letra: l.texto });
      }
      i++;
    }

    // numera os acordes na ordem em que aparecem, guardando seção e linha
    var nLinha = 0;
    mapa.secoes.forEach(function (s, is) {
      s.indice = is;
      s.linhas.forEach(function (ln) {
        if (!ln.cifras || !ln.cifras.length) return;
        ln.linha = nLinha++;
        ln.cifras.forEach(function (c, k) {
          c.i = mapa.cifras.length;
          c.secao = is;
          c.linha = ln.linha;
          c.posLinha = k;
          c.ultimoDaLinha = k === ln.cifras.length - 1;
          mapa.cifras.push(c);
        });
      });
    });

    // tira seções que ficaram vazias
    mapa.secoes = mapa.secoes.filter(function (s) {
      return s.linhas.some(function (l) { return l.tipo !== 'espaco'; });
    });

    return mapa;
  }

  /** A linha tem só acordes (o resto é espaço em branco)? */
  function ehSoAcordes(l) {
    var resto = l.texto;
    // remove os acordes das posições conhecidas, da direita para a esquerda
    l.cifras.slice().sort(function (a, b) { return b.col - a.col; }).forEach(function (c) {
      resto = resto.slice(0, c.col) + resto.slice(c.col + c.cifra.length);
    });
    return !resto.replace(/[\s|()\-–—.]/g, '').replace(/x\d+/gi, '').trim();
  }

  function analisarHtml(corpo) {
    return montar(corpo.split('\n').map(lerLinhaHtml));
  }

  /** Lê uma cifra colada como texto puro. */
  function analisarTexto(texto) {
    var linhas = String(texto).replace(/\r/g, '').split('\n').map(function (linha) {
      if (ehLinhaDeAcordes(linha)) return { texto: linha.replace(/\s+$/, ''), cifras: cifrasDaLinha(linha) };
      return { texto: linha.replace(/\s+$/, ''), cifras: [] };
    });
    return montar(linhas);
  }

  global.Cifras = {
    buscar: buscar,
    importar: importar,
    analisarHtml: analisarHtml,
    analisarTexto: analisarTexto,
    pareceAcorde: pareceAcorde
  };

})(typeof window !== 'undefined' ? window : globalThis);
