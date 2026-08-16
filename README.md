# Harmonia Prime · treinador de prática

Duas personalidades no mesmo site.

**Hoje** é a tela inicial: uma microprática de cinco minutos, uma decisão só.
Sem lista de exercícios, sem fila, sem contador de pendências. Só aparece
prática nova depois que a atual for marcada como praticada, e mesmo assim
apenas se você pedir.

**Biblioteca** é onde mora tudo: as 12 aulas, anotações, conceitos, exercícios,
vídeo, repertório, e o "aplicar numa música". Fica atrás de um clique.

Não tem build, não tem dependência, não tem servidor. É só HTML, CSS e JavaScript.

```
index.html             as duas telas
css/estilo.css         visual
js/musica.js           teoria (cifras, transposição, condução de vozes) + piano
js/teclado.js          desenho do teclado em SVG
js/cifras.js           busca e leitura de cifras de fora
js/aplicar.js          análise da música e detectores de conceito
js/treinador.js        escolhe a prática do dia e guarda o histórico
js/hoje.js             a tela Hoje: cartão, passos, encerramento
js/app.js              biblioteca, roteamento e componentes musicais
conteudo/aulas.js      👈 o conteúdo das aulas
conteudo/praticas.js   👈 as micropráticas de cinco minutos
ferramentas/           checagem musical das micropráticas (node)
```

---

## Como a tela Hoje funciona

1. Abre e mostra **uma** microprática: título, progressão, o que ela muda no som.
2. "Começar prática" conduz passo a passo, um de cada vez, com as cifras
   tocáveis e um teclado mostrando onde ficam os dedos.
3. No fim pergunta: **você realmente praticou isso no teclado?**
   - *Não pratiquei*: nada muda. A mesma prática continua esperando, sem cobrança.
   - *Sim, pratiquei*: registra, e aparece **✓ Feito por hoje** com o botão
     principal **Encerrar**. "Quero fazer mais uma" fica pequeno, do lado.
4. O "como foi?" (🙂 😐 😣) é um clique e altera o que vem depois: *travei*
   repete a mesma; *ainda estranho* traz o mesmo som em outra progressão;
   *saiu legal* segue adiante.

Cinco minutos contam como sessão completa. O aplicativo nunca sugere o contrário.

### Regra de escolha da próxima

Em ordem: reforço do que ficou estranho ontem → reencontro discreto de algo
antigo (uma a cada quatro sessões) → a próxima da fila curada em
`conteudo/praticas.js` → a menos praticada, quando o conteúdo novo acabar.

A ordem do array `MICROPRATICAS` é a fila, e ela segue resultado musical, não a
ordem teórica da apostila. Uma prática só entra quando o que ela pressupõe
(`depende`) já foi feito pelo menos uma vez.

Tudo fica em `localStorage`, na chave `hp-treinador`. Para começar do zero:
`Treinador.apagarTudo()` no console.

---

## Escrever uma microprática nova

Em `conteudo/praticas.js`. Um **chunk** é um som; uma **microprática** é um jeito
de colocar esse som debaixo dos dedos hoje.

```js
{
  id: 'mp-g2b-tocar',
  chunkId: 'a1-g2b',
  titulo: 'Deixar o G2/B na mão',
  duracao: 5,
  tipo: 'tocar',              // tocar | ouvir | video | musica
  tom: 'G',                   // opcional: transpõe a prática inteira
  aprende: 'Automatizar {C} → {G2/B} → {Am} até a mão achar sozinha.',
  antes: ['C', 'G/B', 'Am'],  // opcional: o par que aparece no cartão
  depois: ['C', 'G2/B', 'Am'],
  depende: ['mp-g2b-ouvir'],
  passos: [
    {
      texto: 'Agora faça somente:',
      linhas: [{ rotulo: 'depois', acordes: ['C', 'G2/B', 'Am'] }],
      nota: 'Repita algumas vezes. Não acrescente nenhuma outra técnica.'
    }
  ],
  criterio: 'Três voltas seguidas sem consultar a cifra.'
}
```

As cifras se escrevem **sempre em dó**; `tom` transpõe na hora de mostrar. Dá
para mandar o voicing exato (`{ cifra: 'C', notas: ['C4','G4','E5'] }`), separar
as mãos (`esquerda`, `direita`) ou pedir um poliacorde (`{ lh: 'Dm', rh: 'C' }`).

Um passo pode ainda trazer:

- `video: { inicio: 236, fim: 268 }`: abre o trecho da aula para copiar o
  professor antes de entender. O vídeo vem da aula do chunk.
