import ArLocal from 'arlocal';
import constants from '../constants';
import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import {Redis} from 'ioredis';
import {overrideCache} from '../utils/cache';
import {globals} from '../../jest.config.cjs';
import {Wallet} from 'warp-contracts/lib/types/contract/testing/Testing';

/**
 * Setup hooks for Arlocal, returns the port.
 *
 * The instanceId is required to assign different ports to different tests until
 * I can find a better solution like globalSetup and globalTeardown.
 */
export function setupArlocal(instanceId: number): number {
  let arlocal: ArLocal;
  const port = constants.ARWEAVE_PORT + instanceId;

  beforeAll(async () => {
    arlocal = new ArLocal(port, false);
    await arlocal.start();
  });

  afterAll(async () => {
    console.log('arlocal stopped');
    await arlocal.stop();
  });

  return port;
}

/**
 * Setup Warp instance for a test, connected to Arlocal at the provided port.
 *
 * It also sets up hooks necessary for the cache in case Redis is used.
 * Returns a getter for Warp, along with several wallets.
 *
 * Cache type defaults to `default`.
 */
export function setupWarp(port: number, cacheType: 'redis' | 'lmdb' | 'default' = 'default') {
  let warp: Warp;
  let wallets: [Wallet, Wallet, Wallet];

  let redisClient: Redis;

  beforeAll(async () => {
    LoggerFactory.INST.logLevel('none');
    warp = WarpFactory.forLocal(port).use(new DeployPlugin());

    if (cacheType === 'redis') {
      redisClient = new Redis(globals.__REDIS_URL__, {lazyConnect: true});
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
