import {CacheOptions, Warp, defaultCacheOptions} from 'warp-contracts';
import {LmdbCache} from 'warp-contracts-lmdb';
import {LmdbOptions} from 'warp-contracts-lmdb/lib/types/LmdbOptions';
import {RedisCache, RedisOptions} from 'warp-contracts-redis';
import constants from '../constants';
import {globals} from '../../jest.config.cjs';
import {Redis} from 'ioredis';

export function overrideCache(
  warp: Warp,
  cacheType: 'lmdb' | 'redis' | 'default',
  useCache: {state?: boolean; contract?: boolean},
  client?: Redis
): Warp {
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
          url: globals.__REDIS_URL__,
        };

    if (useCache.state)
      warp = warp.useStateCache(
        new RedisCache(
          {
            ...redisCacheOptions,
            dbLocation: 'state',
          },
          redisSpecificOptions
        )
      );
    if (useCache.contract)
      warp = warp.useContractCache(
        new RedisCache(
          {
            ...redisCacheOptions,
            dbLocation: 'contract',
          },
          redisSpecificOptions
        ),
        new RedisCache(
          {
            ...redisCacheOptions,
            dbLocation: 'src',
          },
          redisSpecificOptions
        )
      );

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

    if (useCache.state)
      warp = warp.useStateCache(
        new LmdbCache(
          {
            ...lmdbCacheOptions,
            dbLocation: './cache/warp/state',
          },
          lmdbSpecificOptions
        )
      );

    if (useCache.contract)
      warp = warp.useContractCache(
        new LmdbCache(
          {
            ...lmdbCacheOptions,
            dbLocation: './cache/warp/contract',
          },
          lmdbSpecificOptions
        ),
        new LmdbCache(
          {
            ...lmdbCacheOptions,
            dbLocation: './cache/warp/src',
          },
          lmdbSpecificOptions
        )
      );

    warp = warp.useKVStorageFactory(
      (contractTxId: string) =>
        new LmdbCache({
          ...defaultCacheOptions,
          dbLocation: `./cache/warp/kv/${contractTxId}`,
        })
    );
  }

  return warp;
}
