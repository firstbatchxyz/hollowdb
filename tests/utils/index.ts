import {Warp} from 'warp-contracts';
import {JWKInterface} from 'arweave/node/lib/wallet';
import {Admin, SDK} from '../../src';
import {CacheType} from '../../src/sdk/types';
import {createClient} from 'redis';
import {globals} from '../../jest.config.cjs';
import {ripemd160} from '@ethersproject/sha2';
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
 * If a value is given as null, it will be put as 0 in the proof.
 * @param preimage preimage of the key to be written at
 * @param curValue currently stored value
 * @param nextValue to be stored value
 * @returns a fullProof object with the proof and public signals
 */
export async function generateProof(
  preimage: bigint,
  curValue: string | null,
  nextValue: string | null
): Promise<{proof: object; publicSignals: [curValueHash: bigint, nextValueHash: bigint, key: bigint]}> {
  const fullProof = await snarkjs.groth16.fullProve(
    {
      preimage: preimage,
      curValueHash: curValue ? valueToBigInt(curValue) : 0n,
      nextValueHash: nextValue ? valueToBigInt(nextValue) : 0n,
    },
    WASM_PATH,
    PROVERKEY_PATH
  );
  return fullProof;
}

/**
 * Convert a value into bigint using ripemd160.
 * - Ripemd160 outputs a hex string, which can be converted into a bigint.
 * - Since the result is 160 bits, it is for sure within the finite field of BN128.
 * @see https://docs.circom.io/background/background/#signals-of-a-circuit
 * @param value any kind of value
 */
export const valueToBigInt = (value: string): bigint => {
  return BigInt(ripemd160(Buffer.from(JSON.stringify(value))));
};

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
