import { WarpFactory, Warp } from "warp-contracts";
import { DeployPlugin } from "warp-contracts-plugin-deploy";
import type { CacheTypes } from "../types/";

/** Creates a Warp instance connected to mainnet. */
export function makeWarp(caches: CacheTypes): Warp {
  return WarpFactory.forMainnet()
    .useStateCache(caches.state)
    .useContractCache(caches.contract, caches.src)
    .useKVStorageFactory(caches.kvFactory);
}

/**
 * Creates a local warp instance, also uses the `DeployPlugin`.
 *
 * WARNING: Do not use `useStateCache` and `useContractCache` together with
 * `forLocal`.
 */
export function makeLocalWarp(port: number, caches: CacheTypes): Warp {
  return WarpFactory.forLocal(port).useKVStorageFactory(caches.kvFactory).use(new DeployPlugin());
}
