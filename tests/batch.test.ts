import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {hollowdb as initialState} from '../src/contracts/states';
import {SDK} from '../src';

type ValueType = {val: string};

describe('batched requests', () => {
  const warpHook = setupWarp();
  let owner: SDK<ValueType>;

  const BATCH_SIZE = 10;
  const KEY_VALUES = Array.from({length: BATCH_SIZE}, () => createValues());
  const KEYS = KEY_VALUES.map(kv => kv.KEY);
  const VALUES = KEY_VALUES.map(kv => kv.VALUE);

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, {
      ...initialState,
      isProofRequired: {
        auth: false,
      },
      isWhitelistRequired: {
        put: true,
        update: true,
      },
    });

    owner = new SDK(ownerWallet.jwk, contractTxId, hook.warp);
  });

  it('should deploy with correct state', async () => {
    const state = await owner.getState();
    expect(state.verificationKeys.auth).toEqual(null);
    expect(state.isProofRequired.auth).toEqual(false);
    expect(state.isWhitelistRequired.put).toEqual(true);
    expect(state.isWhitelistRequired.update).toEqual(true);
  });

  it('should do multiple puts at once', async () => {
    await owner.putMany(KEYS, VALUES);
  });

  it('should do multiple gets at once', async () => {
    const values = await owner.getMany(KEYS);
    values.forEach((value, i) => expect(value?.val).toBe(VALUES[i].val));
  });
});
