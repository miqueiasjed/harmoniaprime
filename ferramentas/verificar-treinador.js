/* Checagem da escolha da próxima microprática e dos prazos de revisão.

   Roda na raiz do projeto:  node ferramentas/verificar-treinador.js

   O treinador não tem tela para conferir: ele decide o que aparece amanhã a
   partir de um log de sessões. Este script monta históricos falsos, com datas
   no passado, e confere a escada de prazos, o estado de cada som e quem ganha
   a vez quando existe dívida de revisão. */

const path = require('path');
const RAIZ = process.argv[2] || path.join(__dirname, '..');

global.window = global;
const guardado = {};
global.localStorage = {
  getItem: k => (k in guardado ? guardado[k] : null),
  setItem: (k, v) => { guardado[k] = String(v); },
  length: 0, key: () => null
};

const conteudo = require(path.join(RAIZ, 'conteudo/praticas.js'));
global.CHUNKS = conteudo.CHUNKS;
global.MICROPRATICAS = conteudo.MICROPRATICAS;
require(path.join(RAIZ, 'js/treinador.js'));
const T = global.Treinador;

const DIA = 86400000;
const atras = d => new Date(Date.now() - d * DIA).toISOString();

let falhas = 0;
function eq(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log((ok ? '  ok    ' : '  FALHA ') + nome + ': ' + JSON.stringify(obtido) +
    (ok ? '' : ' (esperado ' + JSON.stringify(esperado) + ')'));
}

/** Uma sessão praticada, com data relativa a hoje. */
function s(praticaId, chunkId, diasAtras, feedback, motivo) {
  return {
    praticaId, chunkId, data: atras(diasAtras),
    praticou: true, feedback: feedback || null, motivo: motivo || null
  };
}

/** Instala um histórico e deixa os contadores saírem do log, como a nuvem faz. */
function historico(sessoes) {
  const vazio = { versao: 1, atual: null, encerrado: null, sessoes: [], praticas: {}, chunks: {} };
  T.importar(Object.assign({}, vazio, { sessoes: JSON.parse(JSON.stringify(sessoes)) }));
  T.importar(T.mesclar(T.exportar(), vazio));
}

const G = 'a1-g2b';
const mp = ['mp-g2b-ouvir', 'mp-g2b-tocar', 'mp-g2b-quatro'];

console.log('escada de prazos');

historico([s(mp[0], G, 0, 'legal')]);
eq('primeira prática marca 2 dias', T.escadaDoChunk(G).intervalo, 2);

historico([s(mp[0], G, 20, 'legal'), s(mp[1], G, 15, 'legal')]);
eq('dois "saiu legal"', T.escadaDoChunk(G).intervalo, 5);

historico([s(mp[0], G, 30, 'legal'), s(mp[1], G, 25, 'legal'), s(mp[2], G, 20, 'legal')]);
eq('três "saiu legal"', T.escadaDoChunk(G).intervalo, 13);

historico([s(mp[0], G, 30, 'legal'), s(mp[1], G, 25, 'estranho'), s(mp[2], G, 20, null)]);
eq('"ainda estranho" e silêncio congelam', T.escadaDoChunk(G).intervalo, 2);

historico([s(mp[0], G, 30, 'legal'), s(mp[1], G, 25, 'legal'), s(mp[2], G, 20, 'travei')]);
eq('"travei" devolve para amanhã', T.escadaDoChunk(G).intervalo, 1);

historico([s(mp[0], G, 5, 'legal'), s(mp[1], G, 5, 'legal')]);
eq('duas no mesmo dia não esticam', T.escadaDoChunk(G).intervalo, 2);

historico(Array.from({ length: 12 }, (_, i) => s(mp[0], G, 400 - i * 30, 'legal')));
eq('teto de 120 dias', T.escadaDoChunk(G).intervalo, 120);

console.log('estado do som');

historico([]);
eq('nunca praticado', T.estadoDoChunk(G), 'novo');

historico([s(mp[0], G, 0, 'legal')]);
eq('praticado hoje', T.estadoDoChunk(G), 'praticando');

historico([s(mp[0], G, 9, 'legal')]);
eq('prazo de 2 dias estourado', T.estadoDoChunk(G), 'revisar');

historico([s(mp[0], G, 40, 'legal'), s(mp[1], G, 35, 'legal'), s(mp[2], G, 30, 'legal'), s(mp[0], G, 10, 'legal')]);
eq('escada longa, ainda no prazo', T.estadoDoChunk(G), 'automatico');

console.log('escolha do dia');

const B = 'a1-baixo-descendente', mpB = 'mp-baixo-desc-ouvir';
const S = 'a1-sensacao', mpS = 'mp-sensacao';

historico([s(mpB, B, 0, 'legal', 'nova')]);
eq('sem dívida, vem conteúdo novo', T.hoje().motivo, 'nova');

historico([s(mpB, B, 10, 'legal', 'nova'), s(mpS, S, 1, 'legal', 'nova')]);
const comDivida = T.hoje();
eq('com dívida, vem reencontro', comDivida.motivo, 'revisao');
eq('reencontro do som vencido', comDivida.pratica.chunkId, B);

historico([s(mpB, B, 10, 'legal', 'nova'), s(mpS, S, 9, 'legal', 'nova'), s(mpB, B, 1, 'legal', 'revisao')]);
eq('freio: não vêm dois reencontros seguidos', T.hoje().motivo, 'nova');

console.log('');
console.log(falhas ? falhas + ' falha(s)' : 'treinador conferido · 0 problemas');
process.exit(falhas ? 1 : 0);