- `musica: true`: botão que leva ao buscador de cifras da biblioteca.

`criterio` fica guardado no dado e **não** vira cobrança na tela: a prática
termina quando os cinco minutos terminam.

Três regras ao escrever:

1. Uma microprática, uma vitória. Se couber duas técnicas, são duas práticas.
2. Um conceito rende vários dias: ouvir, automatizar, usar numa progressão
   maior, levar para outro tom, aplicar numa música.
3. Som primeiro, explicação depois.

---


## Aplicar numa música

Na biblioteca, no fim de cada aula, tem a seção **Aplicar numa música**. Busque qualquer música,
escolha um conceito da aula e o caderno marca, acorde por acorde, onde ele cabe,
com a sugestão pronta. O tom da música é independente do tom da página.

A busca usa o acervo do Cifra Club. Se a importação automática falhar, o campo
*colar a cifra* funciona igual, com qualquer cifra de qualquer lugar.

Para tirar do papel e levar ao teclado:

- O **▶ ouvir** de cada dica toca o trecho como está escrito e, em seguida,
  com a dica aplicada, para o ouvido aprender junto.
- O play de cada parte vira **play-along**: segue o BPM da barra de treino,
  acende o acorde da vez e pode repetir em loop até a mão decorar.
- O **modo pergunta** esconde as cifras e mostra só os graus; você deduz o
  acorde e clica para conferir e tocar.
- A seção de exercícios da aula tem **rotina cronometrada** (completa ou
  curta): o caderno conduz exercício por exercício e guarda no navegador os
  minutos praticados por dia.

Quais conceitos aparecem em cada aula vem do campo `aplicar` da aula:

```js
aplicar: ['pedal', 'sus2', 'sus4', 'dobramento', 'inversao',
          'conexoes', 'mesmoBaixo', 'triadeAberta', 'poliacorde']
```

Cada id é um detector em `js/aplicar.js`, com o nome, o resumo, o segundo do
vídeo onde o assunto aparece e a regra que acha os lugares na música. Aula nova
que ensina conceito novo ganha um detector novo ali.

---

## Onde o site fica no ar

**Vercel (endereço principal):** <https://harmonia-jade-omega.vercel.app>

O projeto está ligado ao repositório `miqueiasjed/harmoniaprime`. Todo `git
push` na `main` publica sozinho, em cerca de um minuto. Não tem build: a Vercel
serve os arquivos da raiz como estão (preset *Other*).

O `.vercelignore` mantém fora do ar o que é ferramenta de quem escreve o
conteúdo: `.claude/`, `ferramentas/`, `ERROS.md` e `README.md`.

**GitHub Pages (endereço antigo):** <https://miqueiasjed.github.io/harmoniaprime/>

Serve a mesma `main` e continua funcionando. Use um endereço só: o histórico de
prática mora no `localStorage`, que é preso à origem, então marcar uma prática
em um dos dois endereços não aparece no outro.

O arquivo vazio `.nojekyll` na raiz é do Pages, para servir os arquivos sem
passar pelo Jekyll.

### No celular

Abra o endereço e adicione à tela de início. Além de virar app, o Safari do
iPhone apaga dados de sites que ficam sete dias sem uso; instalado na tela de
início, o histórico de prática não cai nessa regra.

---

## Sincronizar entre aparelhos

O `localStorage` é preso ao aparelho: praticar no celular não aparece no
computador. Quem resolve isso é uma tabela no Supabase, com entrada pelo Google.

O app **continua abrindo e funcionando sem nada disso**. Enquanto
`js/config.js` estiver vazio, o botão de sincronizar nem aparece e o navegador
segue sendo o único lugar onde o histórico mora.

### Como o histórico se junta

O navegador continua sendo a fonte de leitura: a tela nunca espera resposta de
servidor para aparecer, e praticar sem internet funciona. A nuvem é espelho.

Ao entrar, o que está no aparelho e o que está no servidor são **mesclados**,
nunca sobrescritos. Isso é possível porque o histórico é um log de sessões
carimbadas com a hora: juntar dois aparelhos é unir dois conjuntos, e os
contadores de cada microprática saem recalculados desse log. Praticar no
celular no avião e depois abrir o computador soma as duas coisas.

Depois disso, cada prática registrada sobe sozinha dois segundos depois, e
também quando o app vai para segundo plano.

### Ligar (uma vez só)

**1. Supabase.** Crie um projeto e rode `sql/001_progresso.sql` no SQL Editor.
Ele cria a tabela `progresso` com Row Level Security: cada pessoa só enxerga a
própria linha.

