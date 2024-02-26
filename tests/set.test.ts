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
    const value = await owner.get(KEY);
    expect(value?.val).toBe(VALUE.val);
  });

  it('should NOT allow putting a value again', async () => {
    await expect(owner.put(KEY, NEXT_VALUE)).rejects.toThrow('Contract Error [put]: Key already exists.');
  });

  it('should allow setting a value at an existing key', async () => {
    await owner.set(KEY, NEXT_VALUE);
    const value = await owner.get(KEY);
    expect(value?.val).toBe(NEXT_VALUE.val);
  });

  it('should allow setting a value at a new key', async () => {
    const newKV = createValues();
    await owner.set(newKV.KEY, newKV.VALUE);
    const value = await owner.get(newKV.KEY);
    expect(value?.val).toBe(newKV.VALUE.val);
  });

  it('should allow setting many values', async () => {
    const kvs = Array.from({length: 5}, () => createValues());

    const keys = kvs.map(kv => kv.KEY);
    const values = kvs.map(kv => kv.VALUE);
    await owner.setMany(keys, values);

    const results = await owner.getMany(keys);
    expect(results.length).toBe(values.length);
    for (let i = 0; i < results.length; i++) {
      expect(results[i]?.val).toBe(values[i].val);
    }
  });

  it('should allow overwriting contract state', async () => {
    const oldState = await owner.getState();
    const newVersion = 'im-overwritten-oh-no';
    await owner.setState({
      ...oldState,
      version: newVersion,
    });

    const newState = await owner.getState();
    expect(newState.version).toBe(newVersion);

    // this kind of acts like a kill switch
    // you should NOT reset the state like this
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    await owner.setState({});
    const emptyState = await owner.getState();
    expect(JSON.stringify(emptyState)).toBe('{}');
  });
});
