import errors from '../errors';

/**
 * Verify a zero-knowledge proof.
 * @param proof a proof object
 * @param psignals public signals
 * @param verKey verification key
 * @returns true if proof is verified, false otherwise
 */
export const verifyProof = async (
  proof: object,
  psignals: bigint[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verificationKey: any
): Promise<boolean> => {
  if (verificationKey === null) {
    throw errors.NoVerificationKeyError;
  }
  if (verificationKey.protocol !== 'groth16' && verificationKey.protocol !== 'plonk') {
    throw errors.UnknownProofSystemError;
  }
  return await SmartWeave.extensions[verificationKey.protocol].verify(verificationKey, psignals, proof);
};

/**
 * Convert a value into bigint using ripemd160.
 * - Ripemd160 outputs a hex string, which can be converted into a bigint.
 * - Since the result is 160 bits, it is for sure within the finite field of BN128.
 * @see https://docs.circom.io/background/background/#signals-of-a-circuit
 * @param value any kind of value
 */
export const valueToBigInt = (value: unknown): bigint => {
  return BigInt(SmartWeave.extensions.ethers.utils.ripemd160(Buffer.from(JSON.stringify(value))));
};
