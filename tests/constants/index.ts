const constants = {
  // port to run
  ARWEAVE_PORT: 3169,
  // arbitrarily long timeout for the test
  JEST_TIMEOUT_MS: 30000,
  // to generate proofs
  WASM_PATH: './circuits/hollow-authz/hollow-authz.wasm',
  PROVERKEY_PATH: './circuits/hollow-authz/prover_key.zkey',
  // to verify proofs (given to the contract)
  VERIFICATIONKEY_PATH: './circuits/hollow-authz/verification_key.json',
};

export default constants as Readonly<typeof constants>;
