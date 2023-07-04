import ArLocal from 'arlocal';
import constants from '../constants';
import {LoggerFactory, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import initialHollowState from '../../src/contracts/states/hollowdb';
import {Admin, SDK} from '../../src/hollowdb';
import {readFileSync} from 'fs';
import {Redis} from 'ioredis';
import {overrideCache} from '../utils/cache';
import {globals} from '../../jest.config.cjs';

/** Setup hooks for Arlocal, returns the port.
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

export function setupWarpAndHollowdb<ValueType>(port: number, cacheType: 'redis' | 'lmdb' | 'default') {
  let ownerAdmin: Admin<ValueType>;
  let aliceSDK: SDK<ValueType>;
  let ownerAddress: string;
  let aliceAddress: string;

  let warp: Warp;
  let redisClient: Redis;

  beforeAll(async () => {
    // warp instance
    warp = WarpFactory.forLocal(port).use(new DeployPlugin());

    // accounts
    const ownerWallet = await warp.generateWallet();
    const aliceWallet = await warp.generateWallet();

    // deploy contract
    const contractSource = readFileSync('./build/hollowdb.js', 'utf8');
    const {contractTxId} = await Admin.deploy(
      ownerWallet.jwk,
      initialHollowState,
      contractSource,
      warp,
      true // bundling is disabled during testing
    );
    console.log('Contract deployed at:', contractTxId);

    // setup cache
    if (cacheType === 'redis') redisClient = new Redis(globals.__REDIS_URL__, {lazyConnect: true});
    overrideCache(warp, contractTxId, cacheType, {}, cacheType === 'redis' ? redisClient : undefined);
    if (cacheType === 'redis') await redisClient.connect();

    // log level
    LoggerFactory.INST.logLevel('none');

    // prepare Admin & SDK
    ownerAdmin = new Admin(ownerWallet.jwk, contractTxId, warp);
    aliceSDK = new SDK(aliceWallet.jwk, contractTxId, warp);
    ownerAddress = ownerWallet.address;
    aliceAddress = aliceWallet.address;

    // confirm contract exists
    const contractTx = await warp.arweave.transactions.get(contractTxId);
    expect(contractTx).not.toBeNull();
  });

  afterAll(async () => {
    if (cacheType === 'redis') {
      const response = await redisClient.quit();
      expect(response).toBe('OK');
    }
  });

  return () => ({
    ownerAddress,
    aliceAddress,
    ownerAdmin,
    aliceSDK,
  });
}
