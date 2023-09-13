import {randomBytes} from 'crypto';
import {Warp, JWKInterface} from 'warp-contracts';
import {readFileSync} from 'fs';
import {deploy} from '../../src/bin/deploy';
import {computeKey} from 'hollowdb-prover';
import {ContractState} from '../../src/contracts/types';

/** Add funds to any wallet. */
export async function addFunds(warp: Warp, wallet: JWKInterface) {
  const walletAddress = await warp.arweave.wallets.getAddress(wallet);
  await warp.arweave.api.get(`/mint/${walletAddress}/1000000000000000`);
}

/** Mine a block in the local instance. */
export async function mineBlock(warp: Warp) {
  await warp.arweave.api.get('mine');
}

/** Convert a decimal string to hexadecimal, both belonging to a bigint. */
export function decimalToHex(bigIntString: string): string {
  return '0x' + BigInt(bigIntString).toString(16);
}

/**
 * Utility to create a key with its preimage, a value and a next value.
 * @param numBytes number of random bytes
 */
export function createValues<ValueType = unknown>(numBytes = 10) {
  const KEY_PREIMAGE = BigInt('0x' + randomBytes(numBytes).toString('hex'));
  const KEY = computeKey(KEY_PREIMAGE);
  const VALUE = {
    val: randomBytes(numBytes).toString('hex'),
  };
  const NEXT_VALUE = {
    val: randomBytes(numBytes).toString('hex'),
  };
  return {
    KEY,
    KEY_PREIMAGE,
    VALUE: VALUE as ValueType,
    NEXT_VALUE: NEXT_VALUE as ValueType,
  };
}

/**
 * Deploys a contract with the optionally provided initial state.
 * Returns the `contractTxId`.
 */
export async function deployContract(
  warp: Warp,
  signer: JWKInterface,
  initialState: ContractState,
  contractName = 'hollowdb'
): Promise<string> {
  const contractSource = readFileSync(`./src/contracts/build/${contractName}.contract.js`, 'utf8');
  const contractTxId = await deploy(signer, warp, initialState, contractSource).then(result => result.contractTxId);

  const contractTx = await warp.arweave.transactions.get(contractTxId);
  expect(contractTx).not.toBeNull();

  return contractTxId;
}
