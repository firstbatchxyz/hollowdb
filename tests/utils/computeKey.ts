import {poseidon1} from 'poseidon-lite';

/**
 * Compute the key that only you can know the preimage of.
 * @param preimage your secret, the preimage of the key
 * @returns key, as the Poseidon hash of your secret
 */
export function computeKey(preimage: bigint): string {
  return poseidon1([preimage]).toString();
}
