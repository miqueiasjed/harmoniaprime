# Registro de erros e checagem obrigatória

Este arquivo existe porque erros de música não quebram o console: o site roda
liso e sugere um acorde errado. O registro guarda os erros reais já cometidos
(com a causa raiz) e a checagem que toda mudança nos detectores precisa passar
antes do push.

## Erros reais já cometidos aqui

**Sus2 cromático (Eb2/G em dó maior).** A regra foi generalizada dos três
pares da aula (C/E → C2/E, Am → F2/A, Bmb5 → G2/B) como "sus2 uma terça maior
abaixo do baixo". Ela só é diatônica para os baixos mi, lá e si, exatamente os
três que a aula usou. Aplicada ao resto produziu Eb2/G, Db2/F e Bb2/D. Causa
raiz: generalizar N exemplos sem testar a regra fora deles. Pego pelo usuário,
olhando a cifra.

**Sus2 com a terça no baixo (A2/C para Am/C).** A forma "tira a terça do
próprio acorde" foi aplicada a inversões em que o baixo é a própria terça: a
dica removia da mão direita a nota que o baixo continuava sustentando, e em
D2/F ainda criava choque de segunda menor (mi contra fá). Causa raiz: testar
só acordes em posição fundamental. Pego no reteste cético, um dia depois.

**Sus4 fora do tom (F4 em dó maior).** Fsus4 contém si bemol. O detector não
conferia se a quarta era diatônica. Mesma causa raiz do primeiro.

**Poliacorde com 7M em acorde dominante (G + D no quinto grau).** A regra "
maior pede a quinta acima" ignorava a função: a tabela da própria aula dá
G4 + F para o V. Causa raiz: aplicar a regra da qualidade do acorde sem olhar
o grau.

**Transposição dupla na seção de música.** Os acordes importados tocavam
transpostos pelo tom da página além do tom da própria música. Só aparecia com
a página fora de dó. Causa raiz: reutilizar `vozesDe` sem revisar o que ela
assume do contexto.

**Fora da música: trailer de co-autoria quebrou o deploy do Netlify; rótulos
longos sobrepostos na cifra; HTML de tablatura vazando como texto.** Todos
pegos por print do usuário ou captura de tela, nunca pelo console.

## Checagem antes de publicar qualquer detector ou sugestão musical

1. **Diatonia.** Toda nota de toda sugestão pertence à escala do tom? Exceção
   só quando a aula prescreve o cromatismo (ex.: Em + D no III grau, cuja nona
   é fá sustenido por regra da aula). Exceção aceita é exceção comentada no
   código.
2. **Generalização.** A regra deduzida dos exemplos da aula reproduz todos os
   exemplos E foi testada nos sete graus, em tom maior e menor? Exemplo da
   aula é caso de teste obrigatório, não inspiração.
3. **Inversões.** Testar com baixo na terça e na quinta (X/3, X/5). A dica não
   pode remover uma nota que o baixo sustenta nem criar segunda menor contra o
   baixo.
4. **Emprestados e sétimas.** Fm em dó maior, acordes com sétima e tensão: a
   dica ainda vale ou o detector deve pular?
5. **Função.** Dominante é dominante: V pede sétima menor, não 7M, mesmo sendo
   tríade maior.
6. **Grafia.** Pela armadura do tom (Bb em tons bemóis, não A#), nunca Cb, Fb,
   B# ou E# em cifra.
7. **Na dúvida, não marcar.** Dica errada é pior que dica nenhuma; o detector
   devolve null e segue.
8. **Rodar os testes de tortura** (progressão com todos os graus, inversões e
   emprestados, nos scripts de verificação) e conferir a saída contra os
   exemplos literais de `conteudo/aulas.js`. Atenção: o verificador de
   diatonia lê a sugestão como texto e acusa falso positivo em nome de nota
   solto ("D repetido uma oitava acima" não é o acorde ré maior); conferir os
   apontamentos um a um antes de sair corrigindo.

## Regra geral que cobre tudo isso

O que o código sugere, alguém vai tocar. Validar como músico (tocaria isso
nesse compasso?) e não só como programador (a função retorna sem erro?). O
console limpo não diz nada sobre a harmonia.
