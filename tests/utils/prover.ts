import {createHash} from 'crypto';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import * as snarkjs from 'snarkjs';

export type Protocol = 'groth16' | 'plonk';

export class Prover {
  private readonly wasmPath: string;
  private readonly proverKey: string;
  public readonly protocol: Protocol;

  /**
   * Create a prover with the given WASM path and prover key path.
   * @param wasmPath path to the circuit's WASM file
   * @param proverKey path to the prover key
   * @param protocol underlying proof system
   */
  constructor(wasmPath: string, proverKey: string, protocol: Protocol) {
    this.wasmPath = wasmPath;
    this.proverKey = proverKey;
    this.protocol = protocol;
  }

  /**
   * Generate a proof.
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
    const fullProof = await snarkjs[this.protocol].fullProve(
      // field names of this JSON object must match the input signal names of the circuit
      {
        preimage: preimage,
        curValueHash: this.valueToBigInt(curValue),
        nextValueHash: this.valueToBigInt(nextValue),
      },
      this.wasmPath,
      this.proverKey
    );
    return fullProof;
  }

  /**
   * Converts a value into bigint using ripemd160.
   * - Ripemd160 outputs a hex string, which can be converted into a bigint.
   * - Since the result is 160 bits, it is for sure within the finite field of BN128.
   *
   * If the value is `null`, it returns `0` instead.
   */
  valueToBigInt = (value: unknown): bigint => {
    const digest = createHash('ripemd160').update(JSON.stringify(value), 'utf-8').digest('hex');
    if (value) {
      return BigInt('0x' + digest);
    } else {
      return BigInt(0);
    }
  };
}
