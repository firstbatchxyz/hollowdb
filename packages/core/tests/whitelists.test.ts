import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {SDK} from '../src/hollowdb';
import {hollowdb as initialState} from '../src/contracts/states/';

type ValueType = {val: string};
describe('whitelists mode', () => {
  const warpHook = setupWarp();
  let owner: SDK<ValueType>;
  let alice: SDK<ValueType>;
  let bob: SDK<ValueType>;
  let aliceAddress: string;

  const {KEY, VALUE, NEXT_VALUE} = createValues();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet, aliceWallet, bobWallet] = hook.wallets;
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

    aliceAddress = aliceWallet.address;

    owner = new SDK(ownerWallet.jwk, contractTxId, hook.warp);
    alice = new SDK(aliceWallet.jwk, contractTxId, hook.warp);
    bob = new SDK(bobWallet.jwk, contractTxId, hook.warp);
  });

  it('should deploy with correct state', async () => {
    const state = await owner.getState();
    expect(state.verificationKeys.auth).toEqual(null);
    expect(state.isProofRequired.auth).toEqual(false);
    expect(state.isWhitelistRequired.put).toEqual(true);
    expect(state.isWhitelistRequired.update).toEqual(true);
  });

  it('should NOT allow Alice to put a value yet', async () => {
    await expect(alice.put(KEY, VALUE)).rejects.toThrow('Contract Error [put]: Not whitelisted.');
  });

  it('should allow Owner to whitelist Alice for put', async () => {
    const state = await owner.getState();
    expect(state.whitelists.put).not.toHaveProperty(aliceAddress);

    await owner.admin.updateWhitelist([aliceAddress], 'put', 'add');

    const newState = await owner.getState();
    expect(newState.whitelists.put).toHaveProperty(aliceAddress);
    expect(newState.whitelists.put[aliceAddress]).toEqual(true);
  });

  it('should allow Alice to put', async () => {
    expect(await alice.get(KEY)).toEqual(null);
    await alice.put(KEY, VALUE);
    expect(await alice.get(KEY)).toEqual(VALUE);
  });

  it('should NOT allow Alice to update a value yet', async () => {
    await expect(alice.update(KEY, NEXT_VALUE)).rejects.toThrow('Contract Error [update]: Not whitelisted.');
  });

  it('should allow Owner to whitelist Alice for put', async () => {
    const state = await owner.getState();
    expect(state.whitelists.update).not.toHaveProperty(aliceAddress);

    await owner.admin.updateWhitelist([aliceAddress], 'update', 'add');

    const newState = await owner.getState();
    expect(newState.whitelists.update).toHaveProperty(aliceAddress);
    expect(newState.whitelists.update[aliceAddress]).toEqual(true);
  });

  it('should allow Alice to update', async () => {
    expect(await alice.get(KEY)).toEqual(VALUE);
    await alice.update(KEY, NEXT_VALUE);
    expect(await alice.get(KEY)).toEqual(NEXT_VALUE);
  });

  describe('disabling whitelists', () => {
    const {KEY, VALUE, NEXT_VALUE} = createValues();

    beforeAll(async () => {
      const state = await owner.getState();
      expect(state.isWhitelistRequired.put).toEqual(true);
      expect(state.isWhitelistRequired.update).toEqual(true);

      await owner.admin.updateWhitelistRequirement('put', false);
      await owner.admin.updateWhitelistRequirement('update', false);

      const newState = await owner.getState();
      expect(newState.isWhitelistRequired.put).toEqual(false);
      expect(newState.isWhitelistRequired.update).toEqual(false);
    });

    it('should allow Bob to put', async () => {
      expect(await bob.get(KEY)).toEqual(null);
      await bob.put(KEY, VALUE);
      expect(await bob.get(KEY)).toEqual(VALUE);
    });

    it('should allow Bob to update', async () => {
      await bob.update(KEY, NEXT_VALUE);
      expect(await bob.get(KEY)).toEqual(NEXT_VALUE);
    });

    it('should allow Bob to remove', async () => {
      expect(await bob.get(KEY)).not.toEqual(null);
      await bob.remove(KEY);
      expect(await bob.get(KEY)).toEqual(null);
    });
  });
});
