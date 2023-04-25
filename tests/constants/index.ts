const constants = {
  // port to run
  ARWEAVE_PORT: 3169,
  // arbitrarily long timeout for the test
  JEST_TIMEOUT_MS: 30000,
  // to generate proofs & verify
  GROTH16_WASM_PATH: './circuits/hollow-authz-groth16/hollow-authz.wasm',
  GROTH16_PROVERKEY_PATH: './circuits/hollow-authz-groth16/prover_key.zkey',
  GROTH16_VERIFICATIONKEY_PATH: './circuits/hollow-authz-groth16/verification_key.json',
  PLONK_WASM_PATH: './circuits/hollow-authz-plonk/hollow-authz.wasm',
  PLONK_PROVERKEY_PATH: './circuits/hollow-authz-plonk/prover_key.zkey',
  PLONK_VERIFICATIONKEY_PATH: './circuits/hollow-authz-plonk/verification_key.json',
};

export default constants as Readonly<typeof constants>;
