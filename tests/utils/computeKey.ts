import {poseidon1} from 'poseidon-lite';

/**
 * Compute the key that only you can know the preimage of.
 * @param preimage your secret, the preimage of the key
 * @returns key, that is the Poseidon hash of your secret as a hexadecimal string
 */
export function computeKey(preimage: bigint): string {
  return '0x' + poseidon1([preimage]).toString(16);
}
