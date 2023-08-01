const {SDK} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');
const {computeKey} = require('hollowdb-prover');
const {jwk} = require('./config/wallets');

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
  const secret = BigInt(123);
  // prepare your key, as a hash of your secret
  const key = computeKey(secret);

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
