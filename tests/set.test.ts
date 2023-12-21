import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {hollowdb as initialState} from '../src/contracts/states';
import {SetSDK} from '../src';

type ValueType = {val: string};

describe('set tests', () => {
  const warpHook = setupWarp();
  let owner: SetSDK<ValueType>;

  const {KEY, VALUE, NEXT_VALUE} = createValues();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, initialState, 'hollowdb-set');

    owner = new SetSDK(ownerWallet.jwk, contractTxId, hook.warp);
  });

  it('should allow putting a value', async () => {
    await owner.put(KEY, VALUE);
  });

  it('should NOT allow putting a value again', async () => {
    await expect(owner.put(KEY, NEXT_VALUE)).rejects.toThrow('Contract Error [put]: Key already exists.');
  });

  it('should allow setting a value at an existing key', async () => {
    await owner.set(KEY, VALUE);
  });

  it('should allow setting a value at a new key', async () => {
    const newKV = createValues();
    await owner.set(newKV.KEY, newKV.VALUE);
  });

  it('should allow setting many values', async () => {
    const kvs = Array.from({length: 5}, () => createValues());
    await owner.setMany(
      kvs.map(kv => kv.KEY),
      kvs.map(kv => kv.VALUE)
    );
  });
});
