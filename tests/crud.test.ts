import {randomBytes} from 'crypto';
import {createValues, deployContract} from './utils';
import {setupArlocal, setupWarp} from './hooks';
import {SDK} from '../src/hollowdb';
import initialHollowState from '../src/contracts/states/hollowdb';

describe('crud operations', () => {
  const PORT = setupArlocal(0);
  type ValueType = {
    val: string;
  };

  describe.each(['redis', 'lmdb', 'default'] as const)('cache type: %s', cacheType => {
    const warpHook = setupWarp(PORT, cacheType);
    let user: SDK<ValueType>;

    const {KEY, VALUE, NEXT_VALUE} = createValues<ValueType>();

    beforeAll(async () => {
      const hook = warpHook();
      const userWallet = hook.wallets[0];
      const contractTxId = await deployContract(hook.warp, userWallet.jwk, {
        ...initialHollowState,
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
      const {cachedValue} = await user.readState();
      expect(cachedValue.state.verificationKeys.auth).toEqual(null);
      expect(cachedValue.state.isProofRequired.auth).toEqual(false);
      expect(cachedValue.state.isWhitelistRequired.put).toEqual(false);
      expect(cachedValue.state.isWhitelistRequired.update).toEqual(false);
    });

    describe('put', () => {
      it('should put a value to a key & read it', async () => {
        expect(await user.get(KEY)).toEqual(null);
        await user.put(KEY, VALUE);
        expect(await user.get(KEY)).toEqual(VALUE);
      });

      it('should read the value with getKvMap', async () => {
        const kvmap = await user.getKVMap();
        expect(kvmap.get(KEY)).toEqual(VALUE);
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

      it('should put many values', async () => {
        const count = 10;
        const values = Array<ValueType>(count).fill({
          val: randomBytes(10).toString('hex'),
        });

        for (let i = 0; i < values.length; ++i) {
          const k = KEY + i;
          const v = values[i];
          expect(await user.get(k)).toEqual(null);
          await user.put(k, v);
          expect(await user.get(k)).toEqual(v);
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

      it('should NOT remove an already removed value', async () => {
        expect(await user.get(KEY)).toEqual(null);
        await expect(user.remove(KEY)).rejects.toThrow('Key does not exist');
      });
    });
  });
});
