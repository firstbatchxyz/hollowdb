import {defaultCacheOptions, LoggerFactory, Warp, Contract, ArWallet, CustomSignature} from 'warp-contracts';
import {LmdbCache} from 'warp-contracts-lmdb';
import {RedisCache} from 'warp-contracts-redis';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import {EthersExtension} from 'warp-contracts-plugin-ethers';
import type {HollowDBState} from '../../contracts/hollowDB/types';
import type {HollowDbSdkArgs} from './types';
import constants from './constants';

export class Base {
  protected readonly logger = LoggerFactory.INST.logLevel('none');
  readonly warp: Warp;
  readonly hollowDB: Contract<HollowDBState>;
  readonly contractTxId: string;
  readonly signer: ArWallet | CustomSignature;

  constructor(args: HollowDbSdkArgs) {
    this.signer = args.signer;
    this.contractTxId = args.contractTxId;
    const limitOptions = args.limitOptions || constants.DEFAULT_LIMIT_OPTS[args.cacheType];

    // check redis
    if (args.cacheType === 'redis' && args.redisClient === undefined) {
      throw new Error('Provide a Redis client if you want cacheType redis.');
    }

    let warp = args.warp;

    // State Cache extension is recommended
    if (args.useStateCache) {
      const stateCache = {
        lmdb: new LmdbCache(
          {
            ...defaultCacheOptions,
            dbLocation: './cache/warp/state',
          },
          limitOptions
        ),
        redis: new RedisCache({
          client: args.redisClient!,
          prefix: `${args.contractTxId}.state`,
          ...limitOptions,
        }),
      }[args.cacheType];
      warp = warp.useStateCache(stateCache);
    }

    // ContractCache extension is recommended
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
            ...limitOptions,
          }),
          src: new RedisCache({
            client: args.redisClient!,
            prefix: `${args.contractTxId}.src`,
            ...limitOptions,
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
          prefix: `${args.contractTxId}.${contractTxId}`,
        }),
    }[args.cacheType];
    warp = warp.useKVStorageFactory(kvStorageFactory);

    // SnarkJS extension is required for proof verification
    warp = warp.use(new SnarkjsExtension());

    // Ethers extension is required for hashing (ripemd160)
    warp = warp.use(new EthersExtension());

    // instantiate HollowDB
    this.hollowDB = warp
      .contract<HollowDBState>(args.contractTxId)
      .setEvaluationOptions({
        allowBigInt: true, // bigInt is required for circuits
        useKVStorage: true,
      })
      .connect(this.signer);

    // expose warp
    this.warp = warp;
  }
}
