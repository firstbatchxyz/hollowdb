import fs from 'fs';
import {Prover} from './utils/prover';
import constants from './constants';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {Admin, SDK} from '../src/hollowdb';

describe('proofs mode', () => {
  describe.each(['groth16', 'plonk'] as const)('protocol: %s', protocol => {
    const warpHook = setupWarp();
    const prover = new Prover(
      constants.PROVERS[protocol].HOLLOWDB.WASM_PATH,
      constants.PROVERS[protocol].HOLLOWDB.PROVERKEY_PATH,
      protocol
    );
    type ValueType = {
      val: string;
    };

    let owner: Admin<ValueType>;
    let alice: SDK<ValueType>;

    const {KEY, KEY_PREIMAGE, VALUE, NEXT_VALUE} = createValues<ValueType>();

    beforeAll(async () => {
      const hook = warpHook();
      const [ownerWallet, aliceWallet] = hook.wallets;
      const contractTxId = await deployContract(hook.warp, ownerWallet.jwk);

      owner = new Admin(ownerWallet.jwk, contractTxId, hook.warp);
      alice = new SDK(aliceWallet.jwk, contractTxId, hook.warp);
    });

    it('should deploy with correct state', async () => {
      const {cachedValue} = await owner.readState();
      expect(cachedValue.state.verificationKeys.auth).toEqual(null);
      expect(cachedValue.state.isProofRequired.auth).toEqual(true);
      expect(cachedValue.state.isWhitelistRequired.put).toEqual(false);
      expect(cachedValue.state.isWhitelistRequired.update).toEqual(false);
    });

    it('should set verification key', async () => {
      const verificationKey = JSON.parse(
        fs.readFileSync(constants.PROVERS[protocol].HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8')
      );
      await owner.updateVerificationKey('auth', verificationKey);
      const {cachedValue} = await owner.readState();
      expect(cachedValue.state.verificationKeys.auth).toEqual(verificationKey);
    });

    it('should allow putting without a proof', async () => {
      expect(await alice.get(KEY)).toEqual(null);
      await alice.put(KEY, VALUE);
      expect(await alice.get(KEY)).toEqual(VALUE);
    });

    describe('update operations', () => {
      it('should NOT update with a proof using wrong current value', async () => {
        const fullProof = await prover.generateProof(KEY_PREIMAGE, 'abcdefg', NEXT_VALUE);
        await expect(alice.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
        );
      });

      it('should NOT update with a proof using wrong next value', async () => {
        const fullProof = await prover.generateProof(KEY_PREIMAGE, VALUE, 'abcdefg');
        await expect(alice.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
        );
      });

      it('should NOT update with a proof using wrong preimage', async () => {
        const fullProof = await prover.generateProof(1234567n, VALUE, NEXT_VALUE);
        await expect(alice.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
        );
      });

      it('should NOT update an existing value without a proof', async () => {
        await expect(alice.update(KEY, NEXT_VALUE)).rejects.toThrow('Contract Error [update]: Expected a proof.');
      });

      it('should update an existing value with proof', async () => {
        const {proof} = await prover.generateProof(KEY_PREIMAGE, VALUE, NEXT_VALUE);
        await alice.update(KEY, NEXT_VALUE, proof);
        expect(await alice.get(KEY)).toEqual(NEXT_VALUE);
      });
    });

    describe('remove operations', () => {
      it('should NOT remove an existing value without proof', async () => {
        await expect(alice.remove(KEY)).rejects.toThrow('Contract Error [remove]: Expected a proof.');
      });

      it('should remove an existing value with proof', async () => {
        // MEXT_VALUE is the "current" value at this point in the test
        const {proof} = await prover.generateProof(KEY_PREIMAGE, NEXT_VALUE, null);

        expect(await alice.get(KEY)).toEqual(NEXT_VALUE);
        await alice.remove(KEY, proof);
        expect(await alice.get(KEY)).toEqual(null);
      });
    });

    describe('disabling proofs', () => {
      const {KEY, VALUE, NEXT_VALUE} = createValues<ValueType>();

      beforeAll(async () => {
        const {cachedValue} = await owner.readState();
        expect(cachedValue.state.isProofRequired.auth).toEqual(true);

        await owner.updateProofRequirement('auth', false);

        const {cachedValue: newCachedValue} = await owner.readState();
        expect(newCachedValue.state.isProofRequired.auth).toEqual(false);
      });

      it('should put a value to a key & read it', async () => {
        expect(await owner.get(KEY)).toEqual(null);
        await owner.put(KEY, VALUE);
        expect(await owner.get(KEY)).toEqual(VALUE);
      });

      it('should update an existing value without proof', async () => {
        await alice.update(KEY, NEXT_VALUE);
        expect(await alice.get(KEY)).toEqual(NEXT_VALUE);
      });

      it('should remove an existing value without proof', async () => {
        expect(await alice.get(KEY)).not.toEqual(null);
        await alice.remove(KEY);
        expect(await alice.get(KEY)).toEqual(null);
      });
    });
  });

  afterAll(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    await globalThis.curve_bn128.terminate();
  });
});
