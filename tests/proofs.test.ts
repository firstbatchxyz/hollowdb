import fs from 'fs';
import {Prover} from 'hollowdb-prover';
import constants from './constants';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {SDK} from '../src/hollowdb';
import {hollowdb as initialState} from '../src/contracts/states/';

type ValueType = {val: string};
describe('proofs mode', () => {
  describe.each(['groth16', 'plonk'] as const)('protocol: %s', protocol => {
    const warpHook = setupWarp();
    let prover: Prover;
    let owner: SDK<ValueType>;
    let alice: SDK<ValueType>;

    const {KEY, KEY_PREIMAGE, VALUE, NEXT_VALUE} = createValues();

    beforeAll(async () => {
      const hook = warpHook();
      const [ownerWallet, aliceWallet] = hook.wallets;
      const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, initialState);

      prover = new Prover(
        constants.PROVERS[protocol].HOLLOWDB.WASM_PATH,
        constants.PROVERS[protocol].HOLLOWDB.PROVERKEY_PATH,
        protocol
      );

      owner = new SDK(ownerWallet.jwk, contractTxId, hook.warp);
      alice = new SDK(aliceWallet.jwk, contractTxId, hook.warp);
    });

    it('should deploy with correct state', async () => {
      const state = await owner.getState();
      expect(state.verificationKeys.auth).toEqual(null);
      expect(state.isProofRequired.auth).toEqual(true);
      expect(state.isWhitelistRequired.put).toEqual(false);
      expect(state.isWhitelistRequired.update).toEqual(false);
    });

    it('should set verification key', async () => {
      const verificationKey = JSON.parse(
        fs.readFileSync(constants.PROVERS[protocol].HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8')
      );
      await owner.admin.updateVerificationKey('auth', verificationKey);
      const state = await owner.getState();
      expect(state.verificationKeys.auth).toEqual(verificationKey);
    });

    it('should allow putting without a proof', async () => {
      expect(await alice.get(KEY)).toEqual(null);
      await alice.put(KEY, VALUE);
      expect(await alice.get(KEY)).toEqual(VALUE);
    });

    describe('update operations', () => {
      it('should NOT update with a proof using wrong current value', async () => {
        const fullProof = await prover.prove(KEY_PREIMAGE, 'abcdefg', NEXT_VALUE);
        await expect(alice.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
        );
      });

      it('should NOT update with a proof using wrong next value', async () => {
        const fullProof = await prover.prove(KEY_PREIMAGE, VALUE, 'abcdefg');
        await expect(alice.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
        );
      });

      it('should NOT update with a proof using wrong preimage', async () => {
        const fullProof = await prover.prove(1234567n, VALUE, NEXT_VALUE);
        await expect(alice.update(KEY, NEXT_VALUE, fullProof.proof)).rejects.toThrow(
          'Contract Error [update]: Invalid proof.'
        );
      });

      it('should NOT update an existing value without a proof', async () => {
        await expect(alice.update(KEY, NEXT_VALUE)).rejects.toThrow('Contract Error [update]: Expected a proof.');
      });

      it('should update an existing value with proof', async () => {
        const {proof} = await prover.prove(KEY_PREIMAGE, VALUE, NEXT_VALUE);
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
        const {proof} = await prover.prove(KEY_PREIMAGE, NEXT_VALUE, null);

        expect(await alice.get(KEY)).toEqual(NEXT_VALUE);
        await alice.remove(KEY, proof);
        expect(await alice.get(KEY)).toEqual(null);
      });
    });

    describe('disabling proofs', () => {
      const {VALUE, NEXT_VALUE} = createValues();
      const KEY = 'some-non-bigint-friendly-key';

      beforeAll(async () => {
        const state = await owner.getState();
        expect(state.isProofRequired.auth).toEqual(true);

        await owner.admin.updateProofRequirement('auth', false);

        const newState = await owner.getState();
        expect(newState.isProofRequired.auth).toEqual(false);
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
});
