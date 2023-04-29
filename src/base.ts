import {LoggerFactory, Warp, Contract, ArWallet, CustomSignature} from 'warp-contracts';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import {EthersExtension} from 'warp-contracts-plugin-ethers';
import type {HollowDBState} from '../contracts/hollowDB/types';

export class Base {
  protected readonly logger = LoggerFactory.INST.logLevel('none');
  readonly warp: Warp;
  readonly hollowDB: Contract<HollowDBState>;
  readonly contractTxId: string;
  readonly signer: ArWallet | CustomSignature;

  constructor(signer: ArWallet | CustomSignature, contractTxId: string, warp: Warp) {
    this.signer = signer;
    this.contractTxId = contractTxId;
    this.warp = warp
      // SnarkJS extension is required for proof verification
      .use(new SnarkjsExtension())
      // Ethers extension is required for hashing (ripemd160)
      .use(new EthersExtension());

    // instantiate HollowDB
    this.hollowDB = this.warp
      .contract<HollowDBState>(this.contractTxId)
      .setEvaluationOptions({
        allowBigInt: true, // bigInt is required for circuits
        useKVStorage: true,
      })
      .connect(this.signer);
  }
}
