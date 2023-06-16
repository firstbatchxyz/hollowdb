export default {
  // limit options for cache
  DEFAULT_LIMIT_OPTS: {
    lmdb: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
    redis: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
    default: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
  },
  // port to run
  ARWEAVE_PORT: 3169,
  // to generate proofs & verify
  GROTH16_WASM_PATH: './config/circuits/hollow-authz-groth16/hollow-authz.wasm',
  GROTH16_PROVERKEY_PATH: './config/circuits/hollow-authz-groth16/prover_key.zkey',
  GROTH16_VERIFICATIONKEY_PATH: './config/circuits/hollow-authz-groth16/verification_key.json',
  PLONK_WASM_PATH: './config/circuits/hollow-authz-plonk/hollow-authz.wasm',
  PLONK_PROVERKEY_PATH: './config/circuits/hollow-authz-plonk/prover_key.zkey',
  PLONK_VERIFICATIONKEY_PATH: './config/circuits/hollow-authz-plonk/verification_key.json',
} as const;
