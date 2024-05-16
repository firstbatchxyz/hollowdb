export default {
  groth16: {
    WASM_PATH: './circuits/groth16/hollow-authz.wasm',
    PROVERKEY_PATH: './circuits/groth16/prover_key.zkey',
    VERIFICATIONKEY_PATH: './circuits/groth16/verification_key.json',
  },
  plonk: {
    WASM_PATH: './circuits/plonk/hollow-authz.wasm',
    PROVERKEY_PATH: './circuits/plonk/prover_key.zkey',
    VERIFICATIONKEY_PATH: './circuits/plonk/verification_key.json',
  },
} as const;
