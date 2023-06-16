import ArLocal from 'arlocal';
import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import initialState from '../contracts/states/hollowdb';
import fs from 'fs';
import path from 'path';
import {SDK, Admin} from '../src';
import {Prover} from './utils/prover';
import {computeKey} from './utils/computeKey';
import {randomBytes} from 'crypto';
import constants from './constants';
import {globals} from '../jest.config.cjs';
import {Redis} from 'ioredis';
import {decimalToHex} from './utils';
import {overrideCache} from './utils/cache';
import {addToWhitelist, disableWhitelisting, enableWhitelisting, removeFromWhitelist} from './utils/whitelisting';
import {disableProofs, enableProofs} from './utils/proofs';

type ValueType = {
  val: string;
};

describe('hollowdb', () => {
  let arlocal: ArLocal;
  let contractSource: string;
  let prover: Prover;

  beforeAll(async () => {
    arlocal = new ArLocal(constants.ARWEAVE_PORT, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('error');
    contractSource = fs.readFileSync(path.join(__dirname, '../build/hollowdb.js'), 'utf8');
    prover = new Prover(constants.GROTH16_WASM_PATH, constants.GROTH16_PROVERKEY_PATH, 'groth16');
  });

  const tests = ['redis', 'lmdb', 'default'] as const;
  describe.each(tests)('using %s cache, proofs enabled', cacheType => {
    let ownerAdmin: Admin<ValueType>;
    let aliceSDK: SDK<ValueType>;
    let ownerAddress: string;
    let aliceAddress: string;
    let warp: Warp;
    let redisClient: Redis;

    const KEY_PREIMAGE = BigInt('0x' + randomBytes(10).toString('hex'));
    const KEY = computeKey(KEY_PREIMAGE);
    const VALUE: ValueType = {
      val: randomBytes(10).toString('hex'),
    };
    const NEXT_VALUE: ValueType = {
      val: randomBytes(10).toString('hex'),
    };

    beforeAll(async () => {
      // setup warp factory for local arweave
      warp = WarpFactory.forLocal(constants.ARWEAVE_PORT).use(new DeployPlugin());

      // disable Warp logs
      LoggerFactory.INST.logLevel('none');

      // get accounts
      const ownerWallet = await warp.generateWallet();
      const aliceWallet = await warp.generateWallet();

      // deploy contract
      const {contractTxId: hollowDBTxId} = await Admin.deploy(
        ownerWallet.jwk,
        initialState,
        contractSource,
        warp,
        true // bundling is disabled during testing
      );

      // setup cache
      if (cacheType === 'redis') {
        redisClient = new Redis(globals.__REDIS_URL__, {lazyConnect: true});
      }
      overrideCache(warp, hollowDBTxId, cacheType, {}, cacheType === 'redis' ? redisClient : undefined);
      if (cacheType === 'redis') {
        await redisClient.connect();
      }
      LoggerFactory.INST.logLevel('none');

      ownerAdmin = new Admin(ownerWallet.jwk, hollowDBTxId, warp);
      aliceSDK = new SDK(aliceWallet.jwk, hollowDBTxId, warp);
      ownerAddress = ownerWallet.address;
      aliceAddress = aliceWallet.address;

      const contractTx = await warp.arweave.transactions.get(hollowDBTxId);
      expect(contractTx).not.toBeNull();
    });

    it('should succesfully deploy with correct state', async () => {
      const {cachedValue} = await ownerAdmin.readState();
      expect(cachedValue.state.verificationKeys.auth).toEqual(null);
      expect(cachedValue.state.isProofRequired.auth).toEqual(true);
      expect(cachedValue.state.isWhitelistRequired.put).toEqual(false);
      expect(cachedValue.state.isWhitelistRequired.update).toEqual(false);
      expect(cachedValue.state.owner).toEqual(ownerAddress);
    });

    describe('admin operations', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let verificationKey: any;

      beforeAll(() => {
        verificationKey = JSON.parse(
          fs.readFileSync(path.join(__dirname, '../' + constants.GROTH16_VERIFICATIONKEY_PATH), 'utf8')
        );
      });

      it('should set verification key', async () => {
        await ownerAdmin.updateVerificationKey('auth', verificationKey);
        const {cachedValue} = await ownerAdmin.readState();
        expect(cachedValue.state.verificationKeys.auth).toEqual(verificationKey);
      });
    });

    describe('put operations', () => {
      it('should put a value to a key & read it', async () => {
        expect(await ownerAdmin.get(KEY)).toEqual(null);
        await ownerAdmin.put(KEY, VALUE);
        expect(await ownerAdmin.get(KEY)).toEqual(VALUE);
        expect((await ownerAdmin.getKVMap()).get(KEY)).toEqual(VALUE);
      });

      it('should NOT put a value to the same key', async () => {
        await expect(ownerAdmin.put(KEY, VALUE)).rejects.toThrow(
          'Contract Error [put]: Key already exists, use update instead'
        );
      });

      it('should put many values', async () => {
        const values = Array<ValueType>(10).fill({
          val: randomBytes(10).toString('hex'),
        });

        for (let i = 0; i < values.length; ++i) {
          const k = KEY + i;
          const v = values[i];
          expect(await ownerAdmin.get(k)).toEqual(null);
          await ownerAdmin.put(k, v);
          expect(await ownerAdmin.get(k)).toEqual(v);
        }

        const kvMap = await ownerAdmin.getKVMap();
        for (let i = 0; i < values.length; ++i) {
          const k = KEY + i;
          const v = values[i];
          expect(kvMap.get(k)).toEqual(v);
        }
      });
    });

    describe('update operations', () => {
      let proof: object;

      beforeAll(async () => {
        const currentValue = await aliceSDK.get(KEY);
        const fullProof = await prover.generateProof(KEY_PREIMAGE, currentValue, NEXT_VALUE);
        proof = fullProof.proof;
        expect(prover.valueToBigInt(currentValue).toString()).toEqual(fullProof.publicSignals[0]);
        expect(prover.valueToBigInt(NEXT_VALUE).toString()).toEqual(fullProof.publicSignals[1]);
        expect(KEY).toEqual(decimalToHex(fullProof.publicSignals[2]));
      });

      it('should NOT update with a proof using wrong current value', async () => {
        const {proof} = await prover.generateProof(KEY_PREIMAGE, 'abcdefg', NEXT_VALUE);
        await expect(aliceSDK.update(KEY, NEXT_VALUE, proof)).rejects.toThrow();
      });

      it('should NOT update with a proof using wrong next value', async () => {
        const {proof} = await prover.generateProof(KEY_PREIMAGE, VALUE, 'abcdefg');
        await expect(aliceSDK.update(KEY, NEXT_VALUE, proof)).rejects.toThrow();
      });

      it('should NOT update with a proof using wrong preimage', async () => {
        const {proof} = await prover.generateProof(1234567n, VALUE, NEXT_VALUE);
        await expect(aliceSDK.update(KEY, NEXT_VALUE, proof)).rejects.toThrow();
      });

      it('should NOT update an existing value without a proof', async () => {
        await expect(aliceSDK.update(KEY, NEXT_VALUE)).rejects.toThrow();
      });

      it('should update an existing value with proof', async () => {
        await aliceSDK.update(KEY, NEXT_VALUE, proof);
        expect(await aliceSDK.get(KEY)).toEqual(NEXT_VALUE);
      });

      it('should NOT update an existing value with the same proof', async () => {
        await expect(aliceSDK.update(KEY, NEXT_VALUE, proof)).rejects.toThrow(
          'Contract Error [update]: Proof verification failed in: update'
        );
      });
    });

    describe('remove operations', () => {
      let proof: object;

      beforeAll(async () => {
        const currentValue = await aliceSDK.get(KEY);
        const fullProof = await prover.generateProof(KEY_PREIMAGE, currentValue, null);
        proof = fullProof.proof;

        expect(prover.valueToBigInt(currentValue).toString()).toEqual(fullProof.publicSignals[0]);
        expect('0').toEqual(fullProof.publicSignals[1]);
        expect(KEY).toEqual(decimalToHex(fullProof.publicSignals[2]));
      });

      it('should remove an existing value with proof', async () => {
        expect(await aliceSDK.get(KEY)).not.toEqual(null);
        await aliceSDK.remove(KEY, proof);
        expect(await aliceSDK.get(KEY)).toEqual(null);
      });

      it('should NOT remove an already removed value with proof', async () => {
        expect(await aliceSDK.get(KEY)).toEqual(null);
        await expect(aliceSDK.remove(KEY, proof)).rejects.toThrow('Key does not exist');
      });
    });

    describe('tests with proofs disabled', () => {
      const KEY_PREIMAGE = BigInt('0x' + randomBytes(10).toString('hex'));
      const KEY = computeKey(KEY_PREIMAGE);
      const VALUE = {
        val: randomBytes(10).toString('hex'),
      };
      const NEXT_VALUE = {
        val: randomBytes(10).toString('hex'),
      };

      beforeAll(async () => {
        await disableProofs(ownerAdmin);
      });

      it('should put a value to a key & read it', async () => {
        expect(await ownerAdmin.get(KEY)).toEqual(null);
        await ownerAdmin.put(KEY, VALUE);
        expect(await ownerAdmin.get(KEY)).toEqual(VALUE);
      });

      it('should update an existing value without proof', async () => {
        await aliceSDK.update(KEY, NEXT_VALUE);
        expect(await aliceSDK.get(KEY)).toEqual(NEXT_VALUE);
      });

      it('should remove an existing value without proof', async () => {
        expect(await aliceSDK.get(KEY)).not.toEqual(null);
        await aliceSDK.remove(KEY);
        expect(await aliceSDK.get(KEY)).toEqual(null);
      });

      describe('tests with whitelisting', () => {
        const KEY_PREIMAGE = BigInt('0x' + randomBytes(10).toString('hex'));
        const KEY = computeKey(KEY_PREIMAGE);
        const VALUE = {
          val: randomBytes(16).toString('hex'),
        };
        const NEXT_VALUE = {
          val: randomBytes(16).toString('hex'),
        };

        beforeAll(async () => {
          await enableWhitelisting(ownerAdmin);
        });

        it('should NOT put/update/remove when NOT whitelisted', async () => {
          await expect(aliceSDK.put(KEY, VALUE)).rejects.toThrow(
            'Contract Error [put]: User is not whitelisted for: put'
          );
          await expect(aliceSDK.update(KEY, NEXT_VALUE, {})).rejects.toThrow(
            'Contract Error [update]: User is not whitelisted for: update'
          );
          await expect(aliceSDK.remove(KEY, {})).rejects.toThrow(
            'Contract Error [remove]: User is not whitelisted for: remove'
          );
        });

        it('should whitelist user Alice', async () => {
          await addToWhitelist(ownerAdmin, aliceAddress);
        });

        it('should put/update/remove when whitelisted', async () => {
          await aliceSDK.put(KEY, VALUE);
          await aliceSDK.update(KEY, NEXT_VALUE, {});
          await aliceSDK.remove(KEY, {});
        });

        it('should remove whitelisted user Alice', async () => {
          await removeFromWhitelist(ownerAdmin, aliceAddress);
        });

        afterAll(async () => {
          await disableWhitelisting(ownerAdmin);
        });
      });

      afterAll(async () => {
        await enableProofs(ownerAdmin);
      });
    });

    afterAll(async () => {
      if (cacheType === 'redis') {
        const response = await redisClient.quit();
        expect(response).toBe('OK');
      }
    });
  });

  afterAll(async () => {
    await arlocal.stop();
  });
});
