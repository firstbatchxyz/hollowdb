import {Warp, JWKInterface} from 'warp-contracts';

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
