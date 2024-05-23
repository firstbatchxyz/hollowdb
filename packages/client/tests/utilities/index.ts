import {createHash} from "crypto";
import snarkjs from "snarkjs";

import groth16Vkey from "../circuits/hollow-authz-groth16/verification_key.json";
import plonkVkey from "../circuits/hollow-authz-plonk/verification_key.json";

export async function verifyProof(proof: snarkjs.Groth16Proof & snarkjs.PlonkProof, psignals: snarkjs.PublicSignals) {
  const protocol = proof.protocol;
  const verificationKey = {
    groth16: groth16Vkey,
    plonk: plonkVkey,
  }[protocol];

  const result = await snarkjs[protocol].verify(verificationKey, psignals, proof);
  if (!result) {
    throw new Error("Verification failed.");
  }
}

export function valueToBigInt(value: unknown): bigint {
  if (value) {
    const digest = createHash("ripemd160").update(JSON.stringify(value), "utf-8").digest("hex");
    return BigInt("0x" + digest);
  } else {
    return 0n;
  }
}
