import type { LoggerFactory } from "warp-contracts";

export default {
  /** Redis URL to connect to. Defaults to `redis://default:redispw@localhost:6379`. */
  REDIS_URL: process.env.REDIS_URL || "redis://default:redispw@localhost:6379",
  /** Path to Arweave wallet. */
  WALLET_PATH: process.env.WALLET_PATH || "./config/wallet.json",
  /** Log level for underlying Warp. */
  WARP_LOG_LEVEL: (process.env.WARP_LOG_LEVEL || "info") as Parameters<typeof LoggerFactory.INST.logLevel>[0],
  /** Arweave port for `arlocal`. */
  ARWEAVE_PORT: 3169,
} as const;
