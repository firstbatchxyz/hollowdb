const {SDK} = require('hollowdb');
const {WarpFactory} = require('warp-contracts');
const {contractTxId, jwk} = require('./utils/config');

async function main() {
  //create a warp instance for feeding into hollowdb
  const warp = WarpFactory.forMainnet();

  //create a hollowdb instance
  const db = new SDK({
    warp: warp,
    contractTxId: contractTxId,
    jwk: jwk,
    cacheType: 'lmdb',
  });

  //create a key preferably using some sort of hash function like sha256 to avoid collisions.
  //hollowdb does not allow duplicate keys
  const key = 'your-low-collision-key';

  //payload can be anything you want to store, but it must not exceed 2kb
  //if you need to store more than 2kb, you can use bundlr to store the data on arweave and store the txid in hollowdb
  const payload = {
    name: 'John Doe',
    age: 21,
    address: '123 Main St',
  };

  //put the key and payload into hollowdb
  await db.put(key, payload);

  //get the payload from hollowdb
  const result = await db.get(key);

  //print the result
  console.log('Get Result: ', result);

  //done!
}

main();
