import {ripemd160} from '@ethersproject/sha2';
const snarkjs = require('snarkjs');

export type ProofSystem = 'groth16' | 'plonk';

export class Prover {
  private readonly wasmPath: string;
  private readonly proverKey: string;
  public readonly proofSystem: ProofSystem;

  /**
   * Create a prover with the given WASM path and prover key path.
   * @param wasmPath path to the circuit's WASM file
   * @param proverKey path to the prover key
   * @param proofSystem underlying proof system
   */
  constructor(wasmPath: string, proverKey: string, proofSystem: ProofSystem) {
    this.wasmPath = wasmPath;
    this.proverKey = proverKey;
    this.proofSystem = proofSystem;
  }

  /**
   * Generate a proof for HollowDB.
   * If a value is given as null, it will be put as 0 in the proof.
   * @param preimage preimage of the key to be written at
   * @param curValue value currently stored
   * @param nextValue new value to be stored
   * @returns a fullProof object with the proof and public signals
   */
  async generateProof(
    preimage: bigint,
    curValue: unknown | null,
    nextValue: unknown | null
  ): Promise<{proof: object; publicSignals: [curValueHashOut: string, nextValueHashOut: string, key: string]}> {
    const fullProof = await snarkjs[this.proofSystem].fullProve(
      // field names of this JSON object must match the input signal names of the circuit
      {
        preimage: preimage,
        curValueHash: curValue ? this.valueToBigInt(curValue) : 0n,
        nextValueHash: nextValue ? this.valueToBigInt(nextValue) : 0n,
      },
      this.wasmPath,
      this.proverKey
    );
    return fullProof;
  }

  /**
   * Convert a value into bigint using `ripemd160`.
   * - `ripemd160` outputs a hex string, which can be converted into a `bigint`.
   * - Since the result is 160 bits, it is for sure within the finite field of BN128.
   * @see https://docs.circom.io/background/background/#signals-of-a-circuit
   * @param value any kind of value
   */
  valueToBigInt = (value: unknown): bigint => {
    return BigInt(ripemd160(Buffer.from(JSON.stringify(value))));
  };
}
