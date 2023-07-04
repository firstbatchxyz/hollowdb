import fs from 'fs';
import {Prover} from './utils/prover';
import {computeKey} from './utils/computeKey';
import {randomBytes} from 'crypto';
import constants from './constants';
import {decimalToHex} from './utils';
import {disableProofs, enableProofs} from './utils/proofs';
import {addToWhitelist, disableWhitelisting, enableWhitelisting, removeFromWhitelist} from './utils/whitelisting';
import {setupArlocal, setupWarpAndHollowdb} from './common';
import {Admin, SDK} from '../src/hollowdb';

describe('hollowdb', () => {
  let prover: Prover;
  type ValueType = {
    val: string;
  };
  const KEY_PREIMAGE = BigInt('0x' + randomBytes(10).toString('hex'));
  const KEY = computeKey(KEY_PREIMAGE);
  const VALUE: ValueType = {
    val: randomBytes(10).toString('hex'),
  };
  const NEXT_VALUE: ValueType = {
    val: randomBytes(10).toString('hex'),
  };

  const PORT = setupArlocal(0);

  beforeAll(async () => {
    const proofSystem = 'groth16';
    prover = new Prover(
      constants.PROVERS[proofSystem].HOLLOWDB.WASM_PATH,
      constants.PROVERS[proofSystem].HOLLOWDB.PROVERKEY_PATH,
      proofSystem
    );
  });

  const tests = ['redis' /* , 'lmdb', 'default'*/] as const;
  describe.each(tests)('using %s cache, proofs enabled', cacheType => {
    const getHollowUsers = setupWarpAndHollowdb<ValueType>(PORT, cacheType);
    let ownerAdmin: Admin<ValueType>;
    let aliceSDK: SDK<ValueType>;
    let ownerAddress: string;
    let aliceAddress: string;

    beforeAll(() => {
      const hollowUsers = getHollowUsers();
      ownerAdmin = hollowUsers.ownerAdmin;
      ownerAddress = hollowUsers.ownerAddress;
      aliceSDK = hollowUsers.aliceSDK;
      aliceAddress = hollowUsers.aliceAddress;
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
        verificationKey = JSON.parse(fs.readFileSync(constants.PROVERS.groth16.HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8'));
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
      });

      it('should NOT put a value to the same key', async () => {
        await expect(ownerAdmin.put(KEY, VALUE)).rejects.toThrow('Contract Error [put]: Key already exists.');
      });

      it('should put many values', async () => {
        const count = 10;
        const values = Array<ValueType>(count).fill({
          val: randomBytes(10).toString('hex'),
        });

        for (let i = 0; i < values.length; ++i) {
          const k = KEY + i;
          const v = values[i];
          expect(await ownerAdmin.get(k)).toEqual(null);
          await ownerAdmin.put(k, v);
          expect(await ownerAdmin.get(k)).toEqual(v);
        }
      });
    });

    describe('update operations', () => {
      let proof: object;

      beforeAll(async () => {
        const currentValue = await aliceSDK.get(KEY);
        const fullProof = await prover.generateProof(KEY_PREIMAGE, currentValue, NEXT_VALUE);
        expect(prover.valueToBigInt(currentValue).toString()).toEqual(fullProof.publicSignals[0]);
        expect(prover.valueToBigInt(NEXT_VALUE).toString()).toEqual(fullProof.publicSignals[1]);
        expect(KEY).toEqual(decimalToHex(fullProof.publicSignals[2]));
        proof = fullProof.proof;
      });

      it('should NOT update with a proof using wrong current value', async () => {
        const fullProof = await prover.generateProof(KEY_PREIMAGE, 'abcdefg', NEXT_VALUE);
        await expect(aliceSDK.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow();
      });

      it('should NOT update with a proof using wrong next value', async () => {
        const fullProof = await prover.generateProof(KEY_PREIMAGE, VALUE, 'abcdefg');
        await expect(aliceSDK.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow();
      });

      it('should NOT update with a proof using wrong preimage', async () => {
        const fullProof = await prover.generateProof(1234567n, VALUE, NEXT_VALUE);
        await expect(aliceSDK.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow();
      });

      it('should NOT update an existing value without a proof', async () => {
        await expect(aliceSDK.update(KEY, NEXT_VALUE, {})).rejects.toThrow();
      });

      it('should update an existing value with proof', async () => {
        await aliceSDK.update(KEY, NEXT_VALUE, proof);
        expect(await aliceSDK.get(KEY)).toEqual(NEXT_VALUE);
      });

      it('should NOT update an existing value with the same proof', async () => {
        await expect(aliceSDK.update(KEY, NEXT_VALUE, proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
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

      it('should NOT remove an already remove value with proof', async () => {
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
          await expect(aliceSDK.put(KEY, VALUE)).rejects.toThrow('Contract Error [put]: Not whitelisted.');
          await expect(aliceSDK.update(KEY, NEXT_VALUE, {})).rejects.toThrow(
            'Contract Error [update]: Not whitelisted.'
          );
          await expect(aliceSDK.remove(KEY, {})).rejects.toThrow('Contract Error [remove]: Not whitelisted.');
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
  });
});
