import type { RedisCache } from "warp-contracts-redis";

export * from "./requests";

/** Cache types used by `Warp`. */
export type CacheTypes<C = RedisCache> = {
  state: C;
  contract: C;
  src: C;
  kvFactory: (contractTxId: string) => C;
};
