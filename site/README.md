# Harmonia Prime — caderno de estudos

Site estático com as anotações das 12 aulas de harmonia. Cada acorde toca som,
acende no teclado e pode ser transposto para qualquer um dos 12 tons.

Não tem build, não tem dependência, não tem servidor. É só HTML, CSS e JavaScript.

```
index.html          página única
css/estilo.css      visual
js/musica.js        teoria (cifras, transposição, vozes) + áudio
js/teclado.js       desenho do teclado em SVG
js/app.js           montagem da página
conteudo/aulas.js   👈 o conteúdo das aulas fica aqui
```

---

## Publicar no GitHub Pages

Uma vez só, uns 5 minutos:

1. Crie uma conta em <https://github.com> (se ainda não tiver).
2. Clique em **New repository**. Nome: `harmonia-prime`. Deixe **Public**. Crie.
3. Na tela seguinte, clique em **uploading an existing file**.
4. Arraste **o conteúdo desta pasta** (o `index.html`, e as pastas `css`, `js`, `conteudo`).
   Importante: arraste os arquivos de dentro, não a pasta inteira — o `index.html`
   precisa ficar na raiz do repositório.
5. Clique em **Commit changes**.
6. Vá em **Settings → Pages**. Em *Source*, escolha **Deploy from a branch**,
   branch `main`, pasta `/ (root)`. Salve.
7. Espere ~1 minuto e o site estará em:
   `https://SEUUSUARIO.github.io/harmonia-prime/`

Abra esse endereço no celular e adicione à tela de início — funciona como app.

### Atualizar depois

No repositório, entre no arquivo que mudou → ícone de lápis → cole o conteúdo novo →
**Commit changes**. Em 1 minuto o site já está atualizado. Na prática, só o
`conteudo/aulas.js` muda.

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
