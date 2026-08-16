/* ===========================================================
   Harmonia Prime · tela Hoje
   -----------------------------------------------------------
   A home é o oposto da biblioteca: uma microprática por vez,
   uma decisão só, cinco minutos. Nada de fila, contador de
   pendências, streak ou barra de progresso.

   Telas: inicio · passos · pergunta · recusa · concluida ·
          feito · despedida
   =========================================================== */
(function (global) {
  'use strict';

  var HP = null;                 // preenchido no primeiro render
  var palco = null;
  var vista = { nome: 'inicio', passo: 0, pratica: null, feedback: null };

  function criar(tag, classe, texto, tom) { return HP.criar(tag, classe, texto, tom); }

  function botao(classe, texto, aoClicar) {
    var b = criar('button', classe, texto);
    b.type = 'button';
    b.addEventListener('click', aoClicar);
    return b;
  }

  /* ---------- sincronização, no rodapé e em voz baixa ---------- */

  var mostrandoEntrada = false;

  /**
   * Um app de estudo não pede login na porta. Quem só quer praticar abre e
   * pratica; isto aqui fica no rodapé para quem quer o mesmo histórico no
   * celular e no computador.
   */
  function caixaNuvem() {
    var N = global.Nuvem;
    if (!N) return null;
    var st = N.estado();
    if (!st.configurado) return null;

    var cx = criar('div', 'hoje-nuvem');

    if (st.ligado) {
      cx.appendChild(criar('span', 'hoje-nuvem-selo',
        st.ocupado ? 'sincronizando…' : 'sincronizado' + (st.email ? ' · ' + st.email : '')));
      cx.appendChild(botao('hoje-link discreto', 'sair desta conta', function () {
        N.sair().then(render);
      }));
      if (st.erro) cx.appendChild(criar('p', 'hoje-nuvem-erro', st.erro));
      return cx;
    }

    if (!mostrandoEntrada) {
      cx.appendChild(botao('hoje-link discreto', 'sincronizar entre aparelhos', function () {
        mostrandoEntrada = true;
        render();
      }));
      return cx;
    }

    cx.appendChild(criar('p', 'hoje-nuvem-recado',
      'Entre com o Google para levar seu histórico para os outros aparelhos.'));
    var alvo = criar('div', 'hoje-nuvem-botao');
    cx.appendChild(alvo);
    N.montarEntrada(alvo).catch(function (e) {
      alvo.appendChild(criar('p', 'hoje-nuvem-erro',
        (e && e.message) ? e.message : 'Não deu para carregar a entrada do Google.'));
    });
    cx.appendChild(botao('hoje-link discreto', 'agora não', function () {
      mostrandoEntrada = false;
      render();
    }));
    if (st.erro) cx.appendChild(criar('p', 'hoje-nuvem-erro', st.erro));
    return cx;
  }

  function saudacao() {
    var h = new Date().getHours();
    if (h < 6) return 'Boa madrugada.';
    if (h < 12) return 'Bom dia.';
    if (h < 18) return 'Boa tarde.';
    return 'Boa noite.';
  }

  /* ---------- acordes tocáveis com teclado ---------- */

  function itemDe(a) { return typeof a === 'string' ? { cifra: a } : a; }

  /**
   * As cifras do passo com play, e um teclado só embaixo de tudo, mostrando
   * o acorde da vez. É o que responde "onde eu ponho os dedos" sem encher a
   * tela de teclados repetidos.
   */
  function painel(linhas, tom) {
    var caixa = criar('div', 'pp-painel');
    var visor = criar('div', 'pp-visor');
    var primeiro = null;
    var chips = [];

    function mostrar(item) {
      visor.innerHTML = '';
      visor.appendChild(HP.tecladoDe(item, { tom: tom }));
    }

    linhas.forEach(function (l) {
      var itens = (l.acordes || []).map(itemDe);
      if (!itens.length) return;
      if (!primeiro) primeiro = itens[0];
      if (l.rotulo) caixa.appendChild(criar('span', 'pp-rotulo', l.rotulo));
      var linha = HP.linhaCifras(l.acordes, 54, tom);
      Array.prototype.forEach.call(linha.querySelectorAll('.chip'), function (c, i) {
        chips.push(c);
        c.addEventListener('click', function () {
          c.classList.remove('oculto');            // travou, revela essa e segue
          caixa.classList.remove('escondido');
          mostrar(itens[i]);
        });
      });
      caixa.appendChild(linha);
    });

    if (!primeiro) return caixa;
    caixa.appendChild(visor);
    mostrar(primeiro);

    // esconder é opcional e reversível: ninguém falha por olhar a cifra
    var alternar = criar('button', 'pp-esconder', 'esconder as cifras');
    alternar.type = 'button';
    alternar.addEventListener('click', function () {
      var escondendo = !caixa.classList.contains('escondido');
      caixa.classList.toggle('escondido', escondendo);
      chips.forEach(function (c) { c.classList.toggle('oculto', escondendo); });
      alternar.textContent = escondendo ? 'mostrar as cifras' : 'esconder as cifras';
    });
    caixa.appendChild(alternar);
    return caixa;
  }

  /** Só as cifras, sem teclado: para o cartão da home. */
  function tira(acordes, tom, classe) {
    var caixa = criar('div', classe || 'pp-tira');
    acordes.forEach(function (a, i) {
      var it = itemDe(a);
      caixa.appendChild(HP.cifraChip(it, null, tom));
      if (i < acordes.length - 1) caixa.appendChild(criar('span', 'pp-seta', '→'));
    });
    return caixa;
  }

  function progressaoDa(pratica, chunk) {
    return pratica.progressao || pratica.depois || (chunk && chunk.progressao) || [];
  }

  /* ---------- tela: início ---------- */

  var ETIQUETA = {
    nova: 'Prática de hoje',
    repetir: 'Prática de hoje',
    reforco: 'O mesmo som, outro caminho',
    revisao: 'Reencontro'
  };

  var RECADO = {
    repetir: 'Vamos ficar mais um dia nesta. Sem pressa.',
    reforco: 'Hoje o mesmo som aparece dentro de outra progressão.',
    revisao: 'Hoje vamos reencontrar uma sonoridade que você já praticou.'
  };

  function telaInicio(dados) {
    var p = dados.pratica, chunk = dados.chunk, tom = p.tom || 'C';
    var cx = criar('div', 'hoje-cartao');

    cx.appendChild(criar('p', 'hoje-saudacao', saudacao()));

    var etiqueta = criar('p', 'hoje-etiqueta');
    etiqueta.appendChild(criar('span', '', ETIQUETA[dados.motivo] || ETIQUETA.nova));
    etiqueta.appendChild(criar('span', 'hoje-tempo', (p.duracao || 5) + ' minutos'));
    cx.appendChild(etiqueta);

    cx.appendChild(criar('h1', 'hoje-titulo', p.titulo));
    if (RECADO[dados.motivo]) cx.appendChild(criar('p', 'hoje-recado', RECADO[dados.motivo]));

    var prog = progressaoDa(p, chunk);
    if (prog.length) cx.appendChild(tira(prog, tom, 'hoje-progressao'));

    if (p.aprende) {
      var ap = criar('div', 'hoje-aprende');
      ap.appendChild(criar('span', 'hoje-rotulo', 'O que você vai aprender'));
      ap.appendChild(criar('p', '', p.aprende, tom));
      cx.appendChild(ap);
    }

    if (p.antes && p.depois) {
      var par = criar('div', 'hoje-par');
      [['Antes', p.antes], ['Depois', p.depois]].forEach(function (lado) {
        var col = criar('div', 'hoje-lado');
        col.appendChild(criar('span', 'hoje-rotulo', lado[0]));
        col.appendChild(tira(lado[1], tom));
        par.appendChild(col);
      });
      cx.appendChild(par);
    }

    if (tom !== 'C') cx.appendChild(criar('p', 'hoje-tom', 'no tom de ' + tom));

    cx.appendChild(botao('hoje-comecar', 'Começar prática', function () {
      HP.ativarAudio();
      vista = { nome: 'passos', passo: 0, pratica: p, chunk: chunk, feedback: null };
      render();
    }));

    var rodape = criar('div', 'hoje-rodape');
    rodape.appendChild(botao('hoje-link', 'Ver minha biblioteca', function () { HP.abrirBiblioteca(); }));
    cx.appendChild(rodape);

    var resumo = global.Treinador.resumoSemana();
    if (resumo) cx.appendChild(criar('p', 'hoje-nota', resumo));

    var nuvem = caixaNuvem();
    if (nuvem) cx.appendChild(nuvem);

    return cx;
  }

  /* ---------- tela: passos ---------- */

  function telaPassos() {
    var p = vista.pratica, tom = p.tom || 'C';
    var passos = p.passos || [];
    var i = Math.min(vista.passo, passos.length - 1);
    var passo = passos[i];
    var ultimo = i === passos.length - 1;

    var cx = criar('div', 'hoje-cartao pratica');

    var topo = criar('div', 'pp-topo');
    topo.appendChild(criar('span', 'pp-tit', p.titulo));
    topo.appendChild(botao('pp-sair', 'sair', function () {
      HP.pararSom();
      vista = { nome: 'inicio' };
      render();
    }));
    cx.appendChild(topo);

    cx.appendChild(criar('p', 'pp-contador', 'Passo ' + (i + 1) + ' de ' + passos.length));
    cx.appendChild(criar('h2', 'pp-texto', passo.texto, tom));

    if (passo.linhas && passo.linhas.length) cx.appendChild(painel(passo.linhas, tom));

    if (passo.video) cx.appendChild(caixaVideo(p, passo));
    if (passo.musica) cx.appendChild(caixaMusica());
    if (passo.nota) cx.appendChild(criar('p', 'pp-nota', passo.nota, tom));

    cx.appendChild(botao('hoje-comecar', ultimo ? 'Finalizar' : 'Próximo', function () {
      HP.pararSom();
      if (ultimo) {
        vista.nome = 'pergunta';
      } else {
        vista.passo = i + 1;
      }
      render();
    }));

    if (i > 0) {
      cx.appendChild(botao('hoje-link discreto', 'voltar um passo', function () {
        HP.pararSom();
        vista.passo = i - 1;
        render();
      }));
    }

    return cx;
  }

  function caixaVideo(p, passo) {
    var aula = HP.aulaDe(p.aula || (global.Treinador.chunk(p.chunkId) || {}).aula || 1);
    var cx = criar('div', 'pp-video');
    if (!aula || !aula.video) {
      cx.appendChild(criar('p', 'pp-nota', 'O vídeo desta aula ainda não está cadastrado.'));
      return cx;
    }
    var de = HP.relogio(passo.video.inicio);
    var ate = passo.video.fim ? HP.relogio(passo.video.fim) : null;
    var b = botao('pp-botao-video', '<span class="ico">▶</span>Assistir ' + de + (ate ? ' até ' + ate : ''), function () {
      HP.abrirVideo(aula.video.id, passo.video.inicio, p.titulo, b, passo.video.fim);
    });
    cx.appendChild(b);
    return cx;
  }

  function caixaMusica() {
    var cx = criar('div', 'pp-musica');
    cx.appendChild(botao('pp-botao-video', 'Abrir o buscador de cifras', function () {
      HP.irParaAula('aula-01', 'aplicar');
    }));
    return cx;
  }

  /* ---------- tela: pergunta ---------- */

  function telaPergunta() {
    var p = vista.pratica;
    var cx = criar('div', 'hoje-cartao centro');
    cx.appendChild(criar('h2', 'hoje-pergunta', 'Você realmente praticou isso no teclado?'));

    cx.appendChild(botao('hoje-comecar', 'Sim, pratiquei', function () {
      global.Treinador.registrar(p.id, true, null);
      vista.nome = 'concluida';
      render();
    }));

    cx.appendChild(botao('hoje-link', 'Não pratiquei', function () {
      global.Treinador.registrar(p.id, false, null);
      vista.nome = 'recusa';
      render();
    }));

    return cx;
  }

  function telaRecusa() {
    var cx = criar('div', 'hoje-cartao centro');
    cx.appendChild(criar('p', 'hoje-frase', 'Tudo bem. Esta prática continua te esperando.'));
    cx.appendChild(botao('hoje-comecar', 'Voltar', function () {
      vista = { nome: 'inicio' };
      render();
    }));
    return cx;
  }

  /* ---------- tela: concluída ---------- */

  var FEEDBACKS = [
    { id: 'legal', rosto: '🙂', texto: 'Saiu legal' },
    { id: 'estranho', rosto: '😐', texto: 'Ainda estranho' },
    { id: 'travei', rosto: '😣', texto: 'Travei' }
  ];

  function telaConcluida() {
    var p = vista.pratica;
    var cx = criar('div', 'hoje-cartao centro');

    cx.appendChild(criar('p', 'hoje-selo', '✓ Prática concluída.'));
    cx.appendChild(criar('p', 'hoje-frase', 'Hoje você colocou uma nova cor debaixo dos dedos.'));

    var caixaFb = criar('div', 'hoje-feedback');
    caixaFb.appendChild(criar('span', 'hoje-rotulo', 'Como foi?'));
    var linha = criar('div', 'hoje-rostos');
    FEEDBACKS.forEach(function (f) {
      var b = botao('hoje-rosto' + (vista.feedback === f.id ? ' escolhido' : ''),
        '<span class="rosto">' + f.rosto + '</span>' + f.texto, function () {
          vista.feedback = f.id;
          global.Treinador.anotarFeedback(p.id, f.id);
          render();
        });
      linha.appendChild(b);
    });
    caixaFb.appendChild(linha);
    cx.appendChild(caixaFb);

    cx.appendChild(botao('hoje-comecar', 'Encerrar por hoje', function () {
      global.Treinador.encerrarPorHoje();
      vista = { nome: 'despedida' };
      render();
    }));

    cx.appendChild(botao('hoje-link discreto', 'quero fazer mais uma', function () {
      global.Treinador.maisUma();
      vista = { nome: 'inicio' };
      render();
    }));

    return cx;
  }

  /* ---------- telas de fim de dia ---------- */

  function telaFeito() {
    var cx = criar('div', 'hoje-cartao centro');
    cx.appendChild(criar('p', 'hoje-selo', '✓ Feito por hoje.'));
    cx.appendChild(criar('p', 'hoje-frase', 'Cinco minutos contam como sessão completa. Amanhã tem outra.'));

    cx.appendChild(botao('hoje-comecar', 'Encerrar', function () {
      vista = { nome: 'despedida' };
      render();
    }));

    cx.appendChild(botao('hoje-link discreto', 'quero fazer mais uma', function () {
      global.Treinador.maisUma();
      vista = { nome: 'inicio' };
      render();
    }));

    var rodape = criar('div', 'hoje-rodape');
    rodape.appendChild(botao('hoje-link', 'Ver minha biblioteca', function () { HP.abrirBiblioteca(); }));
    cx.appendChild(rodape);

    var resumo = global.Treinador.resumoSemana();
    if (resumo) cx.appendChild(criar('p', 'hoje-nota', resumo));

    var nuvem = caixaNuvem();
    if (nuvem) cx.appendChild(nuvem);
    return cx;
  }

  function telaDespedida() {
    var cx = criar('div', 'hoje-cartao centro');
    cx.appendChild(criar('p', 'hoje-frase grande', 'Até a próxima.'));
    var rodape = criar('div', 'hoje-rodape');
    rodape.appendChild(botao('hoje-link', 'Ver minha biblioteca', function () { HP.abrirBiblioteca(); }));
    cx.appendChild(rodape);
    return cx;
  }

  function telaVazio() {
    var cx = criar('div', 'hoje-cartao centro');
    cx.appendChild(criar('p', 'hoje-selo', 'Tudo praticado por enquanto.'));
    cx.appendChild(criar('p', 'hoje-frase',
      'As micropráticas cadastradas acabaram. Acrescente mais em <span class="mono">conteudo/praticas.js</span> quando quiser.'));
    var rodape = criar('div', 'hoje-rodape');
    rodape.appendChild(botao('hoje-link', 'Ver minha biblioteca', function () { HP.abrirBiblioteca(); }));
    cx.appendChild(rodape);
    return cx;
  }

  /* ---------- render ---------- */

  function render() {
    HP = global.HP;
    palco = document.getElementById('hoje-palco');
    if (!palco || !HP) return;
    palco.innerHTML = '';

    var tela;
    if (vista.nome === 'passos') tela = telaPassos();
    else if (vista.nome === 'pergunta') tela = telaPergunta();
    else if (vista.nome === 'recusa') tela = telaRecusa();
    else if (vista.nome === 'concluida') tela = telaConcluida();
    else if (vista.nome === 'despedida') tela = telaDespedida();
    else {
      var dados = global.Treinador.hoje();
      if (dados.modo === 'feito') tela = telaFeito();
      else if (dados.modo === 'vazio') tela = telaVazio();
      else {
        vista = { nome: 'inicio', passo: 0, pratica: dados.pratica, chunk: dados.chunk, feedback: null };
        tela = telaInicio(dados);
      }
    }

    palco.appendChild(tela);
    palco.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  /**
   * A nuvem avisa quando chegou histórico de outro aparelho. Redesenhar no
   * meio de uma prática seria trocar o chão debaixo dos pés, então isso só
   * acontece nas telas de descanso.
   */
  function ligarNuvem() {
    var N = global.Nuvem;
    if (!N) return;
    N.aoMudar(function () {
      if (vista.nome === 'passos' || vista.nome === 'pergunta') return;
      render();
    });
    N.iniciar();
  }

  global.Hoje = { render: render, ligarNuvem: ligarNuvem };

})(typeof window !== 'undefined' ? window : globalThis);
