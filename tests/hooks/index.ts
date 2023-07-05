import constants from '../constants';
import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import {Redis} from 'ioredis';
import {overrideCache} from '../utils/cache';
import {Wallet} from 'warp-contracts/lib/types/contract/testing/Testing';

/**
 * Setup Warp instance for a test, connected to Arlocal at the provided port.
 *
 * It also sets up hooks necessary for the cache in case Redis is used.
 * Returns a getter for Warp, along with several wallets.
 *
 * Cache type defaults to `default`.
 */
export function setupWarp(cacheType: 'redis' | 'lmdb' | 'default' = 'default') {
  let warp: Warp;
  let wallets: [Wallet, Wallet, Wallet];
  let redisClient: Redis;

  beforeAll(async () => {
    LoggerFactory.INST.logLevel('none');
    warp = WarpFactory.forLocal(constants.ARWEAVE_PORT).use(new DeployPlugin());

    if (cacheType === 'redis') {
      redisClient = new Redis(constants.REDIS_URL, {lazyConnect: true});
      overrideCache(warp, cacheType, {}, redisClient);
      await redisClient.connect();
    } else {
      overrideCache(warp, cacheType, {});
    }

    wallets = await Promise.all([warp.generateWallet(), warp.generateWallet(), warp.generateWallet()]);
  });

  afterAll(async () => {
    if (cacheType === 'redis') {
      const response = await redisClient.quit();
      expect(response).toBe('OK');
    }
  });

  return () => ({
    warp,
    wallets,
  });
}
