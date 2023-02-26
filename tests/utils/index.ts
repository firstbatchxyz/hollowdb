import {Warp} from 'warp-contracts';
import {JWKInterface} from 'arweave/node/lib/wallet';
import {valueTxToBigInt} from '../../common/utilities';
const snarkjs = require('snarkjs');

const WASM_PATH = './circuits/hollow-authz/hollow-authz.wasm';
const PROVERKEY_PATH = './circuits/hollow-authz/prover_key.zkey';

export async function addFunds(warp: Warp, wallet: JWKInterface) {
  const walletAddress = await warp.arweave.wallets.getAddress(wallet);
  await warp.arweave.api.get(`/mint/${walletAddress}/1000000000000000`);
}

export async function mineBlock(warp: Warp) {
  await warp.arweave.api.get('mine');
}

export async function generateProof(
  preimage: bigint,
  curValueTx: string
): Promise<{proof: object; publicSignals: string[]}> {
  const fullProof = await snarkjs.groth16.fullProve(
    {
      id_commitment: preimage,
      valueTx: valueTxToBigInt(curValueTx),
    },
    WASM_PATH,
    PROVERKEY_PATH
  );
  return fullProof;
}
