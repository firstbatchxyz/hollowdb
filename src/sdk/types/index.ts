import {createClient} from 'redis';
import {ArWallet, Warp} from 'warp-contracts';

export type CacheType = 'lmdb' | 'redis';

export type HollowDbSdkArgs = {
  jwk: ArWallet;
  contractTxId: string;
  cacheType: CacheType;
  warp: Warp;
  useContractCache?: Boolean;
  useStateCache?: Boolean;
  redisClient?: ReturnType<typeof createClient>;
  limitOptions?: {
    minEntriesPerContract: number;
    maxEntriesPerContract: number;
  };
};
