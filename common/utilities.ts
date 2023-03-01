/**
 * Verify a zero-knowledge proof.
 * @param proof a proof object
 * @param psignals public signals
 * @param verKey verification key
 * @returns true if proof is verified, false otherwise
 */
export const verifyProof = async (
  proof: object,
  psignals: [curValueTx: bigint, nextValueTx: bigint, key: bigint],
  verificationKey: object
): Promise<boolean> => {
  return await SmartWeave.extensions.groth16.verify(verificationKey, psignals, proof);
};

/**
 * Convert a valueTx into bigint. The result is guaranteed to be within the bn128 finite field range.
 * @see https://docs.circom.io/background/background/#signals-of-a-circuit
 * @param valueTx something like `Mzb7OD0TBtbcxoRO6sxPvOxHnxfSMnb6ZqSCIvbsgpY`
 */
export const valueTxToBigInt = (valueTx: string): bigint => {
  return (
    BigInt('0x' + Buffer.from(valueTx).toString('hex')) %
    BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617')
  );
};
