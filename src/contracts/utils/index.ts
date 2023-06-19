import {
  InvalidProofError,
  KeyNotExistsError,
  NoVerificationKeyError,
  NotOwnerError,
  NotWhitelistedError,
  UnknownProofSystemError,
} from '../errors';
import type {ContractState} from '../types/contract';

/** Verifies a zero-knowledge proof. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const verifyProof = async (proof: object, psignals: bigint[], verificationKey: any): Promise<boolean> => {
  if (verificationKey === null) {
    throw NoVerificationKeyError;
  }
  if (verificationKey.protocol !== 'groth16' && verificationKey.protocol !== 'plonk') {
    throw UnknownProofSystemError;
  }
  return await SmartWeave.extensions[verificationKey.protocol].verify(verificationKey, psignals, proof);
};

/**
 * Converts a value into bigint using ripemd160.
 * - Ripemd160 outputs a hex string, which can be converted into a bigint.
 * - Since the result is 160 bits, it is for sure within the finite field of BN128.
 *
 * If the value is `null`, it returns `0` instead.
 */
export const valueToBigInt = (value: unknown): bigint => {
  if (value) {
    return BigInt(SmartWeave.extensions.ethers.utils.ripemd160(Buffer.from(JSON.stringify(value))));
  } else {
    return BigInt(0);
  }
};

/** Converts a 256-bit digest into an array of 32 bytes. */
export const digestToBytes = (digest: string): number[] => {
  const bytes = Buffer.from(digest.slice(2), 'hex').toJSON().data;
  if (bytes.length !== 32) {
    throw new Error('Bad digest length');
  }
  return bytes;
};

/** Gets a value at some key, throws an error if the value is null. */
export const safeGet = async (key: string): Promise<unknown> => {
  const val = await SmartWeave.kv.get(key);
  if (val === null) {
    throw KeyNotExistsError;
  }
  return val;
};

/** Throws an error if caller is not the contract owner. */
export function assertOwner<State extends ContractState>(state: State, caller: string): void {
  if (caller !== state.owner) {
    throw NotOwnerError;
  }
}

/** Throws an error if the caller is not whitelisted for the given list. */
export function assertWhitelist<State extends ContractState>(state: State, caller: string, list: string): void {
  if (state.isWhitelistRequired[list] && !state.whitelists[list][caller]) {
    throw NotWhitelistedError;
  }
}

/**
 * An auth proof is required to make updates in the database. The proof is a Poseidon
 * preimage knowledge proof that is also bound to two values, the value currently in
 * database and the new value to be written. This binding happens via including
 * constraints related to the hashes of these values.
 */
export async function verifyAuthProof<State extends ContractState>(
  state: State,
  proof: object,
  oldValue: unknown,
  newValue: unknown,
  key: string
): Promise<void> {
  if (!state.isProofRequired.auth) return;

  const verificationSuccess = await verifyProof(
    proof,
    [valueToBigInt(oldValue), valueToBigInt(newValue), BigInt(key)],
    state.verificationKeys.auth
  );

  if (!verificationSuccess) {
    throw InvalidProofError;
  }
}