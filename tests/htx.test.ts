import fs from 'fs';
import {Prover, hashToGroup} from 'hollowdb-prover';
import constants from './constants';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {SDK} from '../src/hollowdb';
import {MockBundlr} from './mock/bundlr';
import {hollowdbHtx as initialState} from '../src/contracts/states/';

type ValueType = {val: string};
type HTXValueType = `${string}.${string}`;

describe('hash.txid value tests', () => {
  const PROTOCOL = 'groth16';
  const mockBundlr = new MockBundlr<ValueType>();
  const warpHook = setupWarp();
  const prover = new Prover(
    constants.PROVERS[PROTOCOL].HOLLOWDB.WASM_PATH,
    constants.PROVERS[PROTOCOL].HOLLOWDB.PROVERKEY_PATH,
    PROTOCOL
  );

  let owner: SDK<HTXValueType>;

  const {KEY, KEY_PREIMAGE, VALUE, NEXT_VALUE} = createValues();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, initialState, 'hollowdb-htx');

    owner = new SDK(ownerWallet.jwk, contractTxId, hook.warp);
  });

  it('should set verification key', async () => {
    const verificationKey = JSON.parse(
      fs.readFileSync(constants.PROVERS[PROTOCOL].HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8')
    );
    await owner.admin.updateVerificationKey('auth', verificationKey);
    const {cachedValue} = await owner.base.readState();
    expect(cachedValue.state.verificationKeys.auth).toEqual(verificationKey);
  });

  it('should allow putting without a proof', async () => {
    const txId = mockBundlr.upload(VALUE);
    const valueHash = '0x' + hashToGroup(JSON.stringify(VALUE)).toString(16);

    const val: HTXValueType = `${valueHash}.${txId}`;
    await owner.put(KEY, val);
    expect(await owner.get(KEY)).toEqual(val);
  });

  it('should update an existing value with proof', async () => {
    const txId = mockBundlr.upload(NEXT_VALUE);
    const valueHash = '0x' + hashToGroup(JSON.stringify(NEXT_VALUE)).toString(16);

    const curHTX = await owner.get(KEY);
    const [curValueHash] = curHTX!.split('.');

    const {proof} = await prover.proveHashed(KEY_PREIMAGE, BigInt(curValueHash), BigInt(valueHash));
    const val: HTXValueType = `${valueHash}.${txId}`;
    await owner.update(KEY, val, proof);
    expect(await owner.get(KEY)).toEqual(val);
  });

  it('should remove an existing value with proof', async () => {
    const curHTX = await owner.get(KEY);
    const [curValueHash] = curHTX!.split('.');

    const {proof} = await prover.proveHashed(KEY_PREIMAGE, BigInt(curValueHash), BigInt(0));
    await owner.remove(KEY, proof);
    expect(await owner.get(KEY)).toEqual(null);
  });

  describe('disabling proofs', () => {
    const {VALUE, NEXT_VALUE, KEY} = createValues();

    beforeAll(async () => {
      const state = await owner.getState();
      expect(state.isProofRequired.auth).toEqual(true);

      await owner.admin.updateProofRequirement('auth', false);

      const newState = await owner.getState();
      expect(newState.isProofRequired.auth).toEqual(false);
    });

    it('should put a value to a key & read it', async () => {
      const txId = mockBundlr.upload(VALUE);
      const valueHash = '0x' + hashToGroup(JSON.stringify(VALUE)).toString(16);

      const val: HTXValueType = `${valueHash}.${txId}`;
      expect(await owner.get(KEY)).toEqual(null);
      await owner.put(KEY, val);
      expect(await owner.get(KEY)).toEqual(val);
    });

    it('should update an existing value without proof', async () => {
      const txId = mockBundlr.upload(NEXT_VALUE);
      const valueHash = '0x' + hashToGroup(JSON.stringify(NEXT_VALUE)).toString(16);

      const val: HTXValueType = `${valueHash}.${txId}`;
      await owner.update(KEY, val);
      expect(await owner.get(KEY)).toEqual(val);
    });

    it('should remove an existing value without proof', async () => {
      expect(await owner.get(KEY)).not.toEqual(null);
      await owner.remove(KEY);
      expect(await owner.get(KEY)).toEqual(null);
    });
  });
});
