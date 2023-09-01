import {randomBytes} from 'crypto';
import {createValues, deployContract} from './utils';
import {setupWarp} from './hooks';
import {SDK} from '../src/hollowdb';
import initialState from '../src/contracts/states/hollowdb';

type ValueType = {val: string};

describe('crud operations', () => {
  describe.each(['redis', 'lmdb', 'default'] as const)('cache type: %s', cacheType => {
    const warpHook = setupWarp(cacheType);
    let user: SDK<ValueType>;

    const {KEY, VALUE, NEXT_VALUE} = createValues<ValueType>();

    beforeAll(async () => {
      const hook = warpHook();
      const userWallet = hook.wallets[0];
      const contractTxId = await deployContract(hook.warp, userWallet.jwk, {
        ...initialState,
        isProofRequired: {
          auth: false,
        },
        isWhitelistRequired: {
          put: false,
          update: false,
        },
      });
      user = new SDK(userWallet.jwk, contractTxId, hook.warp);
    });

    it('should deploy with correct state', async () => {
      const state = await user.getState();
      expect(state.verificationKeys.auth).toEqual(null);
      expect(state.isProofRequired.auth).toEqual(false);
      expect(state.isWhitelistRequired.put).toEqual(false);
      expect(state.isWhitelistRequired.update).toEqual(false);
    });

    describe('put & get', () => {
      let values: ValueType[];
      let keys: string[];

      beforeAll(() => {
        const count = 100;
        values = Array<ValueType>(count).fill({
          val: randomBytes(10).toString('hex'),
        });
        keys = Array<string>(count)
          .fill('')
          .map((_, i) => KEY + i);
      });

      it('should put a value to a key & read it', async () => {
        expect(await user.get(KEY)).toEqual(null);
        await user.put(KEY, VALUE);
        expect(await user.get(KEY)).toEqual(VALUE);
      });

      it('should see the key with getKeys', async () => {
        // equivalent to getAllKeys when no option is given
        const keys = await user.getKeys();
        expect(keys.length).toEqual(1);
        expect(keys[0]).toEqual(KEY);
      });

      it('should NOT put a value to the same key', async () => {
        await expect(user.put(KEY, VALUE)).rejects.toThrow('Contract Error [put]: Key already exists.');
      });

      it('should put many values & get them', async () => {
        for (let i = 0; i < values.length; ++i) {
          const k = keys[i];
          const v = values[i];
          expect(await user.get(k)).toEqual(null);
          await user.put(k, v);
          expect(await user.get(k)).toEqual(v);
        }
      });

      it('should get all keys with getKeys', async () => {
        const keys = await user.getKeys();
        for (let i = 0; i < values.length; ++i) {
          expect(keys.includes(KEY + i)).toBe(true);
        }
      });

      it('should get values with getKvMap', async () => {
        const kvMap = await user.getKVMap();
        for (let i = 0; i < values.length; ++i) {
          expect(kvMap.get(keys[i])).toEqual(values[i]);
        }
      });

      it('should get values with getStorageValues', async () => {
        const {cachedValue: kvMap} = await user.getStorageValues(keys);
        for (let i = 0; i < values.length; ++i) {
          expect(kvMap.get(KEY + i)).toEqual(values[i]);
        }
      });
    });

    describe('update', () => {
      it('should update an existing value', async () => {
        await user.update(KEY, NEXT_VALUE);
        expect(await user.get(KEY)).toEqual(NEXT_VALUE);
      });
    });

    describe('remove', () => {
      it('should remove an existing value', async () => {
        expect(await user.get(KEY)).not.toEqual(null);
        await user.remove(KEY);
        expect(await user.get(KEY)).toEqual(null);
      });

      it('should be able to call remove to an already removed value', async () => {
        expect(await user.get(KEY)).toEqual(null);
        await user.remove(KEY);
        expect(await user.get(KEY)).toEqual(null);
      });
    });
  });
});
