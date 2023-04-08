import {ArWallet, CustomSignature, Warp} from 'warp-contracts';
import {JWKInterface} from 'arweave/node/lib/wallet';
import {Admin, SDK} from '../../src';
import {CacheType} from '../../src/sdk/types';
import {createClient} from 'redis';

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
 * Utility function to create an SDK for HollowDB contract.
 */
export function prepareSDK(
  cacheType: CacheType,
  warp: Warp,
  contractTxId: string,
  signer: ArWallet | CustomSignature,
  redisClient?: ReturnType<typeof createClient>
): SDK {
  return new SDK({
    signer,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
}

/**
 * Utility function to create an Admin for HollowDB contract.
 */
export function prepareAdmin(
  cacheType: CacheType,
  warp: Warp,
  contractTxId: string,
  signer: ArWallet | CustomSignature,
  redisClient?: ReturnType<typeof createClient>
) {
  return new Admin({
    signer,
    contractTxId,
    cacheType,
    warp,
    useContractCache: false,
    useStateCache: false,
    redisClient,
  });
}
