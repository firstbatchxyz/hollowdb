import fs from 'fs';
import {Prover} from 'hollowdb-prover';
import constants from './constants';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {SDK} from '../src/hollowdb';
import {hollowdb as initialState} from '../src/contracts/states/';

// adding `null` to type for testing purposes
// it is not allowed normally
type ValueType = {val: string} | null;

describe('null value tests with proofs', () => {
  const warpHook = setupWarp();
  const protocol = 'groth16';
  let prover: Prover;
  let owner: SDK<ValueType>;

  const {KEY, KEY_PREIMAGE, VALUE, NEXT_VALUE} = createValues<ValueType>();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, initialState);

    prover = new Prover(
      constants.PROVERS[protocol].HOLLOWDB.WASM_PATH,
      constants.PROVERS[protocol].HOLLOWDB.PROVERKEY_PATH,
      protocol
    );

    owner = new SDK(ownerWallet.jwk, contractTxId, hook.warp);
  });

  it('should set verification key', async () => {
    const verificationKey = JSON.parse(
      fs.readFileSync(constants.PROVERS[protocol].HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8')
    );
    await owner.admin.updateVerificationKey('auth', verificationKey);
    const state = await owner.getState();
    expect(state.verificationKeys.auth).toEqual(verificationKey);
  });

  it('should NOT allow putting a null value', async () => {
    await expect(owner.put(KEY, null)).rejects.toThrow('Contract Error [put]: Value cant be null, use remove instead.');
  });

  it('should allow putting without a proof', async () => {
    await owner.put(KEY, VALUE);
  });

  it('should NOT allow updating to null with a proof', async () => {
    const {proof} = await prover.prove(KEY_PREIMAGE, VALUE, null);
    await expect(owner.update(KEY, null, proof)).rejects.toThrow(
      'Contract Error [update]: Value cant be null, use remove instead.'
    );
  });

  it('should allow removing with a proof', async () => {
    const {proof} = await prover.prove(KEY_PREIMAGE, VALUE, null);
    await owner.remove(KEY, proof);
  });

  it('should allow putting again to a removed key without a proof', async () => {
    await owner.put(KEY, NEXT_VALUE);
  });
});
