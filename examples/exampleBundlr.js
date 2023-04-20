const {SDK, computeKey} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');
const Bundlr = require('@bundlr-network/client');

// for more information on bundlr, visit https://bundlr.network
async function upload(jwk, payload) {
  const bundlr = new Bundlr.default('http://node1.bundlr.network', 'arweave', jwk);
  const tags = [{name: 'Content-Type', value: 'application/json'}];
  const transaction = await bundlr.createTransaction(
    JSON.stringify({
      data: payload,
    }),
    {
      tags: tags,
    }
  );

  await transaction.sign();
  const txID = transaction.id;

  // you can choose to not await this if you want to upload in the background
  // but if the upload fails, you will not be able to get the data from the txid
  await transaction.upload();

  return txID;
}

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
