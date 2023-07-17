import fs from 'fs';
import {Prover} from './utils/prover';
import constants from './constants';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {Admin} from '../src/hollowdb';
import {MockBundlr} from './mock/bundlr';

type ValueType = {val: string};
type HTXValueType = `${string}.${string}`;

describe('hash.txid value tests', () => {
  const mockBundlr = new MockBundlr<ValueType>();
  const warpHook = setupWarp();
  const prover = new Prover(
    constants.PROVERS.plonk.HOLLOWDB.WASM_PATH,
    constants.PROVERS.plonk.HOLLOWDB.PROVERKEY_PATH,
    'plonk'
  );

  let owner: Admin<HTXValueType>;

  const {KEY, KEY_PREIMAGE, VALUE, NEXT_VALUE} = createValues<ValueType>();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk);

    owner = new Admin(ownerWallet.jwk, contractTxId, hook.warp);
  });

  it('should set verification key', async () => {
    const verificationKey = JSON.parse(fs.readFileSync(constants.PROVERS.plonk.HOLLOWDB.VERIFICATIONKEY_PATH, 'utf8'));
    await owner.updateVerificationKey('auth', verificationKey);
    const {cachedValue} = await owner.readState();
    expect(cachedValue.state.verificationKeys.auth).toEqual(verificationKey);
  });

  it('should allow putting without a proof', async () => {
    // upload to bundlr
    const txId = mockBundlr.upload(VALUE);
    // obtain hash
    const valueHash = '0x' + prover.valueToBigInt(VALUE).toString(16);

    // construct hash.txid
    const val: HTXValueType = `${valueHash}.${txId}`;
    await owner.put(KEY, val);
    expect(await owner.get(KEY)).toEqual(val);
  });

  it('should update an existing value with proof', async () => {
    // upload to bundlr
    const txId = mockBundlr.upload(NEXT_VALUE);
    // obtain hash
    const valueHash = '0x' + prover.valueToBigInt(NEXT_VALUE).toString(16);

    // get old hash from db
    const curHTX = await owner.get(KEY);
    const [curValueHash] = '0x' + curHTX.split('.');

    // construct hash.txid
    const val: HTXValueType = `${valueHash}.${txId}`;

    const {proof} = await prover.generateProofImmediate(KEY_PREIMAGE, BigInt(curValueHash), BigInt(valueHash));
    await owner.update(KEY, val, proof);
    expect(await owner.get(KEY)).toEqual(val);
  });

  it('should remove an existing value with proof', async () => {
    // get old hash from db
    const curHTX = await owner.get(KEY);
    const [curValueHash] = '0x' + curHTX.split('.');

    const {proof} = await prover.generateProofImmediate(KEY_PREIMAGE, BigInt(curValueHash), BigInt(0));
    await owner.remove(KEY, proof);
    expect(await owner.get(KEY)).toEqual(null);
  });
});
