import {Warp} from 'warp-contracts';
import {JWKInterface} from 'arweave/node/lib/wallet';
import {valueTxToBigInt} from '../../common/utilities';
import {Admin, SDK} from '../../src';
import {CacheType} from '../../src/sdk/types';
import {createClient} from 'redis';
import {globals} from '../../jest.config.cjs';
const snarkjs = require('snarkjs');

const WASM_PATH = './circuits/hollow-authz/hollow-authz.wasm';
const PROVERKEY_PATH = './circuits/hollow-authz/prover_key.zkey';

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
 * Generate a proof for HollowDB.
 * If a valueTx is given as null, it will be put as 0 in the proof.
 * @param preimage preimage of the key to be written at
 * @param curValueTx currently stored valueTx
 * @param nextValueTx to be stored valueTx
 * @returns a fullProof object with the proof and public signals
 */
export async function generateProof(
  preimage: bigint,
  curValueTx: string | null,
  nextValueTx: string | null
): Promise<{proof: object; publicSignals: [curValueTx: bigint, nextValueTx: bigint, key: bigint]}> {
  const fullProof = await snarkjs.groth16.fullProve(
    {
      idCommitment: preimage,
      curValueTx: curValueTx ? valueTxToBigInt(curValueTx) : 0n,
      nextValueTx: nextValueTx ? valueTxToBigInt(nextValueTx) : 0n,
    },
    WASM_PATH,
    PROVERKEY_PATH
  );
  return fullProof;
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
