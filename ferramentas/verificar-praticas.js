/* Checagem musical das micropráticas, conforme ERROS.md.

   Roda na raiz do projeto:  node ferramentas/verificar-praticas.js

   Para cada cifra de cada microprática, já no tom em que ela vai aparecer:
   a cifra é legível, toda nota cabe na escala do tom, a grafia não usa
   Cb/Fb/B#/E#, não há segunda menor entre as vozes nem nona menor contra o
   baixo, e a fila (`depende`) não pede nada que venha depois.

   Console limpo não diz nada sobre harmonia. Este script diz um pouco mais,
   e ainda assim a última conferência é tocar. */

const path = require('path');
const RAIZ = process.argv[2] || path.join(__dirname, '..');
global.window = global;
require(path.join(RAIZ, 'js/musica.js'));
const { CHUNKS, MICROPRATICAS } = require(path.join(RAIZ, 'conteudo/praticas.js'));
const M = global.Musica;

const MAIOR = [0, 2, 4, 5, 7, 9, 11];
const mod12 = n => ((n % 12) + 12) % 12;
const NOME = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

let erros = 0, cifrasVistas = 0;
function falha(ctx, msg) { erros++; console.log('  FALHA ' + ctx + ': ' + msg); }

function semitonsDe(tomNome) {
  const t = M.TONS.find(x => x.nome === tomNome);
  return t.pc > 6 ? t.pc - 12 : t.pc;
}
function bemolDe(tomNome) { return M.TONS.find(x => x.nome === tomNome).bemol; }

function pcsDoItem(item, semitons) {
  const v = M.vozes(item, semitons);
  return v.esquerda.concat(v.direita).map(mod12);
}

function checarItem(item, tomNome, ctx) {
  cifrasVistas++;
  const semitons = semitonsDe(tomNome);
  const tonica = mod12(NOME[tomNome[0]] + (tomNome[1] === 'b' ? -1 : tomNome[1] === '#' ? 1 : 0));
  const escala = MAIOR.map(i => mod12(tonica + i));

  // parse de cada cifra citada
  ['cifra', 'lh', 'rh'].forEach(campo => {
    if (!item[campo]) return;
    const lida = M.lerCifra(item[campo]);
    if (!lida) return falha(ctx, 'cifra ilegível: ' + item[campo]);
    const grafada = M.transporCifra(item[campo], semitons, bemolDe(tomNome));
    if (/(^|\/)(Cb|Fb|B#|E#)/.test(grafada)) falha(ctx, 'grafia proibida: ' + grafada);
  });

  // toda nota tocada precisa caber na escala do tom
  const pcs = pcsDoItem(item, semitons);
  if (!pcs.length) return falha(ctx, 'não gerou nota nenhuma');
  const fora = pcs.filter(pc => escala.indexOf(pc) === -1);
  if (fora.length) {
    falha(ctx, 'nota fora do tom de ' + tomNome + ': ' +
      fora.map(pc => M.nomeDePc(pc, bemolDe(tomNome))).join(', ') +
      ' (em ' + (item.cifra || item.lh + '+' + item.rh) + ')');
  }

  // Choque contra o baixo. Não dá para exigir que o baixo seja nota do
  // acorde: a forma de sus2 da aula (C2/E, F2/A, G2/B) é justamente uma
  // tríade suspensa sobre um baixo uma terça maior abaixo. O que não pode
  // é segunda menor ou nona menor entre as vozes que soam juntas.
  const v = M.vozes(item, semitons);
  const todas = v.esquerda.concat(v.direita).sort((a, b) => a - b);
  for (let i = 1; i < todas.length; i++) {
    const d = todas[i] - todas[i - 1];
    if (d === 1) falha(ctx, 'segunda menor entre as vozes de ' + (item.cifra || item.lh + '+' + item.rh));
  }
  if (todas.length > 1 && todas.slice(1).some(n => n - todas[0] === 13)) {
    falha(ctx, 'nona menor contra o baixo em ' + (item.cifra || item.lh + '+' + item.rh));
  }
}

function itens(lista) {
  return (lista || []).map(a => (typeof a === 'string' ? { cifra: a } : a));
}

console.log('Checagem musical das micropráticas\n');

MICROPRATICAS.forEach(p => {
  const tom = p.tom || 'C';
  const chunk = CHUNKS.find(c => c.id === p.chunkId);
  if (!chunk) falha(p.id, 'chunkId inexistente: ' + p.chunkId);
  (p.depende || []).forEach(d => {
    if (!MICROPRATICAS.some(x => x.id === d)) falha(p.id, 'depende de id inexistente: ' + d);
    if (MICROPRATICAS.findIndex(x => x.id === d) > MICROPRATICAS.findIndex(x => x.id === p.id)) {
      falha(p.id, 'depende de uma prática que vem depois na fila: ' + d);
    }
  });
  if (!p.passos || !p.passos.length) falha(p.id, 'sem passos');

  [['antes', p.antes], ['depois', p.depois], ['progressao', p.progressao]].forEach(([nome, lista]) => {
    itens(lista).forEach(it => checarItem(it, tom, p.id + ' / ' + nome));
  });
  (p.passos || []).forEach((passo, i) => {
    (passo.linhas || []).forEach(l => {
      if (!l.acordes || !l.acordes.length) falha(p.id, 'passo ' + (i + 1) + ' com linha vazia');
      itens(l.acordes).forEach(it => checarItem(it, tom, p.id + ' / passo ' + (i + 1)));
    });
  });
});

CHUNKS.forEach(c => {
  itens(c.progressao).forEach(it => checarItem(it, 'C', 'chunk ' + c.id));
  if (!MICROPRATICAS.some(p => p.chunkId === c.id)) {
    falha('chunk ' + c.id, 'nenhuma microprática usa este chunk');
  }
});

console.log('\n' + cifrasVistas + ' acordes conferidos · ' + erros + ' problemas');
process.exit(erros ? 1 : 0);
