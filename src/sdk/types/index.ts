import {createClient} from '@redis/client';
import {ArWallet, CustomSignature, Warp} from 'warp-contracts';

export type CacheType = 'lmdb' | 'redis';

export type HollowDbSdkArgs = {
  signer: ArWallet | CustomSignature;
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
