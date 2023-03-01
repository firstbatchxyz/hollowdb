import ArLocal from 'arlocal';
import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import initialState from '../common/initialState';
import {valueTxToBigInt} from '../common/utilities';
import fs from 'fs';
import path from 'path';
import {SDK, Admin} from '../src/sdk';
import type {CacheType} from '../src/sdk/types';
import poseidon from 'poseidon-lite';
import {randomBytes} from 'crypto';
import {generateProof, prepareSDKs} from './utils';

// arbitrarily long timeout
jest.setTimeout(30000);

enum PublicSignal {
  CurValueTx = 0,
  NextValueTx = 1,
  Key = 2,
}

const ARWEAVE_PORT = 3169;

const KEY_PREIMAGE = BigInt('0x' + randomBytes(10).toString('hex'));
const KEY = poseidon([KEY_PREIMAGE]).toString();
const VALUE_TX = randomBytes(10).toString('hex');
const NEXT_VALUE_TX = randomBytes(10).toString('hex');

describe('HollowDB', () => {
  let arlocal: ArLocal;
  let contractSource: string;

  beforeAll(async () => {
    arlocal = new ArLocal(ARWEAVE_PORT, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('error');

    contractSource = fs.readFileSync(path.join(__dirname, '../build/hollowDB/contract.js'), 'utf8');
  });

  describe.each<CacheType>(['lmdb', 'redis'])('using %s cache, proofs enabled', cacheType => {
    let ownerAdmin: Admin;
    let ownerSDK: SDK;
    let aliceSDK: SDK;
    let warp: Warp;

    beforeAll(async () => {
      // setup warp factory for local arweave
      warp = WarpFactory.forLocal(ARWEAVE_PORT);

      // get accounts
      const ownerWallet = await warp.generateWallet();
      const aliceWallet = await warp.generateWallet();

      // deploy contract
      const {contractTxId: hollowDBTxId} = await Admin.deploy(ownerWallet.jwk, initialState, contractSource, warp);
      console.log('Deployed contract: ', hollowDBTxId);

      // prepare SDKs
      [ownerAdmin, ownerSDK, aliceSDK] = prepareSDKs(cacheType, warp, hollowDBTxId, ownerWallet.jwk, aliceWallet.jwk);

      const contractTx = await warp.arweave.transactions.get(hollowDBTxId);
      expect(contractTx).not.toBeNull();
    });

    it('should succesfully deploy with correct state', async () => {
      const {cachedValue} = await ownerSDK.readState();
      expect(cachedValue.state.verificationKey).toEqual({});
      expect(cachedValue.state.isProofRequired).toEqual(true);
      expect(cachedValue.state.owner).toEqual(await warp.arweave.wallets.getAddress(ownerAdmin.jwk));
    });

    describe('admin operations', () => {
      let verificationKey: object;

      beforeAll(() => {
        verificationKey = JSON.parse(
          fs.readFileSync(path.join(__dirname, '../circuits/hollow-authz/verification_key.json'), 'utf8')
        );
      });

      it('should set verification key', async () => {
        await ownerAdmin.setVerificationKey(verificationKey);
      });

      it('should get verification key', async () => {
        const {cachedValue} = await ownerSDK.readState();
        expect(cachedValue.state.verificationKey).toEqual(verificationKey);
      });
    });

    describe('put operations', () => {
      it('should put a value to a key & read it', async () => {
        expect(await ownerSDK.get(KEY)).toEqual(null);
        await ownerSDK.put(KEY, VALUE_TX);
        expect(await ownerSDK.get(KEY)).toEqual(VALUE_TX);
      });

      it('should NOT put a value to the same key', async () => {
        await expect(ownerSDK.put(KEY, VALUE_TX)).rejects.toThrow(
          'Contract Error [put]: Key already exists, use update instead'
        );
      });

      it('should put many values', async () => {
        const count = 10;
        const valueTxs = Array<string>(count).fill(randomBytes(10).toString('hex'));

        for (let i = 0; i < valueTxs.length; ++i) {
          const k = KEY + i;
          const v = valueTxs[i];
          expect(await ownerSDK.get(k)).toEqual(null);
          await ownerSDK.put(k, v);
          expect(await ownerSDK.get(k)).toEqual(v);
        }
      });
    });

    describe('update operations', () => {
      let proof: object;

      beforeAll(async () => {
        const currentValue = (await aliceSDK.get(KEY)) as string;
        const fullProof = await generateProof(KEY_PREIMAGE, currentValue, NEXT_VALUE_TX);
        proof = fullProof.proof;
        expect(valueTxToBigInt(currentValue).toString()).toEqual(fullProof.publicSignals[PublicSignal.CurValueTx]);
        expect(KEY).toEqual(fullProof.publicSignals[PublicSignal.Key]);
      });

      it('should NOT update with a proof using wrong curValueTx', async () => {
        // generate a proof with wrong nextValueTx
        const fullProof = await generateProof(KEY_PREIMAGE, 'abcdefg', NEXT_VALUE_TX);
        await expect(aliceSDK.update(KEY, NEXT_VALUE_TX, fullProof.proof)).rejects.toThrow();
      });

      it('should NOT update with a proof using wrong nextValueTx', async () => {
        // generate a proof with wrong nextValueTx
        const fullProof = await generateProof(KEY_PREIMAGE, VALUE_TX, 'abcdefg');
        await expect(aliceSDK.update(KEY, NEXT_VALUE_TX, fullProof.proof)).rejects.toThrow();
      });

      it('should NOT update with a proof using wrong preimage', async () => {
        // generate a proof with wrong preimage
        const fullProof = await generateProof(1234567n, VALUE_TX, NEXT_VALUE_TX);
        await expect(aliceSDK.update(KEY, NEXT_VALUE_TX, fullProof.proof)).rejects.toThrow();
      });

      it('should NOT update an existing value without a proof', async () => {
        await expect(aliceSDK.update(KEY, NEXT_VALUE_TX, {})).rejects.toThrow();
      });

      it('should update an existing value with proof', async () => {
        await aliceSDK.update(KEY, NEXT_VALUE_TX, proof);
        expect(await aliceSDK.get(KEY)).toEqual(NEXT_VALUE_TX);
      });

      it('should NOT update an existing value with the same proof', async () => {
        await expect(aliceSDK.update(KEY, NEXT_VALUE_TX, proof)).rejects.toThrow(
          'Contract Error [update]: Proof verification failed in: update'
        );
      });
    });

    describe('remove operations', () => {
      let proof: object;

      beforeAll(async () => {
        const currentValue = (await aliceSDK.get(KEY)) as string;
        const fullProof = await generateProof(KEY_PREIMAGE, currentValue, null);
        proof = fullProof.proof;

        expect(valueTxToBigInt(currentValue).toString()).toEqual(fullProof.publicSignals[PublicSignal.CurValueTx]);
        expect(KEY).toEqual(fullProof.publicSignals[PublicSignal.Key]);
      });

      it('should remove an existing value with proof', async () => {
        expect(await aliceSDK.get(KEY)).not.toEqual(null);
        await aliceSDK.remove(KEY, proof);
        expect(await aliceSDK.get(KEY)).toEqual(null);
      });

      it('should NOT remove an already remove value with proof', async () => {
        expect(await aliceSDK.get(KEY)).toEqual(null);
        await expect(aliceSDK.remove(KEY, proof)).rejects.toThrow('Key does not exist');
      });
    });
  });

  describe('tests without proofs', () => {
    let ownerAdmin: Admin;
    let ownerSDK: SDK;
    let aliceSDK: SDK;
    let warp: Warp;

    beforeAll(async () => {
      // setup warp factory for local arweave
      warp = WarpFactory.forLocal(ARWEAVE_PORT);

      // get accounts
      const ownerWallet = await warp.generateWallet();
      const aliceWallet = await warp.generateWallet();

      // deploy contract
      const {contractTxId: hollowDBTxId} = await Admin.deploy(ownerWallet.jwk, initialState, contractSource, warp);
      console.log('Deployed contract: ', hollowDBTxId);

      // prepare SDKs
      [ownerAdmin, ownerSDK, aliceSDK] = prepareSDKs('lmdb', warp, hollowDBTxId, ownerWallet.jwk, aliceWallet.jwk);

      const contractTx = await warp.arweave.transactions.get(hollowDBTxId);
      expect(contractTx).not.toBeNull();
    });

    it('should succesfully deploy with correct state', async () => {
      const {cachedValue} = await ownerSDK.readState();
      expect(cachedValue.state.verificationKey).toEqual({});
      expect(cachedValue.state.isProofRequired).toEqual(true);
      expect(cachedValue.state.owner).toEqual(await warp.arweave.wallets.getAddress(ownerAdmin.jwk));
    });

    describe('admin operations', () => {
      it('should set proof requirement to false', async () => {
        const {cachedValue} = await ownerSDK.readState();
        expect(cachedValue.state.isProofRequired).toEqual(true);

        await ownerAdmin.setProofRequirement(false);

        const {cachedValue: newCachedValue} = await ownerSDK.readState();
        expect(newCachedValue.state.isProofRequired).toEqual(false);
      });
    });

    describe('put operations', () => {
      it('should put a value to a key & read it', async () => {
        expect(await ownerSDK.get(KEY)).toEqual(null);
        await ownerSDK.put(KEY, VALUE_TX);
        expect(await ownerSDK.get(KEY)).toEqual(VALUE_TX);
      });

      it('should NOT put a value to the same key', async () => {
        await expect(ownerSDK.put(KEY, VALUE_TX)).rejects.toThrow(
          'Contract Error [put]: Key already exists, use update instead'
        );
      });

      it('should put many values', async () => {
        const count = 10;
        const valueTxs = Array<string>(count).fill(randomBytes(10).toString('hex'));

        for (let i = 0; i < valueTxs.length; ++i) {
          const k = KEY + i;
          const v = valueTxs[i];
          expect(await ownerSDK.get(k)).toEqual(null);
          await ownerSDK.put(k, v);
          expect(await ownerSDK.get(k)).toEqual(v);
        }
      });
    });

    describe('update operations', () => {
      it('should update an existing value without proof', async () => {
        await aliceSDK.update(KEY, NEXT_VALUE_TX, {});
        expect(await aliceSDK.get(KEY)).toEqual(NEXT_VALUE_TX);
      });
    });

    describe('remove operations', () => {
      it('should remove an existing value without proof', async () => {
        expect(await aliceSDK.get(KEY)).not.toEqual(null);
        await aliceSDK.remove(KEY, {});
        expect(await aliceSDK.get(KEY)).toEqual(null);
      });
    });
  });

  afterAll(async () => {
    await arlocal.stop();
  });
});
