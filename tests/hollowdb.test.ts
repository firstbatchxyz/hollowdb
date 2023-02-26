import ArLocal from 'arlocal';
import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import type {HollowDBState} from '../contracts/hollowDB/types';
import {valueTxToBigInt} from '../common/utilities';
import fs from 'fs';
import path from 'path';
import {SDK, Admin} from '../src/sdk';
import type {CacheType} from '../src/sdk/types';
import {generateProof} from './utils';
import poseidon from 'poseidon-lite';
import {createClient} from 'redis';
import {JWKInterface} from 'warp-contracts/lib/types/utils/types/arweave-types';

// arbitrarily long timeout
jest.setTimeout(30000);

enum PublicSignal {
  CurValueTx = 0,
  Key = 1,
}

const CACHE_TYPE: CacheType = 'lmdb';

describe('HollowDB tests using ' + CACHE_TYPE + ' cache', () => {
  // accounts
  let ownerAdmin: Admin;
  let ownerSDK: SDK;
  let aliceSDK: SDK;

  // local chain & contract
  let arlocal: ArLocal;
  let warp: Warp;

  // key-value for testing
  const INITIAL_STATE: HollowDBState = {
    creator: '',
    verificationKey: {},
  };
  const KEY_PREIMAGE = BigInt('123456789123456789');
  const KEY = poseidon([KEY_PREIMAGE]).toString();
  const VALUE_TX = 'Mzb7OD0TBtbcxoRO6sxPvOxHnxfSMnb6ZqSCIvbsgpY';
  const NEXT_VALUE_TX = 'Mzb7OD1bTtbxccR78sxPv2xYnnfSmNb6ZqSCIvbs123';

  beforeAll(async () => {
    const PORT = 3169;

    // seutp local arweave
    arlocal = new ArLocal(PORT, false);
    await arlocal.start();

    // setup warp factory for local arweave
    LoggerFactory.INST.logLevel('error');
    warp = WarpFactory.forLocal(PORT);

    // get accounts
    const ownerWallet = await warp.generateWallet();
    const aliceWallet = await warp.generateWallet();

    // deploy contract
    const contractSource = fs.readFileSync(path.join(__dirname, '../build/hollowDB/contract.js'), 'utf8');
    const {contractTxId: hollowDBTxId} = await Admin.deploy(ownerWallet.jwk, INITIAL_STATE, contractSource, warp);
    console.log('Deployed contract: ', hollowDBTxId);

    // prepare SDKs
    [ownerAdmin, ownerSDK, aliceSDK] = prepareSDKs(CACHE_TYPE, warp, hollowDBTxId, ownerWallet.jwk, aliceWallet.jwk);

    const contractTx = await warp.arweave.transactions.get(hollowDBTxId);
    expect(contractTx).not.toBeNull();
  });

  it('should succesfully deploy', async () => {
    const {cachedValue} = await ownerSDK.readState();
    expect(cachedValue.state).toEqual(INITIAL_STATE);
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
      const state = await ownerSDK.readState();
      expect(state.cachedValue.state.verificationKey).toEqual(verificationKey);
    });

    it('should get creator', async () => {
      const state = await ownerSDK.readState();
      expect(state.cachedValue.state.creator).toEqual(await warp.arweave.wallets.getAddress(ownerAdmin.jwk));
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
  });

  describe('update operations', () => {
    let proof: object;

    beforeAll(async () => {
      const currentValue = (await aliceSDK.get(KEY)) as string;
      const fullProof = await generateProof(KEY_PREIMAGE, currentValue);
      proof = fullProof.proof;
      expect(valueTxToBigInt(currentValue).toString()).toEqual(fullProof.publicSignals[PublicSignal.CurValueTx]);
      expect(KEY).toEqual(fullProof.publicSignals[PublicSignal.Key]);
    });

    it('should NOT update with a proof using wrong valueTx', async () => {
      // generate a proof with wrong valueTx
      const fullProof = await generateProof(KEY_PREIMAGE, 'abcdefg');
      await expect(aliceSDK.update(KEY, NEXT_VALUE_TX, fullProof.proof)).rejects.toThrow();
    });

    it('should NOT update with a proof using wrong preimage', async () => {
      // generate a proof with wrong preimage
      const fullProof = await generateProof(1234567n, VALUE_TX);
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
      const fullProof = await generateProof(KEY_PREIMAGE, currentValue);
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

  afterAll(async () => {
    await arlocal.stop();
  });
});

/**
 * Utility function to create `Admin` and `SDK`s for HollowDB contract.
 */
function prepareSDKs(
  cacheType: CacheType,
  warp: Warp,
  contractTxId: string,
  ownerJWK: JWKInterface,
  aliceJWK: JWKInterface
): [ownerAdmin: Admin, ownerSDK: SDK, aliceSDK: SDK] {
  const redisClient =
    cacheType === 'redis'
      ? createClient({
          url: 'redis://default:redispw@localhost:6379',
        })
      : undefined;
  const ownerAdmin = new Admin({
    jwk: ownerJWK,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
  const ownerSDK = new SDK({
    jwk: ownerJWK,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
  const aliceSDK = new SDK({
    jwk: aliceJWK,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
  return [ownerAdmin, ownerSDK, aliceSDK];
}
