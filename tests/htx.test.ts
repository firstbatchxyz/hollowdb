import fs from 'fs';
import {Prover} from './utils/prover';
import constants from './constants';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {Admin} from '../src/hollowdb';
import {MockBundlr} from './mock/bundlr';
import initialHollowState from '../src/contracts/states/hollowdb';

type ValueType = {val: string};
type HTXValueType = `${string}.${string}`;

const PROTOCOL = 'groth16';
describe('hash.txid value tests', () => {
  const mockBundlr = new MockBundlr<ValueType>();
  const warpHook = setupWarp();
  const prover = new Prover(
    constants.PROVERS[PROTOCOL].HOLLOWDB.WASM_PATH,
    constants.PROVERS[PROTOCOL].HOLLOWDB.PROVERKEY_PATH,
    PROTOCOL
  );

  let owner: Admin<HTXValueType>;

  const {KEY, KEY_PREIMAGE, VALUE, NEXT_VALUE} = createValues<ValueType>();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, initialHollowState, 'hollowdb-htx');

    owner = new Admin(ownerWallet.jwk, contractTxId, hook.warp);
  });

  it('should set verification key', async () => {
    const verificationKey = JSON.parse(
      fs.readFileSync(constants.PROVERS[PROTOCOL].HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8')
    );
    await owner.updateVerificationKey('auth', verificationKey);
    const {cachedValue} = await owner.readState();
    expect(cachedValue.state.verificationKeys.auth).toEqual(verificationKey);
  });

  it('should allow putting without a proof', async () => {
    const txId = mockBundlr.upload(VALUE);
    const valueHash = '0x' + prover.valueToBigInt(VALUE).toString(16);

    const val: HTXValueType = `${valueHash}.${txId}`;
    await owner.put(KEY, val);
    expect(await owner.get(KEY)).toEqual(val);
  });

  it('should update an existing value with proof', async () => {
    const txId = mockBundlr.upload(NEXT_VALUE);
    const valueHash = '0x' + prover.valueToBigInt(NEXT_VALUE).toString(16);

    const curHTX = await owner.get(KEY);
    const [curValueHash] = curHTX.split('.');

    const {proof} = await prover.generateProofImmediate(KEY_PREIMAGE, BigInt(curValueHash), BigInt(valueHash));
    const val: HTXValueType = `${valueHash}.${txId}`;
    await owner.update(KEY, val, proof);
    expect(await owner.get(KEY)).toEqual(val);
  });

  it('should remove an existing value with proof', async () => {
    const curHTX = await owner.get(KEY);
    const [curValueHash] = curHTX.split('.');

    const {proof} = await prover.generateProofImmediate(KEY_PREIMAGE, BigInt(curValueHash), BigInt(0));
    await owner.remove(KEY, proof);
    expect(await owner.get(KEY)).toEqual(null);
  });

  describe('disabling proofs', () => {
    const {VALUE, NEXT_VALUE} = createValues<ValueType>();
    const KEY = 'some-non-bigint-friendly-key';

    beforeAll(async () => {
      const {cachedValue} = await owner.readState();
      expect(cachedValue.state.isProofRequired.auth).toEqual(true);

      await owner.updateProofRequirement('auth', false);

      const {cachedValue: newCachedValue} = await owner.readState();
      expect(newCachedValue.state.isProofRequired.auth).toEqual(false);
    });

    it('should put a value to a key & read it', async () => {
      const txId = mockBundlr.upload(VALUE);
      const valueHash = '0x' + prover.valueToBigInt(VALUE).toString(16);

      const val: HTXValueType = `${valueHash}.${txId}`;
      expect(await owner.get(KEY)).toEqual(null);
      await owner.put(KEY, val);
      expect(await owner.get(KEY)).toEqual(val);
    });

    it('should update an existing value without proof', async () => {
      const txId = mockBundlr.upload(NEXT_VALUE);
      const valueHash = '0x' + prover.valueToBigInt(NEXT_VALUE).toString(16);

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
