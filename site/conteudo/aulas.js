/* ===========================================================
   Harmonia Prime — conteúdo das aulas
   -----------------------------------------------------------
   Cada aula é um objeto com "blocos". Tipos de bloco disponíveis:

   { tipo:'conceito',  itens:[{termo, texto}] }
   { tipo:'texto',     titulo, corpo:['parágrafo', ...] }
   { tipo:'lista',     titulo, texto, itens:['...'] }
   { tipo:'acordes',   titulo, texto, itens:[{cifra, nota, notas|esquerda|direita, marcadores}] }
   { tipo:'progressao',titulo, texto, acordes:['C','G2/B',...] }
   { tipo:'conexoes',  titulo, texto, itens:[{nome, forte:[], suave:[]}] }
   { tipo:'tabela',    titulo, texto, colunas:[], linhas:[{rotulo, cifras:[]}] }
   { tipo:'comparacao',titulo, texto, itens:[{rotulo, legenda, notas:[]}] }
   { tipo:'poliacordes',titulo, texto, itens:[{grau, lh, rh, resultado}] }
   { tipo:'dica',      titulo, corpo:['...'] }
   { tipo:'objetivo',  titulo, itens:['...'] }
   { tipo:'exercicios',titulo, texto, itens:[{n, tema, tempo, passos:[], criterio, acordes:[]}] }
   { tipo:'repertorio',titulo, texto, rodape,
     grupos:[{estilo, nota, itens:[{nome, graus, contexto, aplicar, acordes:[]}]}] }

   Em "acordes"/"comparacao" você pode dar o voicing exato em `notas`
   (ex.: ["E3","G3","C4","D4","G4"]) ou deixar o site montar sozinho a
   partir da cifra. `marcadores` usa índices da lista de notas da direita:
   [{de:0, para:3, texto:'quinta dobrada'}]
   =========================================================== */

