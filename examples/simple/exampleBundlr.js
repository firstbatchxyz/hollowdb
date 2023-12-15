const {SDK} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');
const {computeKey} = require('hollowdb-prover');
const {jwk} = require('./config/wallets');
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
  /* either put your jwk in config/wallets folder (see line 4)
    or write it inside a variable in this file below */
  // const jwk = {};

  // create a warp instance on mainnet for hollowdb
  const warp = WarpFactory.forMainnet();

  /* To deploy a hollowDB contract run yarn contract:deploy in the root directory. 
     but don't forget to put your wallet inside the config/wallets folder */

  // paste contract tx id here
  const contractTxId = '';

  // create a hollowdb instance
  const db = new SDK(jwk, contractTxId, warp);

  // create a secret, this can be a signature/number or anything you want
  const secret = BigInt(321);
  // prepare your key, as a hash of your secret
  const key = computeKey(secret);

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
