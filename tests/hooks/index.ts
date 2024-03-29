import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {Redis} from 'ioredis';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import {EthersExtension} from 'warp-contracts-plugin-ethers';
import {overrideCache} from '../utils/cache';
import constants from '../constants';

/** Wallet type for wallets generated by Warp. */
type Wallet = Awaited<ReturnType<Warp['generateWallet']>>;

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
    warp = WarpFactory.forLocal(constants.ARWEAVE_PORT)
      // required for contract deployments
      .use(new DeployPlugin())
      // required for proofs
      .use(new SnarkjsExtension())
      // required for hashing
      .use(new EthersExtension());

    if (cacheType === 'redis') {
      redisClient = new Redis(constants.REDIS_URL, {lazyConnect: true});
      overrideCache(warp, cacheType, redisClient);
      await redisClient.connect();

      // healthcheck
      const response = await redisClient.ping();
      expect(response).toBe('PONG');
    } else {
      overrideCache(warp, cacheType);
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
