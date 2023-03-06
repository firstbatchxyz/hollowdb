const Bundlr = require('@bundlr-network/client');

//for more information on bundlr, visit https://bundlr.network
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

  //you can choose to not await this if you want to upload in the background
  //but if the upload fails, you will not be able to get the data from the txid
  await transaction.upload();
  return txID;
}

exports.upload = upload;
