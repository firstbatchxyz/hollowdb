const {SDK, computeKey} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');
const {contractTxId, jwk, wasmPath, proverKeyPath} = require('./utils/config');
const {upload} = require('./utils/bundlr.js');

async function main() {
  // create a warp instance for hollowdb
  const warp = WarpFactory.forMainnet();

  // create a hollowdb instance
  const db = new SDK({
    warp: warp,
    contractTxId: contractTxId,
    jwk: jwk,
    cacheType: 'lmdb',
  });

  // your key, as a hash of your secret
  const key = computeKey('your-secret');

  // perhaps a much larger payload, more than 2KB in particular!
  const payload = {
    name: 'John Doe',
    age: 21,
    address: '123 Main St',
  };

  // upload the payload to arweave using bundlr
  const txId = await upload(jwk, payload);

  // put the key and txid into hollowdb
  await db.put(key, txId);

  // get the txid from hollowdb
  const result = await db.get(key);

  // fetch the data from arweave using the txid
  const response = await fetch(`https://arweave.net/${result}`);
  const json = await response.json();
  console.log(json);
}

main();
