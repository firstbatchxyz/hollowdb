import {Warp} from 'warp-contracts';
import {JWKInterface} from 'arweave/node/lib/wallet';
import {Admin, SDK} from '../../src';
import {CacheType} from '../../src/sdk/types';
import {createClient} from 'redis';
import {globals} from '../../jest.config.cjs';

/**
 * Add funds to any wallet.
 */
export async function addFunds(warp: Warp, wallet: JWKInterface) {
  const walletAddress = await warp.arweave.wallets.getAddress(wallet);
  await warp.arweave.api.get(`/mint/${walletAddress}/1000000000000000`);
}

/**
 * Mine a block in the local instance.
 */
export async function mineBlock(warp: Warp) {
  await warp.arweave.api.get('mine');
}

/**
 * Utility function to create `Admin` and `SDK`s for HollowDB contract.
 */
export function prepareSDKs(
  cacheType: CacheType,
  warp: Warp,
  contractTxId: string,
  ownerJWK: JWKInterface,
  aliceJWK: JWKInterface
): [ownerAdmin: Admin, ownerSDK: SDK, aliceSDK: SDK] {
  const redisClient =
    cacheType === 'redis'
      ? createClient({
          url: globals.__REDIS_URL__,
        })
      : undefined;
  const ownerAdmin = new Admin({
    jwk: ownerJWK,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
  const ownerSDK = new SDK({
    jwk: ownerJWK,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
  const aliceSDK = new SDK({
    jwk: aliceJWK,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
  return [ownerAdmin, ownerSDK, aliceSDK];
}
