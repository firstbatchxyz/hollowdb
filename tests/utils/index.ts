import {poseidon1} from 'poseidon-lite';
import {randomBytes} from 'crypto';
import {Warp, JWKInterface} from 'warp-contracts';
import initialHollowState from '../../src/contracts/states/hollowdb';
import {readFileSync} from 'fs';
import {Admin} from '../../src/hollowdb';
import {HollowState} from '../../src/contracts/hollowdb';

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
 * Compute the key that only you can know the preimage of.
 * @param preimage your secret, the preimage of the key
 * @returns key, that is the Poseidon hash of your secret as a hexadecimal string
 */
export function computeKey(preimage: bigint): string {
  return '0x' + poseidon1([preimage]).toString(16);
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
  initialState: HollowState = initialHollowState,
  contractName: 'hollowdb' | 'hollowdb-htx' = 'hollowdb'
) {
  const contractSource = readFileSync(`./build/${contractName}.js`, 'utf8');
  const contractTxId = await Admin.deploy(
    signer,
    initialState,
    contractSource,
    warp,
    true // bundling is disabled during testing
  ).then(result => result.contractTxId);
  // console.log('Contract deployed at:', contractTxId);

  const contractTx = await warp.arweave.transactions.get(contractTxId);
  expect(contractTx).not.toBeNull();

  return contractTxId;
}