**2. Google Cloud Console** → *APIs & Services* → *Credentials* → *Create
credentials* → *OAuth client ID* → *Web application*:

- *Authorized JavaScript origins*: `https://harmonia-jade-omega.vercel.app` e
  `http://localhost:8899`
- *Authorized redirect URIs*: `https://SEU-REF.supabase.co/auth/v1/callback`

Guarde o **Client ID** e o **Client Secret**.

**3. Supabase** → *Authentication* → *Sign In / Providers* → *Google*: ligue,
cole o Client ID e o Client Secret. No campo **Authorized Client IDs** cole o
mesmo Client ID (é o que libera a entrada sem sair da página).

**4. `js/config.js`**: preencha `supabaseUrl`, `supabaseKey` (a publishable
key, em *Project Settings › Data API*) e `googleClientId`.

A publishable key é pública por natureza e pode ficar no repositório: quem
protege os dados é a RLS da tabela. O **client secret do Google não entra no
código**, ele fica só no painel do Supabase.

### Por que a entrada do Google não usa redirect

No iPhone, um app aberto pela tela de início que sai da página para logar
costuma voltar dentro do Safari, e a sessão fica no lugar errado. A entrada usa
Google Identity Services, que resolve tudo na mesma página. Se ele não carregar
por algum motivo, o código cai para o redirect comum sozinho.

### Arquivos

| arquivo | papel |
| --- | --- |
| `js/config.js` | as três chaves; vazio desliga tudo |
| `js/nuvem.js` | entrada com Google, sincronização, envio adiado |
| `sql/001_progresso.sql` | tabela, RLS e gatilho de data |
| `js/treinador.js` | `exportar`, `importar` e `mesclar` |

---

## Adicionar uma aula nova

Todo o conteúdo de estudo vive em `conteudo/aulas.js`. Cada aula é um objeto com uma lista de
**blocos**. Substitua o placeholder da aula pelo conteúdo:

```js
{
  numero: 2,
  id: 'aula-02',
  titulo: 'Nome da aula',
  subtitulo: 'uma linha',
  data: '08/12',
  resumo: 'de que se trata',
  blocos: [ /* ... */ ]
}
```

### Blocos disponíveis

| tipo | serve para |
|---|---|
| `conceito` | termo à esquerda, explicação à direita (igual ao caderno) |
| `texto` | parágrafos soltos |
| `lista` | lista de tópicos |
| `acordes` | cartões com cifra + teclado |
| `progressao` | sequência tocável com visor de teclado |
| `conexoes` | par forte/suave de caminhos entre acordes |
| `tabela` | grade de cifras clicáveis (tipo campo harmônico) |
| `comparacao` | dois ou três teclados lado a lado |
| `poliacordes` | mão esquerda + mão direita = acorde resultante |
| `dica` | caixa destacada |
| `exercicios` | rotina cronometrada: passos, tempo e critério de "passou" |
| `repertorio` | padrões harmônicos por estilo, com onde aparecem nas músicas |
| `objetivo` | checklist "no fim da aula você consegue", no topo |

Todo bloco com `titulo` entra no índice da aula automaticamente. Use `curto: 'Sus2'`
para encurtar o rótulo no índice. `conexoes` aceita `variacoes: [['F','Em'], ...]`
e `poliacordes` aceita `regras: [{nome, regra, resultado, exemplo}]`.

### Como escrever as cifras

O site entende: `C`, `Am`, `Bmb5`, `C/E`, `C2/E`, `G4`, `F2/A`, `C7M`, `C7+`,
`Dm7(9/11)`, `G4(7/9)`, `Am7(9)`, `Cdim`, `C6`, `Caug`.

- número solto = suspensão: `C2` = sus2, `G4` = sus4
- `7M` e `7+` = sétima maior
- tensões entre parênteses, separadas por `/`: `(9/11)`
- barra = baixo invertido: `Em/G`

Dentro de qualquer texto, `{C}` vira a cifra no tom escolhido na página. Escreva
`Repita com {F} e com {G}` e em ré vira "Repita com G e com A". Sempre use isso ao
citar nota ou acorde no meio de uma frase — senão o texto fica falando de dó
enquanto a página está em ré.

Se quiser mandar as notas exatas em vez de deixar o site montar o acorde:

```js
{ cifra: 'C2/E', esquerda: ['E3'], direita: ['G3','C4','D4','G4'] }
```

E para a setinha de dobramento (índices das notas da mão direita):

```js
marcadores: [{ de: 0, para: 3, texto: 'quinta dobrada' }]
```

---

## Rodar sem internet

Dá duplo clique no `index.html` — funciona igual, offline, direto do iCloud.
