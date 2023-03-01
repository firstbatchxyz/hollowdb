const { SDK } = require("hollowdb");
const { WarpFactory } = require("warp-contracts");

const { upload } = require("./utils/bundlr.js");
const { contractTxId, jwk } = require("./utils/config");

async function main() {
  const warp = WarpFactory.forMainnet();
  const db = new SDK({
    warp: warp,
    contractTxId: contractTxId,
    jwk: jwk,
    cacheType: "lmdb",
  });

  const key = "your-low-collision-key";
  const payload = {
    name: "John Doe",
    age: 21,
    address: "123 Main St",
  };

  //upload the payload to arweave using bundlr
  const txId = await upload(jwk, payload);

  //put the key and txid into hollowdb
  await db.put(key, txId);

  //get the txid from hollowdb
  const result = await db.get(key);

  //fetch the data from arweave using the txid
  const response = await fetch(`https://arweave.net/${result}`);
  const json = await response.json();

  //print the result
  console.log("Get Result: ", json);

  //done!
}

main();
