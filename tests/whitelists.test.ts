import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {Admin, SDK} from '../src/hollowdb';
import initialHollowState from '../src/contracts/states/hollowdb';

type ValueType = {val: string};
describe('whitelists mode', () => {
  const warpHook = setupWarp();
  let owner: Admin<ValueType>;
  let alice: SDK<ValueType>;
  let bob: SDK<ValueType>;
  let aliceAddress: string;

  const {KEY, VALUE, NEXT_VALUE} = createValues<ValueType>();

  beforeAll(async () => {
    const hook = warpHook();
    const [ownerWallet, aliceWallet, bobWallet] = hook.wallets;
    const contractTxId = await deployContract(hook.warp, ownerWallet.jwk, {
      ...initialHollowState,
      isProofRequired: {
        auth: false,
      },
      isWhitelistRequired: {
        put: true,
        update: true,
      },
    });

    aliceAddress = aliceWallet.address;

    owner = new Admin(ownerWallet.jwk, contractTxId, hook.warp);
    alice = new SDK(aliceWallet.jwk, contractTxId, hook.warp);
    bob = new SDK(bobWallet.jwk, contractTxId, hook.warp);
  });

  it('should deploy with correct state', async () => {
    const {cachedValue} = await owner.readState();
    expect(cachedValue.state.verificationKeys.auth).toEqual(null);
    expect(cachedValue.state.isProofRequired.auth).toEqual(false);
    expect(cachedValue.state.isWhitelistRequired.put).toEqual(true);
    expect(cachedValue.state.isWhitelistRequired.update).toEqual(true);
  });

  it('should NOT allow Alice to put a value yet', async () => {
    await expect(alice.put(KEY, VALUE)).rejects.toThrow('Contract Error [put]: Not whitelisted.');
  });

  it('should allow Owner to whitelist Alice for put', async () => {
    const {cachedValue: oldCachedValue} = await owner.readState();
    expect(oldCachedValue.state.whitelists.put).not.toHaveProperty(aliceAddress);

    await owner.updateWhitelist([aliceAddress], 'put', 'add');

    const {cachedValue: newCachedValue} = await owner.readState();
    expect(newCachedValue.state.whitelists.put).toHaveProperty(aliceAddress);
    expect(newCachedValue.state.whitelists.put[aliceAddress]).toEqual(true);
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
    const {cachedValue: oldCachedValue} = await owner.readState();
    expect(oldCachedValue.state.whitelists.update).not.toHaveProperty(aliceAddress);

    await owner.updateWhitelist([aliceAddress], 'update', 'add');

    const {cachedValue: newCachedValue} = await owner.readState();
    expect(newCachedValue.state.whitelists.update).toHaveProperty(aliceAddress);
    expect(newCachedValue.state.whitelists.update[aliceAddress]).toEqual(true);
  });

  it('should allow Alice to update', async () => {
    expect(await alice.get(KEY)).toEqual(VALUE);
    await alice.update(KEY, NEXT_VALUE);
    expect(await alice.get(KEY)).toEqual(NEXT_VALUE);
  });

  describe('disabling whitelists', () => {
    const {KEY, VALUE, NEXT_VALUE} = createValues<ValueType>();

    beforeAll(async () => {
      const {cachedValue: oldCachedValue} = await owner.readState();
      expect(oldCachedValue.state.isWhitelistRequired.put).toEqual(true);
      expect(oldCachedValue.state.isWhitelistRequired.update).toEqual(true);

      await owner.updateWhitelistRequirement('put', false);
      await owner.updateWhitelistRequirement('update', false);

      const {cachedValue: newCachedValue} = await owner.readState();
      expect(newCachedValue.state.isWhitelistRequired.put).toEqual(false);
      expect(newCachedValue.state.isWhitelistRequired.update).toEqual(false);
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
