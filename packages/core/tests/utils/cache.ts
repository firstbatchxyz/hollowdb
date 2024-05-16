import {CacheOptions, Warp, defaultCacheOptions} from 'warp-contracts';
import {LmdbCache} from 'warp-contracts-lmdb';
import {LmdbOptions} from 'warp-contracts-lmdb/lib/types/LmdbOptions';
import {RedisCache, RedisOptions} from 'warp-contracts-redis';
import constants from '../constants';
import {Redis} from 'ioredis';

/**
 * Override Warp cache by using LMDB or Redis. The `default` option simply does
 * nothing so that default settings are kept.
 *
 * Due to these lines [here](https://github.com/warp-contracts/warp/blob/main/src/core/modules/impl/ContractDefinitionLoader.ts#L156)
 * `stateCache` and `contractCache` are not used. This is probably because of using `ArLocal` and `WarpFactory.forLocal`.
 * These cache options are available on mainnet alright.
 */
export function overrideCache(
  warp: Warp,
  cacheType: 'lmdb' | 'redis' | 'default',
  client?: Redis
  // useCache: {state?: boolean; contract?: boolean},
): Warp {
  if (cacheType === 'default') return warp;

  const LIMIT_OPTS = constants.DEFAULT_LIMIT_OPTS[cacheType];
  if (cacheType === 'redis') {
    const redisCacheOptions: CacheOptions = {
      inMemory: true,
      dbLocation: '', // will be overwritten
      subLevelSeparator: '|',
    };
    const redisSpecificOptions: RedisOptions = client
      ? {
          ...LIMIT_OPTS,
          client,
        }
      : {
          ...LIMIT_OPTS,
          url: constants.REDIS_URL,
        };

    // if (useCache.state)
    //   warp = warp.useStateCache(
    //     new RedisCache(
    //       {
    //         ...redisCacheOptions,
    //         dbLocation: 'state',
    //       },
    //       redisSpecificOptions
    //     )
    //   );
    // if (useCache.contract)
    //   warp = warp.useContractCache(
    //     new RedisCache(
    //       {
    //         ...redisCacheOptions,
    //         dbLocation: 'contract',
    //       },
    //       redisSpecificOptions
    //     ),
    //     new RedisCache(
    //       {
    //         ...redisCacheOptions,
    //         dbLocation: 'src',
    //       },
    //       redisSpecificOptions
    //     )
    //   );

    warp = warp.useKVStorageFactory(
      (contractTxId: string) =>
        new RedisCache(
          {
            ...redisCacheOptions,
            dbLocation: `${contractTxId}.kv`,
          },
          redisSpecificOptions
        )
    );
  } else if (cacheType === 'lmdb') {
    const lmdbCacheOptions: CacheOptions = defaultCacheOptions;
    const lmdbSpecificOptions: LmdbOptions = LIMIT_OPTS;

    // if (useCache.state)
    //   warp = warp.useStateCache(
    //     new LmdbCache(
    //       {
    //         ...lmdbCacheOptions,
    //         dbLocation: './cache/warp/state',
    //       },
    //       lmdbSpecificOptions
    //     )
    //   );

    // if (useCache.contract)
    //   warp = warp.useContractCache(
    //     new LmdbCache(
    //       {
    //         ...lmdbCacheOptions,
    //         dbLocation: './cache/warp/contract',
    //       },
    //       lmdbSpecificOptions
    //     ),
    //     new LmdbCache(
    //       {
    //         ...lmdbCacheOptions,
    //         dbLocation: './cache/warp/src',
    //       },
    //       lmdbSpecificOptions
    //     )
    //   );

    warp = warp.useKVStorageFactory(
      (contractTxId: string) =>
        new LmdbCache(
          {
            ...lmdbCacheOptions,
            dbLocation: `./cache/warp/kv/${contractTxId}`,
          },
          lmdbSpecificOptions
        )
    );
  }

  return warp;
}
