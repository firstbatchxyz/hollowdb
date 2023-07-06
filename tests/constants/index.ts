export default {
  DEFAULT_LIMIT_OPTS: {
    lmdb: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
    redis: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
  },
  ARWEAVE_PORT: 3169,
  REDIS_URL: 'redis://default:redispw@localhost:6379',
  PROVERS: {
    groth16: {
      HOLLOWDB: {
        WASM_PATH: './config/circuits/hollow-authz-groth16/hollow-authz.wasm',
        PROVERKEY_PATH: './config/circuits/hollow-authz-groth16/prover_key.zkey',
        VERIFICATIONKEY_PATH: './config/circuits/hollow-authz-groth16/verification_key.json',
      },
    },
    plonk: {
      HOLLOWDB: {
        WASM_PATH: './config/circuits/hollow-authz-plonk/hollow-authz.wasm',
        PROVERKEY_PATH: './config/circuits/hollow-authz-plonk/prover_key.zkey',
        VERIFICATIONKEY_PATH: './config/circuits/hollow-authz-plonk/verification_key.json',
      },
    },
  },
} as const;
