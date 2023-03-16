// contract tx id
const contractTxId = '...';

// arweave wallet
const jwk = {
  kty: '...',
  n: '...',
  e: '...',
  d: '...',
  p: '...',
  q: '...',
  dp: '...',
  dq: '...',
  qi: '...',
};

// path to WASM circuit and prover key
// could be stored under `public` folder for a web app
const wasmPath = 'path-to-wasm-circuit';
const proverKeyPath = 'path-to-prover-key';

exports.contractTxId = contractTxId;
exports.jwk = jwk;
exports.wasmPath = wasmPath;
exports.proverKeyPath = proverKeyPath;
