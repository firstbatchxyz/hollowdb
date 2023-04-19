// import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
// import {DeployPlugin} from 'warp-contracts-plugin-deploy';
// import initialState from '../common/initialState';
// import fs from 'fs';
// import path from 'path';
// import {Admin, SDK} from '../src';
// import constants from './constants';
// import {Wallet} from 'ethers';

// const {
//   EvmSignatureVerificationServerPlugin,
//   buildEvmSignature,
// } = require('warp-contracts-plugin-signature/build/server');

// // arbitrarily long timeout
// jest.setTimeout(constants.JEST_TIMEOUT_MS);

// describe('hollowdb signers', () => {
//   let contractSource: string;
//   let contractTxId: string;
//   let warp: Warp;

//   let ownerWallet: WarpWallet;
//   let aliceWallet: EthersWallet;

//   beforeAll(async () => {
//     LoggerFactory.INST.logLevel('error');

//     contractSource = fs.readFileSync(path.join(__dirname, '../build/hollowDB/contract.js'), 'utf8');

//     // setup warp factory for local arweave
//     warp = WarpFactory.forTestnet()
//       .use(new DeployPlugin())
//       // use evm signer, server plugin because we are testing with Ethers
//       .use(new EvmSignatureVerificationServerPlugin());

//     // get accounts
//     ownerWallet = await warp.generateWallet(); // owner is using Arweave
//     aliceWallet = EthersWallet.createRandom(); // alice is using ethers

//     // deploy contract
//     const {contractTxId: hollowDBTxId} = await Admin.deploy(
//       ownerWallet.jwk,
//       initialState,
//       contractSource,
//       warp,
//       true // bundling is disabled during testing
//     );
//     const contractTx = await warp.arweave.transactions.get(hollowDBTxId);
//     expect(contractTx).not.toBeNull();
//     contractTxId = hollowDBTxId;
//   });

//   describe('owner operations (arweave wallet)', () => {
//     let ownerSDK: SDK;
//     beforeAll(() => {
//       ownerSDK = new SDK({
//         signer: ownerWallet.jwk,
//         cacheType: 'lmdb',
//         contractTxId,
//         // we are also testing to see if warp can work with arweave when evm plugin is used
//         warp,
//       });
//     });

//     it('should put a value to a key', async () => {});

//     it('should update a value at a key', async () => {});

//     it('should delete a value at a key', async () => {});
//   });

//   describe('alice operations (ethereum wallet)', () => {
//     let aliceSDK: SDK;
//     beforeAll(() => {
//       const aliceSigner = buildEvmSignature(aliceWallet);
//       aliceSDK = new SDK({
//         signer: {signer: aliceSigner, type: 'ethereum'},
//         cacheType: 'lmdb',
//         contractTxId,
//         warp,
//       });
//     });

//     it('should put a value to a key', async () => {});

//     it('should update a value at a key', async () => {});

//     it('should delete a value at a key', async () => {});
//   });
// });
