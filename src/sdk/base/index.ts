import {
  defaultCacheOptions,
  LoggerFactory,
  Warp,
  Contract,
  ArWallet,
  CustomSignature,
  SignatureType,
} from 'warp-contracts';
import {LmdbCache} from 'warp-contracts-lmdb';
import {RedisCache} from 'warp-contracts-redis';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import {EthersExtension} from 'warp-contracts-plugin-ethers';
import type {HollowDBState} from '../../../contracts/hollowDB/types';
import type {HollowDbSdkArgs} from '../types';
import {EvmSignatureVerificationWebPlugin} from 'warp-contracts-plugin-signature';

/**
 * Default options for limiting cache usage per key.
 */
const defaultLimitOptions = {
  lmdb: {
    minEntriesPerContract: 10,
    maxEntriesPerContract: 100,
  },
  redis: {
    minEntriesPerContract: 10,
    maxEntriesPerContract: 100,
  },
};

export class Base {
  protected readonly logger = LoggerFactory.INST.logLevel('none');
  readonly warp: Warp;
  readonly hollowDB: Contract<HollowDBState>;
  readonly contractTxId: string;
  readonly signer: ArWallet | CustomSignature;
  readonly signatureType: SignatureType;

  constructor(args: HollowDbSdkArgs) {
    this.signer = args.signer;
    if (Object.prototype.hasOwnProperty.call(this.signer, 'type')) {
      this.signatureType = (this.signer as CustomSignature).type;
    } else {
      this.signatureType = 'arweave';
    }
    this.contractTxId = args.contractTxId;
    args.limitOptions = args.limitOptions || defaultLimitOptions[args.cacheType];

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
          args.limitOptions
        ),
        redis: new RedisCache({
          client: args.redisClient!,
          prefix: `${args.contractTxId}.state`,
          ...args.limitOptions,
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
            ...args.limitOptions,
          }),
          src: new RedisCache({
            client: args.redisClient!,
            prefix: `${args.contractTxId}.src`,
            ...args.limitOptions,
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

    // SnarkJS extension is required for proof verification
    warp = warp.use(new SnarkjsExtension());

    // Ethers extension is required for hashing
    warp = warp.use(new EthersExtension());

    // If signer is ethereum, EVM signature plugin is needed
    if (this.signatureType === 'ethereum') {
      warp = warp.use(new EvmSignatureVerificationWebPlugin());
    }

    // instantiate HollowDB
    this.hollowDB = warp
      .contract<HollowDBState>(this.contractTxId)
      .setEvaluationOptions({
        allowBigInt: true,
        useKVStorage: true,
      })
      .connect(this.signer);

    // expose warp
    this.warp = warp;
  }
}
