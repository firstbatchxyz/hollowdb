import {poseidon1} from 'poseidon-lite';
export {SDK} from './sdk';
export {Admin} from './admin';
export type {HollowDbSdkArgs, CacheType} from './types';

/**
 * Compute the key that only you can know.
 * @param preimage your secret, the preimage of the key
 * @returns key, as the Poseidon hash of your secret
 */
export function computeKey(preimage: bigint): string {
  return poseidon1([preimage]).toString();
}
