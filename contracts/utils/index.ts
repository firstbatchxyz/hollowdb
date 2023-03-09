/**
 * Verify a zero-knowledge proof.
 * @param proof a proof object
 * @param psignals public signals
 * @param verKey verification key
 * @returns true if proof is verified, false otherwise
 */
export const verifyProof = async (
  proof: object,
  psignals: [curValueHash: bigint, nextValueHash: bigint, key: bigint],
  verificationKey: object
): Promise<boolean> => {
  return await SmartWeave.extensions.groth16.verify(verificationKey, psignals, proof);
};

/**
 * Convert a value into bigint using ripemd160.
 * - Ripemd160 outputs a hex string, which can be converted into a bigint.
 * - Since the result is 160 bits, it is for sure within the finite field of BN128.
 * @see https://docs.circom.io/background/background/#signals-of-a-circuit
 * @param value any kind of value
 */
export const valueToBigInt = (value: string): bigint => {
  return BigInt(SmartWeave.extensions.ethers.utils.ripemd160(Buffer.from(JSON.stringify(value))));
};
