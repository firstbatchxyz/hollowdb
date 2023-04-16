// import {WarpFactory} from 'warp-contracts';
// import {SDK} from '../src/sdk';
// import {DeployPlugin} from 'warp-contracts-plugin-deploy';
// import {EvmSignatureVerificationWebPlugin} from 'warp-contracts-plugin-signature/';
// import {Wallet} from 'ethers';

// async function evmDemo() {
//   let contractTxId: string;

//   if (process.argv.length === 3) {
//     contractTxId = process.argv[2];
//   } else {
//     throw new Error('Usage: yarn contract:evmDemo <contract-tx-id>');
//   }

//   // create a warp instance
//   const warp = WarpFactory.forMainnet().use(new DeployPlugin()).use(new EvmSignatureVerificationWebPlugin());

//   // // create random signer
//   // const aliceWallet = Wallet.createRandom();
//   // const aliceSigner = buildEvmSignature(aliceWallet);

//   // // create SDK
//   // const aliceSDK = new SDK({
//   //   signer: {signer: aliceSigner, type: 'ethereum'},
//   //   cacheType: 'lmdb',
//   //   contractTxId,
//   //   warp,
//   // });
// }

// evmDemo();
