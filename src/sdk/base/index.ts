import {defaultCacheOptions, LoggerFactory, Warp, Contract, ArWallet} from 'warp-contracts';
import {LmdbCache} from 'warp-contracts-lmdb';
import {RedisCache} from 'warp-contracts-redis';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import type {HollowDBState} from '../../../contracts/hollowDB/types';
import type {HollowDbSdkArgs} from '../types';

export class Base {
  warp: Warp;
  hollowDB: Contract<HollowDBState>;
  contractTxId: string;
  jwk: ArWallet;

  constructor(args: HollowDbSdkArgs) {
    this.jwk = args.jwk;
    this.contractTxId = args.contractTxId;

    if (args.cacheType === 'redis' && args.redisClient === undefined) {
      throw new Error('Provide a Redis client if you want cacheType redis.');
    }

    LoggerFactory.INST.logLevel('none');
    let warp = args.warp;

    // State Cache extension is recommended
    if (args.useStateCache) {
      const stateCache = {
        lmdb: new LmdbCache(
          {
            ...defaultCacheOptions,
            dbLocation: './cache/warp/state',
          },
          {
            maxEntriesPerContract: 100,
            minEntriesPerContract: 10,
          }
        ),
        redis: new RedisCache({
          client: args.redisClient!,
          prefix: `${args.contractTxId}.state`,
        }),
      }[args.cacheType];
      warp = warp.useStateCache(stateCache);
    }

    // Contract Cache extension is recommended
    if (args.useContractCache) {
      const contractCache = {
        lmdb: {
          definition: new LmdbCache({
            ...defaultCacheOptions,
            dbLocation: './cache/warp/contract',
          }),
          src: new LmdbCache({
            ...defaultCacheOptions,
            dbLocation: './cache/warp/src',
          }),
        },
        redis: {
          definition: new RedisCache({
            client: args.redisClient!,
            prefix: `${args.contractTxId}.contract`,
          }),
          src: new RedisCache({
            client: args.redisClient!,
            prefix: `${args.contractTxId}.src`,
          }),
        },
      }[args.cacheType];
      warp = warp.useContractCache(contractCache.definition, contractCache.src);
    }

    // KV Storage extension is required
    const kvStorageFactory = {
      lmdb: (contractTxId: string) =>
        new LmdbCache({
          ...defaultCacheOptions,
          dbLocation: `./cache/warp/kv/lmdb_2/${contractTxId}`,
        }),
      redis: (contractTxId: string) =>
        new RedisCache({
          client: args.redisClient!,
          prefix: `${this.contractTxId}.${contractTxId}`,
        }),
    }[args.cacheType];
    warp = warp.useKVStorageFactory(kvStorageFactory);

    // SnarkJS extension is required
    warp = warp.use(new SnarkjsExtension());

    // instantiate HollowDB
    this.hollowDB = warp
      .contract<HollowDBState>(this.contractTxId)
      .setEvaluationOptions({
        allowBigInt: true,
        useKVStorage: true,
      })
      .connect(this.jwk);

    // expose warp
    this.warp = warp;
  }
}
