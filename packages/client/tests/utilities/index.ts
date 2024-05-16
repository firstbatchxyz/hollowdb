import {createHash} from 'crypto';
const snarkjs = require('snarkjs');

import groth16Vkey from '../circuits/hollow-authz-groth16/verification_key.json';
import plonkVkey from '../circuits/hollow-authz-plonk/verification_key.json';

export async function verifyProof(
  proof: object & {protocol: string},
  psignals: bigint[]
) {
  const protocol = proof.protocol;
  let verificationKey: object;
  if (protocol === 'groth16') {
    verificationKey = groth16Vkey;
  } else if (protocol === 'plonk') {
    verificationKey = plonkVkey;
  } else {
    throw new Error('Unknown protocol: ' + protocol);
  }

  const result = await snarkjs[protocol].verify(
    verificationKey,
    psignals,
    proof
  );
  if (!result) {
    throw new Error('Verification failed.');
  }
}

export function valueToBigInt(value: unknown): bigint {
  if (value) {
    const digest = createHash('ripemd160')
      .update(JSON.stringify(value), 'utf-8')
      .digest('hex');
    return BigInt('0x' + digest);
  } else {
    return 0n;
  }
}
