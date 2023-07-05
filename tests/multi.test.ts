import {deployContract} from './utils';
import {setupArlocal, setupWarp} from './hooks';
import {Admin} from '../src/hollowdb';
import initialHollowState from '../src/contracts/states/hollowdb';

describe('multiple contracts', () => {
  const PORT = setupArlocal(5);
  const REQ_COUNT = 100;
  const warpHook = setupWarp(PORT, 'redis');

  let user1: Admin<number>;
  let user2: Admin<number>;
  let randomness: boolean[];

  beforeAll(async () => {
    const hook = warpHook();
    const [userWallet] = hook.wallets;
    const initialState = {
      ...initialHollowState,
      isProofRequired: {
        auth: false,
      },
      isWhitelistRequired: {
        put: false,
        update: false,
      },
    };
    const contractTxId1 = await deployContract(hook.warp, userWallet.jwk, initialState);
    const contractTxId2 = await deployContract(hook.warp, userWallet.jwk, initialState);

    user1 = new Admin(userWallet.jwk, contractTxId1, hook.warp);
    user2 = new Admin(userWallet.jwk, contractTxId2, hook.warp);

    randomness = Array<boolean>(REQ_COUNT).fill(Math.random() < 0.5);
  });

  it('should allow putting at once', async () => {
    const values = Array<number>(REQ_COUNT).fill(Math.random() * REQ_COUNT);

    for (let i = 0; i < REQ_COUNT; ++i) {
      const k = `key.${i}`;
      const v = values[i];
      if (randomness[i]) {
        await user1.put(k, v);
        expect(await user1.get(k)).toEqual(v);
      } else {
        await user2.put(k, v);
        expect(await user2.get(k)).toEqual(v);
      }
    }
  });

  it('should allow updating at once', async () => {
    const values = Array<number>(REQ_COUNT).fill(Math.random() * REQ_COUNT);

    for (let i = 0; i < REQ_COUNT; ++i) {
      const k = `key.${i}`;
      const v = values[i];

      if (randomness[i]) {
        await user1.update(k, v);
        expect(await user1.get(k)).toEqual(v);
      } else {
        await user2.update(k, v);
        expect(await user2.get(k)).toEqual(v);
      }
    }
  });
});
