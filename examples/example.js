const {SDK, computeKey} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');

async function main() {
  // your wallet, probably read from disk in a .gitignore'd folder!
  const jwk = {
    /*your wallet here*/
  };

  // create a warp instance for hollowdb
  const warp = WarpFactory.forMainnet();

  // create a hollowdb instance
  const db = new SDK({
    warp: warp,
    contractTxId: 'your-contract-txid-here',
    jwk: jwk,
    cacheType: 'lmdb',
  });

  // your key, as a hash of your secret
  const key = computeKey('your-secret');

  // value can be anything you want to store, but it must not exceed 2kb
  // if you need to store more than 2kb, you can use bundlr to store the data on arweave and store the txid in hollowdb
  const payload = {
    name: 'John Doe',
    age: 21,
    address: '123 Main St',
  };

  // put the key and payload into hollowdb
  await db.put(key, payload);

  // get the payload from hollowdb
  const result = await db.get(key);
  console.log(result);
}

main();
