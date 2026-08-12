# Harmonia Prime — caderno de estudos

Site estático com as anotações das 12 aulas de harmonia. Cada acorde toca som,
acende no teclado e pode ser transposto para qualquer um dos 12 tons.

Não tem build, não tem dependência, não tem servidor. É só HTML, CSS e JavaScript.

```
index.html          página única
css/estilo.css      visual
js/musica.js        teoria (cifras, transposição, condução de vozes) + piano
js/teclado.js       desenho do teclado em SVG
js/cifras.js        busca e leitura de cifras de fora
js/aplicar.js       análise da música e detectores de conceito
js/app.js           montagem da página
conteudo/aulas.js   👈 o conteúdo das aulas fica aqui
```

---

## Aplicar numa música

No fim de cada aula tem a seção **Aplicar numa música**. Busque qualquer música,
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

## Publicar no GitHub Pages

O repositório já está no GitHub em `miqueiasjed/harmoniaprime` e o `index.html`
fica na raiz, que é de onde o Pages serve. Falta ligar o Pages, uma vez só:

1. Deixe o repositório **público**. O GitHub Pages em repositório privado exige
   plano pago. Em **Settings → General**, lá embaixo em *Danger Zone*, use
   **Change repository visibility**.
2. Em **Settings → Pages**, no campo *Source*, escolha **Deploy from a branch**.
   Branch `main`, pasta `/ (root)`. Salve.
3. Espere cerca de um minuto. O site fica em
   `https://miqueiasjed.github.io/harmoniaprime/`.

Abra esse endereço no celular e adicione à tela de início: funciona como app.

O arquivo vazio `.nojekyll` na raiz faz o Pages servir os arquivos como estão,
sem passar pelo Jekyll.

### Atualizar depois

`git push` na `main` e pronto. Em cerca de um minuto o site está no ar com a
mudança. Na prática, só o `conteudo/aulas.js` muda.

---

## Adicionar uma aula nova

Todo o conteúdo vive em `conteudo/aulas.js`. Cada aula é um objeto com uma lista de
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
