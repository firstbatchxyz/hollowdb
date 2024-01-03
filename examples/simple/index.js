const {SDK} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');
const {computeKey} = require('hollowdb-prover');
const {readFileSync} = require('fs');
const Irys = require('@irys/sdk');

async function uploadToIrys(jwk, payload) {
  const irys = new Irys({
    url: 'https://node1.irys.xyz',
    token: 'arweave',
    key: jwk,
  });

  try {
    const receipt = await irys.upload(Buffer.from(JSON.stringify(payload)));
    console.log(`Data uploaded ==> https://gateway.irys.xyz/${receipt.id}`);
    return receipt.id;
  } catch (e) {
    console.log('Error uploading data ', e);
    throw e;
  }
}

async function main() {
  const USE_IRYS = process.env.USE_IRYS === 'true' ? true : false;

  const wallet = JSON.parse(readFileSync('./config/wallet.json', 'utf-8'));
  const warp = WarpFactory.forMainnet();

  // example contract
  const contractTxId = 'bNsZhQ1UaZpAk-x-Zm7pq_EC15m-sLqsRTbki-LpW_M';

  // create a hollowdb instance
  const db = new SDK(wallet, contractTxId, warp);

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
  let result;
  if (USE_IRYS) {
    const txid = await uploadToIrys(wallet, payload);
    await db.put(key, txid);

    const getTxId = await db.get(key);
    result = await fetch(`https://arweave.net/${getTxId}`);
  } else {
    await db.put(key, payload);
    result = await db.get(key);
  }
  console.log(JSON.parse(result));
}

main();
