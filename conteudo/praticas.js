/* ===========================================================
   Harmonia Prime · chunks e micropráticas
   -----------------------------------------------------------
   Este arquivo é o oposto de conteudo/aulas.js.

   Lá fica a aula inteira, para consulta. Aqui fica a aula
   quebrada em pequenas vitórias de cinco minutos, uma por vez.

   CHUNK      = uma unidade de vocabulário musical (um som).
   MICROPRÁTICA = um jeito de colocar esse som debaixo dos dedos
                  hoje, em cinco minutos.

   Um chunk rende várias micropráticas: ouvir, automatizar, usar
   dentro de uma progressão maior, levar para outro tom, aplicar
   numa música. Isso é desejável: o conteúdo não é para ser
   consumido rápido.

   A ORDEM DO ARRAY MICROPRATICAS É A FILA. Ela segue resultado
   musical, não a ordem teórica da apostila: som interessante
   primeiro, explicação depois.

   Cifras sempre escritas em dó. O campo `tom` transpõe a prática
   inteira na hora de mostrar (é assim que a mesma ideia vira
   prática nova em outro tom).

   -----------------------------------------------------------
   Chunk
   { id, aula, conceito, nome, progressao, objetivoSonoro, dificuldade }

   MicroPratica
   { id, chunkId, titulo, duracao, tipo, tom,
     aprende,            // o que muda no som, uma frase
     antes, depois,      // opcional: o par que aparece na home
     passos: [ { texto, linhas:[{rotulo, acordes}], nota, video, musica } ],
     criterio,           // guardado, não vira cobrança na tela
     depende: [ idsDeMicropraticas ] }

   tipo: 'tocar' (padrão) | 'ouvir' | 'video' | 'musica'
   =========================================================== */

var CHUNKS = [
  {
    id: 'a1-baixo-descendente',
    aula: 1,
    conceito: 'inversao',
    nome: 'Baixo descendente',
    progressao: ['C', 'G/B', 'Am'],
    objetivoSonoro: 'O baixo desce de grau em grau e puxa a música sozinho.',
    dificuldade: 1
  },
  {
    id: 'a1-g2b',
    aula: 1,
    conceito: 'sus2',
    nome: 'V/3 com sus2',
    progressao: ['C', 'G2/B', 'Am'],
    objetivoSonoro: 'O mesmo caminho do baixo, com uma cor mais aberta em cima.',
    dificuldade: 1
  },
  {
    id: 'a1-v4-v-i',
    aula: 1,
    conceito: 'sus4',
    nome: 'Suspensão e resolução',
    progressao: ['G4', 'G', 'C'],
    objetivoSonoro: 'A música para, fica pendurada, e só então resolve.',
    dificuldade: 1
  },
  {
    id: 'a1-pedal',
    aula: 1,
    conceito: 'pedal',
    nome: 'Baixo cravado',
    progressao: ['C', 'C2', 'F/C', 'C'],
    objetivoSonoro: 'A esquerda não sai do lugar e a direita troca de cor por cima.',
    dificuldade: 1
  },
  {
    id: 'a1-mesmo-baixo',
    aula: 1,
    conceito: 'mesmoBaixo',
    nome: 'Três tríades, um baixo',
    progressao: ['C', 'Am/C', 'F/C'],
    objetivoSonoro: 'A melodia continua encaixando e a harmonia muda embaixo dela.',
    dificuldade: 2
  },
  {
    id: 'a1-dobramento',
    aula: 1,
    conceito: 'dobramento',
    nome: 'Dobrar a quinta',
    progressao: ['C', 'G2/B', 'Am', 'C2/G', 'F'],
    objetivoSonoro: 'O acorde engorda sem mudar de cor e sobra nota para arpejar.',
    dificuldade: 2
  },
  {
    id: 'a1-triade-aberta',
    aula: 1,
    conceito: 'triadeAberta',
    nome: 'Tríade aberta (1 · 5 · 10)',
    progressao: ['C', 'F', 'G'],
    objetivoSonoro: 'As mesmas três notas, agora respirando, com a direita livre.',
    dificuldade: 2
  },
  {
    id: 'a1-conexoes',
    aula: 1,
    conceito: 'conexoes',
    nome: 'Caminho preparado',
    progressao: ['C', 'F', 'G', 'Am'],
    objetivoSonoro: 'Dois acordes preparando a chegada em vez de um pulo seco.',
    dificuldade: 2
  },
  {
    id: 'a1-poliacorde',
    aula: 1,
    conceito: 'poliacorde',
    nome: 'Duas tríades, um acorde',
    progressao: ['Dm', 'C'],
    objetivoSonoro: 'Cinco ou seis notas soando grandes e paradas, por regra.',
    dificuldade: 3
  },
  {
    id: 'a1-sensacao',
    aula: 1,
    conceito: 'sensacoes',
    nome: 'Sensação antes do nome',
    progressao: ['C', 'Am', 'F', 'G'],
    objetivoSonoro: 'Reconhecer a cor do acorde sem passar pela etiqueta.',
    dificuldade: 1
  }
];