var AULAS = [
  {
    numero: 1,
    id: 'aula-01',
    titulo: 'Tríades',
    subtitulo: 'Sensação, inversão, dobramento, conexões e poliacordes',
    data: '01/12',
    video: { id: 'AftVKDD9T8A' },
    resumo: 'A tríade como matéria-prima: como invertê-la, engordá-la, abri-la e empilhá-la até virar acorde de sete notas.',
    blocos: [

      {
        tipo: 'objetivo',
        titulo: 'No fim da aula você consegue',
        itens: [
          'Trocar o baixo sem mexer a mão direita.',
          'Substituir qualquer tríade por sus2 ou sus4 — e saber quando não fazer isso.',
          'Sair de um acorde e chegar em outro por três caminhos diferentes.',
          'Montar acorde de cinco ou seis notas empilhando duas tríades, por regra, sem decorar tabela.'
        ]
      },

      {
        tipo: 'conceito',
        titulo: 'Os dois fundamentos', curto: 'Fundamentos', t: 51,
        itens: [
          { termo: 'Sensações', t: 51, texto: 'Associar o acorde à <b>sensação</b>, não ao nome. O nome é etiqueta de arquivo; o que você recupera na hora de tocar é a cor.' },
          { termo: 'Inversão', t: 192, texto: 'Inverter <b>não</b> é trocar a nota da mão esquerda por outra qualquer — é inverter o <b>baixo</b>. A mão direita fica parada com a mesma tríade. Muda o chão, não o acorde.' }
        ]
      },

      {
        tipo: 'acordes',
        titulo: 'Sus2 — o acorde sem gênero', curto: 'Sus2', t: 236,
        texto: 'Sus2 <b>tira a terça</b>. E sem terça não existe maior nem menor: o acorde perde o gênero e fica neutro. É por isso que ele cai bem em acorde de <b>passagem</b> — não briga com a melodia e não fecha a frase. Se o acorde é o destino, deixe a tríade pura.',
        legenda: 'Toque o par em sequência e ouça a terça sumir.',
        itens: [
          { cifra: 'C/E',   nota: 'antes' },
          { cifra: 'C2/E',  nota: 'depois' },
          { cifra: 'Am',    nota: 'antes' },
          { cifra: 'F2/A',  nota: 'depois' },
          { cifra: 'Bmb5',  nota: 'antes' },
          { cifra: 'G2/B',  nota: 'depois' }
        ]
      },

      {
        tipo: 'acordes',
        titulo: 'Dobramento', curto: 'Dobramento', t: 661,
        texto: 'Mesmo conceito, mas repetindo uma nota uma oitava acima. Dobre a <b>quinta</b> ou a <b>tônica</b> — nunca a terça. A terça é a cor do acorde: dobrada, ela pesa e embola. Quinta e tônica são neutras, dão corpo sem mudar nada. E como a nota aparece duas vezes, dá pra arpejar segurando ela.',
        legenda: 'As setas mostram a nota dobrada.',
        itens: [
          {
            cifra: 'C2/E', nota: 'quinta dobrada',
            esquerda: ['E3'], direita: ['G3', 'C4', 'D4', 'G4'],
            marcadores: [{ de: 0, para: 3, texto: 'quinta dobrada' }]
          },
          {
            cifra: 'F2/A', nota: 'tônica dobrada',
            esquerda: ['A3'], direita: ['F3', 'G3', 'C4', 'F4'],
            marcadores: [{ de: 0, para: 3, texto: 'tônica dobrada' }]
          },
          {
            cifra: 'G2/B', nota: 'quinta dobrada',
            esquerda: ['B3'], direita: ['D4', 'G4', 'A4', 'D5'],
            marcadores: [{ de: 0, para: 3, texto: 'quinta dobrada' }]
          },
          {
            cifra: 'G4', nota: 'tônica dobrada',
            direita: ['G3', 'C4', 'D4', 'G4'],
            marcadores: [{ de: 0, para: 3, texto: 'tônica dobrada' }]
          }
        ]
      },

      {
        tipo: 'acordes',
        titulo: 'Sus4 — quando a música para', curto: 'Sus4', t: 963,
        texto: 'O sus4 troca a terça pela quarta. Ele não descansa: fica pendurado esperando resolver — e é exatamente por isso que serve quando a música <b>para</b>. Aqui também dobramos: <b>{G} – {C} – {D} – {G}</b>. Parando num {G4}, dá pra separar em dois blocos, sempre dobrando: primeiro o {C4}, depois o {G4}.',
        legenda: 'Mesmo desenho de mão, deslocado.',
        itens: [
          { cifra: 'C4', nota: 'C – F – G – C', direita: ['C3', 'F3', 'G3', 'C4'], marcadores: [{ de: 0, para: 3, texto: 'tônica dobrada' }] },
          { cifra: 'G4', nota: 'G – C – D – G', direita: ['G3', 'C4', 'D4', 'G4'], marcadores: [{ de: 0, para: 3, texto: 'tônica dobrada' }] }
        ]
      },

      {
        tipo: 'conexoes',
        titulo: 'As 3 conexões', curto: 'Conexões', t: 1156,
        texto: 'Acordes intermediários para <b>sair de um acorde e chegar em outro</b>. Cada uma tem duas versões. Na <b>forte</b>, o baixo salta e passa pela dominante: empurra. Na <b>suave</b>, o baixo anda por grau conjunto e fica na mesma família: conduz.',
        itens: [
          { nome: 'Impulso diatônico', t: 1226, descricao: 'O grau seguinte empurra a chegada.', forte: ['C', 'G', 'Am'], suave: ['C', 'Em', 'Am'] },
          { nome: 'Inversão de passagem', t: 1398, descricao: 'O baixo caminha por grau conjunto.', forte: ['C', 'G/B', 'Am'], suave: ['C', 'Em/B', 'Am'] },
          { nome: 'Caminho preparado', t: 1568, descricao: 'Dois acordes preparam a chegada.', forte: ['C', 'F', 'G', 'Am'], suave: ['C', 'Dm', 'Em', 'Am'] }
        ],
        variacoesTitulo: 'Blocos curtos para colar em qualquer lugar',
        variacoes: [
          ['F', 'Em'],
          ['F', 'Em/G'],
          ['F/A', 'G/B'],
          ['Dm', 'G'],
          ['Dm', 'G/B']
        ]
      },

      {
        tipo: 'tabela',
        titulo: 'Três tríades sobre o mesmo baixo', curto: 'Mesmo baixo', t: 484,
        texto: 'A regra é uma só: <b>toda nota é fundamental de um acorde, terça de outro e quinta de um terceiro</b>. Sobre o baixo dó cabem {C} (dó é fundamental), {Am} (dó é terça) e {F} (dó é quinta) — e é daí que sai a tabela inteira. Sabendo a regra você não precisa dela; ela está aqui só para conferir.',
        colunas: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        linhas: [
          { rotulo: 'Fundamental', cifras: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bmb5'] },
          { rotulo: '1ª inversão', cifras: ['Am/C', 'Bmb5/D', 'C/E', 'Dm/F', 'Em/G', 'F/A', 'G/B'] },
          { rotulo: '2ª inversão', cifras: ['F/C', 'G/D', 'Am/E', 'Bmb5/F', 'C/G', 'Dm/A', 'Em/B'] }
        ]
      },

      {
        tipo: 'comparacao',
        titulo: 'Tríade aberta', curto: 'Tríade aberta', t: 2047,
        texto: 'Pega a <b>nota do meio</b> e sobe uma oitava. As mesmas três notas, agora respirando. O nome <b>1 – 5 – 10</b> vem daí: a terça subiu uma oitava e virou décima (3 + 7 = 10). Funciona especialmente bem quando as notas da melodia estão muito próximas umas das outras.',
        itens: [
          { rotulo: 'C — tríade fechada', legenda: 'som apertado, cheio', notas: ['C4', 'E4', 'G4'] },
          { rotulo: 'C — tríade aberta', legenda: 'som largo, respira', notas: ['C4', 'G4', 'E5'] }
        ]
      },

      {
        tipo: 'comparacao',
        titulo: 'As três posições abertas', curto: 'Posições abertas', t: 2055,
        texto: 'Como na fechada, a <b>nota grave define a posição</b>. Não são três desenhos: é uma forma só, com três entradas.',
        colunas: 3,
        itens: [
          { rotulo: 'Fundamental', legenda: '1 – 5 – 10', notas: ['C4', 'G4', 'E5'] },
          { rotulo: '1ª inversão', legenda: 'baixo na terça', notas: ['E4', 'C5', 'G5'] },
          { rotulo: '2ª inversão', legenda: 'baixo na quinta', notas: ['G4', 'E5', 'C6'] }
        ]
      },

      {
        tipo: 'acordes',
        titulo: 'A esquerda sozinha — 1 · 5 · 10', curto: '1 · 5 · 10', t: 2326,
        texto: 'Fundamental, quinta e terça. É tudo o que o ouvido precisa para reconhecer o acorde, e deixa a direita inteira livre para a melodia.',
        itens: [
          { cifra: 'C', nota: '1 – 5 – 10', esquerda: ['C3', 'G3', 'E4'] }
        ]
      },

      {
        tipo: 'poliacordes',
        titulo: 'Poliacordes — uma regra, não sete acordes', curto: 'Poliacordes', t: 3244,
        texto: 'Tríade na esquerda + tríade na direita = acorde de cinco ou seis notas. A da direita não é aleatória: é <b>a tríade que entrega a sétima</b>. São duas famílias, e acabou.',
        regras: [
          { nome: 'Acorde maior', regra: 'tríade da <b>quinta acima</b>', resultado: 'traz a 7ª maior e a 9ª', exemplo: '{C} + {G}' },
          { nome: 'Menor ou sus4', regra: 'tríade <b>um tom abaixo</b> — que é a sétima menor', resultado: 'traz a 7ª, a 9ª e a 11ª', exemplo: '{Dm} + {C}' }
        ],
        legenda: 'A tabela abaixo é a regra aplicada aos sete graus. Confira, não decore.',
        itens: [
          { grau: 'I',   lh: 'C',  rh: 'G', resultado: 'C7M(9)' },
          { grau: 'II',  lh: 'Dm', rh: 'C', resultado: 'Dm7(9/11)' },
          { grau: 'III', lh: 'Em', rh: 'D', resultado: 'Em7(9/11)' },
          { grau: 'IV',  lh: 'F',  rh: 'C', resultado: 'F7M(9)' },
          { grau: 'V',   lh: 'G4', rh: 'F', resultado: 'G4(7/9)' },
          { grau: 'VI',  lh: 'Am', rh: 'G', resultado: 'Am7(9/11)' },
          { grau: 'VII', lh: 'Bm', rh: 'A', resultado: 'Bm7(9/11)' }
        ]
      },

      {
        tipo: 'exercicios',
        titulo: 'Exercícios', t: 3534,
        texto: 'Um por tema, na ordem da aula. A rotina inteira dá <b>37 minutos</b>. Se tiver 15, faça os de número 2, 4 e 8. Use o seletor de tom lá em cima para repetir em outros tons.',
        itens: [
          {
            n: 1, tema: 'Sensações', tempo: '3 min',
            passos: [
              'Toque e espere o som acabar antes de pensar no nome.',
              'Diga a <b>sensação</b> em voz alta primeiro: descanso, saudade, expectativa, tensão.',
              'Só depois nomeie a cifra.'
            ],
            criterio: 'Quatro sensações diferentes descritas antes de qualquer nome aparecer na cabeça.',
            acordes: ['C', 'Am', 'F', 'G']
          },
          {
            n: 2, tema: 'Inversão', tempo: '4 min',
            passos: [
              'Monte {C} na direita e <b>não tire a mão do lugar</b>.',
              'Troque só o baixo: {C} → {E} → {G} → {E} → {C}.',
              'Repita com {F} e com {G}.'
            ],
            criterio: 'Os três baixos sem olhar para a esquerda e sem a direita se mexer um milímetro.',
            acordes: ['C', 'C/E', 'C/G', 'C/E', 'C']
          },
          {
            n: 3, tema: 'Suspensões', tempo: '6 min',
            passos: [
              '<b>Sus2:</b> tríade quatro tempos, sus2 quatro tempos, alternando. Repare que muda um dedo só.',
              '<b>Sus4:</b> {C4} → {C} e {G4} → {G}, oito vezes cada, mesmo dedilhado.',
              'Termine parando num {G4} por quatro tempos antes de resolver — é assim que a música respira.'
            ],
            criterio: 'A troca acontece dentro do tempo, sem quebrar o andamento nem reajustar a mão.',
            acordes: ['C/E', 'C2/E', 'Am', 'F2/A', 'G4', 'G']
          },
          {
            n: 4, tema: 'Dobramento', tempo: '5 min',
            passos: [
              'A progressão em bloco, quatro tempos cada acorde.',
              'Depois <b>arpeje</b>, segurando a nota dobrada até o acorde seguinte.',
              'Quatro voltas: duas em bloco, duas arpejadas.'
            ],
            criterio: 'Quatro voltas sem perder a nota dobrada e sem olhar o teclado.',
            acordes: ['C', 'G2/B', 'Am', 'C2/G', 'F']
          },
          {
            n: 5, tema: 'As 3 conexões', tempo: '5 min',
            passos: [
              'Saia sempre de {C}, chegue sempre em {Am}.',
              'As três conexões na versão <b>forte</b>, uma atrás da outra.',
              'Tudo de novo na versão <b>suave</b>. Ouça qual das seis serve para música lenta.'
            ],
            criterio: 'As seis versões de memória, sem consultar a página.',
            acordes: ['C', 'G/B', 'Am', 'C', 'Dm', 'Em', 'Am']
          },
          {
            n: 6, tema: 'Tríades sobre o mesmo baixo', tempo: '4 min',
            passos: [
              'Escolha um baixo. Antes de tocar, <b>diga</b> quais três tríades cabem sobre ele.',
              'Confira tocando.',
              'Ande pelos sete baixos.'
            ],
            criterio: 'Você acerta as três de cabeça, pela regra, sem olhar a tabela.',
            acordes: ['C', 'Am/C', 'F/C']
          },
          {
            n: 7, tema: 'Tríade aberta', tempo: '4 min',
            passos: [
              'Toque a tríade fechada, segure, e abra: a nota do meio sobe uma oitava.',
              'Nas três posições — fundamental, 1ª e 2ª inversão.',
              'Depois só a esquerda em 1 – 5 – 10, com a direita improvisando por cima.'
            ],
            criterio: 'As três posições abertas de {C}, {F} e {G} sem pensar em qual nota sobe.',
            acordes: ['C', 'F', 'G']
          },
          {
            n: 8, tema: 'Poliacordes', tempo: '6 min',
            passos: [
              'Sem olhar a tabela: para cada grau, <b>deduza</b> a tríade da direita pela regra e toque.',
              'Do I ao VII, quatro tempos cada. Na volta, do VII ao I.',
              'Fecha com <b>I – V – IV</b>, tríade aberta na esquerda e poliacorde na direita.'
            ],
            criterio: 'Os sete graus deduzidos na hora, sem consultar — e o fechamento soando como música, não como exercício.',
            acordes: ['C', 'Dm', 'Em', 'F', 'G4', 'Am', 'Bm']
          }
        ]
      },

      {
        tipo: 'repertorio',
        titulo: 'Onde isso aparece nas músicas', curto: 'Nas músicas', t: 2387,
        texto: 'Os padrões estão em <b>graus</b> (I, IV, V…) porque é assim que eles viajam de música para música. Barra é a nota do baixo: <b>V/3</b> é o quinto grau com a terça no baixo — no tom da página, {G/B}. As cifras seguem o tom lá de cima.',
        grupos: [
          {
            estilo: 'Worship brasileiro contemporâneo',
            nota: 'Piano segurando a harmonia sozinho: baixo parado, sus2 no lugar da tríade pura, tríade aberta para o som respirar.',
            itens: [
              {
                nome: 'Verso em baixo pedal',
                graus: 'I com o baixo parado',
                contexto: 'Intro e primeiro verso com o baixo cravado na tônica enquanto a direita troca de cor. É o som de teclado que abre quase toda música lenta de adoração.',
                aplicar: 'Sus2 e dobramento — tríade pura vira sus2, quinta dobrada para encher sem pesar.',
                acordes: ['C', 'C2/E', 'F/C', 'C2/G']
              },
              {
                nome: 'Baixo descendo — o mais usado de todos',
                graus: 'I → V/3 → vi → IV',
                contexto: 'O baixo caminha por grau conjunto ({C}, {B}, {A}, {F}) e puxa a música sozinho. Verso, pré-refrão e refrão.',
                aplicar: 'Inversão de passagem. Depois troque o V/3 por sus2: fica mais suave sem perder o caminho do baixo.',
                acordes: ['C', 'G/B', 'Am', 'F']
              },
              {
                nome: 'Refrão de celebração',
                graus: 'vi → IV → I → V',
                contexto: 'A volta clássica dos refrães de levantar. Quatro compassos, um acorde cada.',
                aplicar: 'Tríade aberta na esquerda (1 – 5 – 10) e a direita livre para a melodia.',
                acordes: ['Am', 'F', 'C', 'G']
              },
              {
                nome: 'A virada antes do refrão',
                graus: 'IV → V → vi',
                contexto: 'Dois acordes preparando a chegada. É o caminho preparado da aula, com outro nome.',
                aplicar: 'Caminho preparado, versão forte. Na suave vira ii → iii → vi.',
                acordes: ['F', 'G', 'Am']
              },
              {
                nome: 'A parada — sus4 antes de resolver',
                graus: 'V4 → V → I',
                contexto: 'A música para, o sus4 fica pendurado um ou dois compassos, e só então resolve. Fim de ponte, entrada do último refrão, final.',
                aplicar: 'Sus4 com dobramento: {G} – {C} – {D} – {G}. Segure, conte, resolva.',
                acordes: ['G4', 'G', 'C']
              },
              {
                nome: 'Espontâneo / momento de oração',
                graus: 'ii7 → I',
                contexto: 'Sem letra fixa, o teclado sustentando enquanto alguém fala ou ora. Aqui o acorde precisa ser grande e parado.',
                aplicar: 'Poliacorde: {Dm} + {C} segurando, resolvendo em {C} + {G}. O mesmo acorde da aula, tocado devagar.',
                acordes: ['Dm', 'C']
              }
            ]
          },
          {
            estilo: 'Harpa Cristã e hinos congregacionais',
            nota: 'Escrita em quatro vozes, quase tudo em tríade fechada e fundamental. O trabalho é o contrário do worship: em vez de encher, fazer o baixo caminhar sem sujar a melodia.',
            itens: [
              {
                nome: 'A cadência do hino',
                graus: 'I → IV → I → V → I',
                contexto: 'O esqueleto de quase todo hino. Do jeito que está escrito, o baixo pula — e soa quadrado.',
                aplicar: 'Inversão: IV com a tônica no baixo ({F/C}) e V com a terça ({G/B}). O baixo passa a andar por grau conjunto. Mesma harmonia, som muito mais fluido.',
                acordes: ['C', 'F/C', 'C', 'G/B', 'C']
              },
              {
                nome: 'Reharmonizar sem mexer na melodia',
                graus: 'mesmo baixo, outra tríade',
                contexto: 'A congregação canta a melodia decorada; você não pode mudar. Mas pode mudar o que está embaixo.',
                aplicar: 'A regra das três tríades sobre o mesmo baixo. Onde estiver {C}, experimente {Am/C} ou {F/C}. A melodia continua encaixando.',
                acordes: ['C', 'Am/C', 'F/C']
              },
              {
                nome: 'Introdução e final',
                graus: 'IV → V4 → V → I',
                contexto: 'Os últimos quatro compassos, mais devagar, com o sus4 segurando antes do acorde final.',
                aplicar: 'Sus4 e tríade aberta no acorde final, para o hino terminar largo em vez de apertado.',
                acordes: ['F', 'G4', 'G', 'C']
              },
              {
                nome: 'Sustentar entre as estrofes',
                graus: 'I → vi → IV → V',
                contexto: 'Aquele trecho em que você segura enquanto o povo vira a página ou o pregador fala.',
                aplicar: 'Impulso diatônico na versão suave (I → iii → vi): menos invasivo que a forte.',
                acordes: ['C', 'Em', 'Am', 'F', 'G']
              }
            ]
          }
        ],
        rodape: 'Para treinar com hino inteiro sem depender de partitura, comece pelos de domínio público — <i>Chuvas de Bênçãos</i>, <i>Castelo Forte</i>, <i>Sublime Graça</i>. Tire a melodia de ouvido, harmonize com tríade fundamental e refaça usando só inversões.'
      }
    ]
  },

  /* ---------- Aulas 2 a 12: ainda por vir ---------- */
  { numero: 2,  id: 'aula-02', titulo: 'Aula 2',  pendente: true },
  { numero: 3,  id: 'aula-03', titulo: 'Aula 3',  pendente: true },
  { numero: 4,  id: 'aula-04', titulo: 'Aula 4',  pendente: true },
  { numero: 5,  id: 'aula-05', titulo: 'Aula 5',  pendente: true },
  { numero: 6,  id: 'aula-06', titulo: 'Aula 6',  pendente: true },
  { numero: 7,  id: 'aula-07', titulo: 'Aula 7',  pendente: true },
  { numero: 8,  id: 'aula-08', titulo: 'Aula 8',  pendente: true },
  { numero: 9,  id: 'aula-09', titulo: 'Aula 9',  pendente: true },
  { numero: 10, id: 'aula-10', titulo: 'Aula 10', pendente: true },
  { numero: 11, id: 'aula-11', titulo: 'Aula 11', pendente: true },
  { numero: 12, id: 'aula-12', titulo: 'Aula 12', pendente: true }
];

if (typeof module !== 'undefined' && module.exports) module.exports = AULAS;