var MICROPRATICAS = [

  /* ---------- 1. o baixo que desce ---------- */

  {
    id: 'mp-baixo-desc-ouvir',
    chunkId: 'a1-baixo-descendente',
    titulo: 'O baixo que desce sozinho',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Trocar o {G} de baixo cheio pelo {G/B}: o baixo passa a andar de grau em grau, {C} · {B} · {A}, e a progressão anda sem empurrão.',
    antes: ['C', 'G', 'Am'],
    depois: ['C', 'G/B', 'Am'],
    passos: [
      {
        texto: 'Toque as duas versões, devagar, uma atrás da outra.',
        linhas: [
          { rotulo: 'como quase todo mundo toca', acordes: ['C', 'G', 'Am'] },
          { rotulo: 'com o baixo caminhando', acordes: ['C', 'G/B', 'Am'] }
        ],
        nota: 'A mão direita pode ficar praticamente parada. Quem muda é o baixo.'
      },
      {
        texto: 'Agora só a segunda versão.',
        linhas: [{ acordes: ['C', 'G/B', 'Am'] }],
        nota: 'Repita algumas vezes. Não acrescente nada.'
      },
      {
        texto: 'Repita mantendo o pulso, quatro tempos em cada acorde.',
        linhas: [{ acordes: ['C', 'G/B', 'Am'] }],
        nota: 'Se a troca atrasar, diminua a velocidade até ela caber no tempo.'
      },
      {
        texto: 'Três voltas sem olhar para a cifra.',
        nota: 'Se precisar olhar de novo, tudo bem. A ideia é a mão começar a reconhecer o caminho.'
      }
    ],
    criterio: 'As três trocas dentro do pulso, sem reajustar a mão direita.'
  },

  /* ---------- 2. a cor do sus2 ---------- */

  {
    id: 'mp-g2b-ouvir',
    chunkId: 'a1-g2b',
    titulo: 'Uma troca que muda a cor',
    duracao: 5,
    tipo: 'ouvir',
    aprende: 'Tirar a terça do {G/B} e transformá-lo em {G2/B}. O caminho do baixo continua igual, a sonoridade abre.',
    antes: ['C', 'G/B', 'Am'],
    depois: ['C', 'G2/B', 'Am'],
    depende: ['mp-baixo-desc-ouvir'],
    passos: [
      {
        texto: 'Toque lentamente:',
        linhas: [{ acordes: ['C', 'G/B', 'Am'] }]
      },
      {
        texto: 'Depois toque:',
        linhas: [{ acordes: ['C', 'G2/B', 'Am'] }],
        nota: 'Ouça a diferença. Muda um dedo só.'
      },
      {
        texto: 'Alterne os dois, quatro tempos cada, sem pressa.',
        linhas: [
          { rotulo: 'antes', acordes: ['C', 'G/B', 'Am'] },
          { rotulo: 'depois', acordes: ['C', 'G2/B', 'Am'] }
        ],
        nota: 'Repare que o segundo não fecha a frase: ele fica de passagem, esperando.'
      },
      {
        texto: 'Por último, só ouça: toque o par e escolha qual dos dois você quer no seu som.',
        nota: 'Hoje não precisa decidir nada além disso.'
      }
    ],
    criterio: 'Descrever a diferença entre os dois em voz alta, sem falar teoria.'
  },

  {
    id: 'mp-g2b-tocar',
    chunkId: 'a1-g2b',
    titulo: 'Deixar o G2/B na mão',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Automatizar {C} → {G2/B} → {Am} até a mão achar sozinha.',
    antes: ['C', 'G/B', 'Am'],
    depois: ['C', 'G2/B', 'Am'],
    depende: ['mp-g2b-ouvir'],
    passos: [
      {
        texto: 'Agora faça somente:',
        linhas: [{ acordes: ['C', 'G2/B', 'Am'] }],
        nota: 'Repita algumas vezes. Não acrescente nenhuma outra técnica.'
      },
      {
        texto: 'De novo, quatro tempos em cada acorde, sem interromper o pulso.',
        linhas: [{ acordes: ['C', 'G2/B', 'Am'] }]
      },
      {
        texto: 'Três voltas sem olhar para a cifra.',
        nota: 'Se precisar olhar novamente, tudo bem. O objetivo não é testar sua memória.'
      }
    ],
    criterio: 'Três voltas seguidas sem consultar a cifra.'
  },

  {
    id: 'mp-g2b-quatro',
    chunkId: 'a1-g2b',
    titulo: 'O caminho inteiro, com o IV no fim',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Levar o {G2/B} para dentro do giro mais usado do worship: I → V/3 → vi → IV.',
    antes: ['C', 'G/B', 'Am', 'F'],
    depois: ['C', 'G2/B', 'Am', 'F'],
    depende: ['mp-g2b-tocar'],
    passos: [
      {
        texto: 'Retome o que já está na mão:',
        linhas: [{ acordes: ['C', 'G2/B', 'Am'] }]
      },
      {
        texto: 'Agora acrescente o IV grau:',
        linhas: [{ acordes: ['C', 'G2/B', 'Am', 'F'] }],
        nota: 'Toque devagar e procure fazer as trocas sem interromper o pulso.'
      },
      {
        texto: 'Três voltas seguidas, emendando o {F} de volta no {C}.',
        linhas: [{ acordes: ['C', 'G2/B', 'Am', 'F'] }],
        nota: 'É o giro de quase toda música lenta de adoração. Ele volta ao começo sozinho.'
      }
    ],
    criterio: 'A volta emendada três vezes sem parar entre o F e o C.'
  },

  /* ---------- 3. a parada ---------- */

  {
    id: 'mp-v4-parada',
    chunkId: 'a1-v4-v-i',
    titulo: 'A parada antes de resolver',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Pendurar a música num {G4} e só depois resolver em {G} e {C}. É o fim de ponte e a entrada do último refrão.',
    antes: ['G', 'C'],
    depois: ['G4', 'G', 'C'],
    depende: ['mp-g2b-ouvir'],
    passos: [
      {
        texto: 'Toque como você já faria:',
        linhas: [{ acordes: ['G', 'C'] }]
      },
      {
        texto: 'Agora segure o sus4 antes:',
        linhas: [{ acordes: ['G4', 'G', 'C'] }],
        nota: 'Conte quatro tempos no {G4}. Ele fica pendurado de propósito.'
      },
      {
        texto: 'Repita segurando mais: oito tempos no {G4}, depois resolva.',
        linhas: [{ acordes: ['G4', 'G', 'C'] }],
        nota: 'Quanto mais você segura, mais a resolução vale.'
      },
      {
        texto: 'Três voltas sem olhar para a cifra.',
        nota: 'Só o dedo do meio se mexe na hora de resolver.'
      }
    ],
    criterio: 'Segurar o sus4 sem pressa e resolver dentro do tempo.'
  },

  /* ---------- 4. o baixo que não sai do lugar ---------- */

  {
    id: 'mp-pedal',
    chunkId: 'a1-pedal',
    titulo: 'A esquerda parada, a direita colorindo',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Cravar {C} no baixo e trocar só a cor por cima. É o som de teclado que abre música lenta.',
    antes: ['C', 'F', 'C'],
    depois: ['C', 'C2', 'F/C', 'C'],
    depende: ['mp-g2b-tocar'],
    passos: [
      {
        texto: 'Deixe a mão esquerda no {C} e não tire mais.',
        linhas: [{ acordes: ['C', 'C2', 'F/C', 'C'] }],
        nota: 'Só a direita se move. O chão fica.'
      },
      {
        texto: 'Repita bem devagar, dois tempos em cada.',
        linhas: [{ acordes: ['C', 'C2', 'F/C', 'C'] }]
      },
      {
        texto: 'Agora arpeje a direita enquanto a esquerda segura.',
        nota: 'Não precisa de ritmo definido. Deixe soar.'
      }
    ],
    criterio: 'A esquerda não sai do dó durante a volta inteira.'
  },

  /* ---------- 5. copiar o professor ---------- */

  {
    id: 'mp-video-sus2',
    chunkId: 'a1-g2b',
    titulo: 'Copiar o professor, sem entender ainda',
    duracao: 5,
    tipo: 'video',
    aprende: 'Hoje você não cria nada. Assiste a um trecho curto e copia exatamente o que ele fez.',
    progressao: ['C2/E', 'F2/A', 'G2/B'],
    depende: ['mp-g2b-quatro'],
    passos: [
      {
        texto: 'Assista a estes segundos. Só isso.',
        video: { inicio: 236, fim: 268 },
        nota: 'Se precisar, veja duas ou três vezes.'
      },
      {
        texto: 'Agora copie no teclado, do jeito que você ouviu.',
        linhas: [
          { rotulo: 'antes', acordes: ['C/E', 'Am', 'Bmb5'] },
          { rotulo: 'depois', acordes: ['C2/E', 'F2/A', 'G2/B'] }
        ],
        nota: 'Ainda não precisa saber por quê.'
      },
      {
        texto: 'Agora vamos descobrir o que aconteceu: nos três, a terça saiu e entrou a segunda.',
        nota: 'Sem terça o acorde perde o gênero e para de brigar com a melodia.'
      }
    ],
    criterio: 'Reproduzir o trecho de ouvido antes de qualquer explicação.'
  },

  /* ---------- 6. reharmonizar sem mexer na melodia ---------- */

  {
    id: 'mp-mesmo-baixo',
    chunkId: 'a1-mesmo-baixo',
    titulo: 'Trocar o acorde e manter o baixo',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Sobre o baixo dó cabem três tríades: {C}, {Am/C} e {F/C}. A melodia continua encaixando nas três.',
    antes: ['C', 'C', 'C'],
    depois: ['C', 'Am/C', 'F/C'],
    depende: ['mp-pedal'],
    passos: [
      {
        texto: 'Toque as três, ouvindo o baixo continuar igual.',
        linhas: [{ acordes: ['C', 'Am/C', 'F/C'] }],
        nota: 'Dó é fundamental de uma, terça de outra e quinta da terceira.'
      },
      {
        texto: 'Segure uma nota da melodia na mão direita e passeie pelas três embaixo dela.',
        linhas: [{ acordes: ['C', 'Am/C', 'F/C'] }],
        nota: 'É assim que se reharmoniza um hino sem tirar a congregação do lugar.'
      },
      {
        texto: 'Escolha a que você mais gostou e toque só ela três vezes.',
        nota: 'Uma cor nova por dia já é bastante.'
      }
    ],
    criterio: 'Dizer as três tríades de cabeça, pela regra, antes de tocar.'
  },

  /* ---------- 7. engordar sem pesar ---------- */

  {
    id: 'mp-dobramento',
    chunkId: 'a1-dobramento',
    titulo: 'Engordar o acorde sem pesar',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Repetir a quinta uma oitava acima. Nunca a terça: dobrada, ela embola.',
    antes: ['C', 'G2/B', 'Am'],
    depois: ['C', 'G2/B', 'Am', 'C2/G', 'F'],
    depende: ['mp-g2b-quatro'],
    passos: [
      {
        texto: 'A progressão em bloco, quatro tempos em cada acorde.',
        linhas: [{ acordes: ['C', 'G2/B', 'Am', 'C2/G', 'F'] }],
        nota: 'Em cada acorde, repita a quinta uma oitava acima.'
      },
      {
        texto: 'Agora arpeje, segurando a nota dobrada até o acorde seguinte.',
        linhas: [{ acordes: ['C', 'G2/B', 'Am', 'C2/G', 'F'] }]
      },
      {
        texto: 'Duas voltas em bloco e duas arpejadas.',
        nota: 'A nota dobrada é o que deixa o arpejo com o que segurar.'
      }
    ],
    criterio: 'Quatro voltas sem perder a nota dobrada.'
  },

  /* ---------- 8. abrir o som ---------- */

  {
    id: 'mp-triade-aberta',
    chunkId: 'a1-triade-aberta',
    titulo: 'Abrir a tríade e deixar respirar',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Pegar a nota do meio e subir uma oitava. As mesmas três notas, com ar entre elas.',
    antes: ['C'],
    depois: ['C', 'F', 'G'],
    depende: ['mp-mesmo-baixo'],
    passos: [
      {
        texto: 'Toque o {C} fechado, segure e abra: a nota do meio sobe uma oitava.',
        linhas: [
          { rotulo: 'fechada', acordes: [{ cifra: 'C', notas: ['C4', 'E4', 'G4'] }] },
          { rotulo: 'aberta', acordes: [{ cifra: 'C', notas: ['C4', 'G4', 'E5'] }] }
        ],
        nota: 'A terça vira décima. Daí o nome 1 · 5 · 10.'
      },
      {
        texto: 'Faça o mesmo em {F} e em {G}.',
        linhas: [{
          acordes: [
            { cifra: 'F', notas: ['F4', 'C5', 'A5'] },
            { cifra: 'G', notas: ['G4', 'D5', 'B5'] }
          ]
        }],
        nota: 'É uma forma só, com três entradas.'
      },
      {
        texto: 'Agora só a esquerda em 1 · 5 · 10, com a direita improvisando por cima.',
        nota: 'Duas ou três notas na direita bastam. A esquerda já disse qual é o acorde.'
      }
    ],
    criterio: 'As três abertas sem pensar em qual nota sobe.'
  },

  /* ---------- 9. o mesmo som em outra progressão ---------- */

  {
    id: 'mp-g2b-hino',
    chunkId: 'a1-baixo-descendente',
    titulo: 'A cadência do hino, com o baixo andando',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'No hino escrito o baixo pula e soa quadrado. Invertendo o IV e o V ele passa a caminhar.',
    antes: ['C', 'F', 'C', 'G', 'C'],
    depois: ['C', 'F/C', 'C', 'G/B', 'C'],
    depende: ['mp-triade-aberta'],
    passos: [
      {
        texto: 'Toque como está escrito no hinário:',
        linhas: [{ acordes: ['C', 'F', 'C', 'G', 'C'] }],
        nota: 'Repare no pulo do baixo.'
      },
      {
        texto: 'Agora com as inversões:',
        linhas: [{ acordes: ['C', 'F/C', 'C', 'G/B', 'C'] }],
        nota: 'Mesma harmonia, baixo por grau conjunto.'
      },
      {
        texto: 'Três voltas na segunda versão, devagar.',
        nota: 'Serve em qualquer hino que termine em I → IV → I → V → I.'
      }
    ],
    criterio: 'A versão invertida saindo antes da escrita, por hábito.'
  },

  /* ---------- 10. levar para a música ---------- */

  {
    id: 'mp-g2b-musica',
    chunkId: 'a1-g2b',
    titulo: 'Colocar numa música que você já toca',
    duracao: 5,
    tipo: 'musica',
    aprende: 'A música continua 90% como você já tocava e recebe uma ideia nova, em um lugar só.',
    depende: ['mp-video-sus2'],
    passos: [
      {
        texto: 'Escolha uma música que você já toca e que tenha I → V/3 → vi.',
        nota: 'No tom de dó: {C} → {G/B} → {Am}. Serve qualquer música lenta que você já saiba.'
      },
      {
        texto: 'Toque normalmente, do começo ao fim do trecho.',
        nota: 'Sem mudar nada ainda.'
      },
      {
        texto: 'Agora toque de novo e, só naquele ponto, use o {G2/B}.',
        linhas: [{ acordes: ['C', 'G2/B', 'Am'] }],
        nota: 'Uma ideia nova numa música inteira já conta como progresso.'
      },
      {
        texto: 'Se quiser achar o ponto exato numa cifra, a biblioteca marca para você.',
        musica: true
      }
    ],
    criterio: 'Uma música real tocada com a sonoridade nova em pelo menos um ponto.'
  },

  /* ---------- 11. conexões ---------- */

  {
    id: 'mp-conexao-preparada',
    chunkId: 'a1-conexoes',
    titulo: 'Dois acordes preparando a chegada',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Em vez de pular de {C} para {Am}, passar por {F} e {G}. É a virada antes do refrão.',
    antes: ['C', 'Am'],
    depois: ['C', 'F', 'G', 'Am'],
    depende: ['mp-dobramento'],
    passos: [
      {
        texto: 'Toque o pulo seco:',
        linhas: [{ acordes: ['C', 'Am'] }]
      },
      {
        texto: 'Agora prepare a chegada:',
        linhas: [{ acordes: ['C', 'F', 'G', 'Am'] }],
        nota: 'O {G} empurra. Você sente que o {Am} vem antes de ele chegar.'
      },
      {
        texto: 'Repita saindo sempre de {C} e chegando sempre em {Am}.',
        linhas: [{ acordes: ['C', 'F', 'G', 'Am'] }],
        nota: 'Esse é o caminho preparado na versão forte.'
      }
    ],
    criterio: 'A conexão saindo de memória, sem consultar.'
  },

  {
    id: 'mp-conexao-suave',
    chunkId: 'a1-conexoes',
    titulo: 'A mesma chegada, sem empurrão',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'A versão suave da mesma conexão: o baixo anda por grau conjunto e ninguém empurra.',
    antes: ['C', 'F', 'G', 'Am'],
    depois: ['C', 'Dm', 'Em', 'Am'],
    depende: ['mp-conexao-preparada'],
    passos: [
      {
        texto: 'Relembre a versão forte:',
        linhas: [{ acordes: ['C', 'F', 'G', 'Am'] }]
      },
      {
        texto: 'Agora a suave:',
        linhas: [{ acordes: ['C', 'Dm', 'Em', 'Am'] }],
        nota: 'O baixo sobe de grau em grau e o som fica menos invasivo.'
      },
      {
        texto: 'Toque as duas em seguida e escolha qual serve para música lenta.',
        linhas: [
          { rotulo: 'forte', acordes: ['C', 'F', 'G', 'Am'] },
          { rotulo: 'suave', acordes: ['C', 'Dm', 'Em', 'Am'] }
        ]
      }
    ],
    criterio: 'As duas versões de memória, com a escolha feita de ouvido.'
  },

  /* ---------- 12. outro tom ---------- */

  {
    id: 'mp-g2b-outro-tom',
    chunkId: 'a1-g2b',
    titulo: 'A mesma cor, em outro tom',
    duracao: 5,
    tipo: 'tocar',
    tom: 'G',
    aprende: 'O mesmo som que já está na mão, agora em sol. O desenho é o mesmo, o lugar muda.',
    antes: ['C', 'G/B', 'Am'],
    depois: ['C', 'G2/B', 'Am'],
    depende: ['mp-g2b-musica'],
    passos: [
      {
        texto: 'Comece pelo caminho simples, no tom novo:',
        linhas: [{ acordes: ['C', 'G/B', 'Am'] }],
        nota: 'É o mesmo desenho de dedo, deslocado.'
      },
      {
        texto: 'Agora com a cor que você já conhece:',
        linhas: [{ acordes: ['C', 'G2/B', 'Am'] }]
      },
      {
        texto: 'Três voltas, devagar, deixando a mão achar o lugar.',
        nota: 'Estranhar no começo é normal. Em dó também estranhou.'
      }
    ],
    criterio: 'A progressão inteira no tom novo, sem traduzir mentalmente a partir de dó.'
  },

  /* ---------- 13. o refrão que levanta ---------- */

  {
    id: 'mp-refrao-aberto',
    chunkId: 'a1-triade-aberta',
    titulo: 'O refrão de levantar, com a esquerda aberta',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'A volta clássica de refrão com 1 · 5 · 10 na esquerda e a direita livre para a melodia.',
    progressao: ['Am', 'F', 'C', 'G'],
    depende: ['mp-conexao-suave'],
    passos: [
      {
        texto: 'Toque a volta em tríade fechada, um acorde por compasso.',
        linhas: [{ acordes: ['Am', 'F', 'C', 'G'] }]
      },
      {
        texto: 'Agora só a esquerda, em 1 · 5 · 10, com a direita cantando a melodia.',
        linhas: [{
          acordes: [
            { cifra: 'Am', esquerda: ['A3', 'E4', 'C5'] },
            { cifra: 'F', esquerda: ['F3', 'C4', 'A4'] },
            { cifra: 'C', esquerda: ['C4', 'G4', 'E5'] },
            { cifra: 'G', esquerda: ['G3', 'D4', 'B4'] }
          ]
        }],
        nota: 'A esquerda sozinha já entrega o acorde. A direita não precisa repetir.'
      },
      {
        texto: 'Três voltas, procurando não fechar a mão direita.',
        nota: 'Se travar, volte para a tríade fechada por uma volta e abra de novo.'
      }
    ],
    criterio: 'Quatro compassos com a esquerda aberta e a direita solta.'
  },

  /* ---------- 14. poliacorde ---------- */

  {
    id: 'mp-poliacorde',
    chunkId: 'a1-poliacorde',
    titulo: 'Duas tríades viram um acorde grande',
    duracao: 5,
    tipo: 'tocar',
    aprende: 'Tríade na esquerda mais tríade na direita. Menor pede a de um tom abaixo; maior pede a da quinta acima.',
    progressao: [{ lh: 'Dm', rh: 'C', cifra: 'Dm7(9/11)' }, { lh: 'C', rh: 'G', cifra: 'C7M(9)' }],
    depende: ['mp-refrao-aberto'],
    passos: [
      {
        texto: 'Toque {Dm} na esquerda e {C} na direita, ao mesmo tempo.',
        linhas: [{ acordes: [{ lh: 'Dm', rh: 'C', cifra: 'Dm7(9/11)' }] }],
        nota: 'Menor pede a tríade um tom abaixo, que entrega a sétima menor.'
      },
      {
        texto: 'Agora {C} na esquerda e {G} na direita.',
        linhas: [{ acordes: [{ lh: 'C', rh: 'G', cifra: 'C7M(9)' }] }],
        nota: 'Maior pede a tríade da quinta acima. Traz a sétima maior e a nona.'
      },
      {
        texto: 'Alterne os dois devagar, segurando cada um.',
        nota: 'É o acorde de espontâneo, de momento de oração. Grande e parado.'
      }
    ],
    criterio: 'Os dois poliacordes deduzidos pela regra, sem consultar tabela.'
  },

  /* ---------- 15. sensação ---------- */

  {
    id: 'mp-sensacao',
    chunkId: 'a1-sensacao',
    titulo: 'A sensação antes do nome',
    duracao: 5,
    tipo: 'ouvir',
    aprende: 'Recuperar a cor do acorde direto, sem passar pela etiqueta do nome.',
    depende: ['mp-poliacorde'],
    passos: [
      {
        texto: 'Toque e espere o som acabar antes de pensar no nome.',
        linhas: [{ acordes: ['C', 'Am', 'F', 'G'] }]
      },
      {
        texto: 'Diga a sensação em voz alta primeiro: descanso, saudade, expectativa, tensão.',
        nota: 'Só depois nomeie a cifra.'
      },
      {
        texto: 'Repita fora de ordem, tocando um acorde de cada vez.',
        linhas: [{ acordes: ['F', 'C', 'G', 'Am'] }],
        nota: 'Quatro sensações descritas antes de qualquer nome aparecer já basta por hoje.'
      }
    ],
    criterio: 'Quatro sensações diferentes descritas antes de qualquer nome.'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHUNKS: CHUNKS, MICROPRATICAS: MICROPRATICAS };
}
