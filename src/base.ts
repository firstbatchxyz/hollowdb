import {Warp, Contract, ArWallet, CustomSignature} from 'warp-contracts';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import {EthersExtension} from 'warp-contracts-plugin-ethers';
import type {ContractInput, ContractState} from '../contracts/common/types/contract';

/** A Base class for constructing the SDK and exposing type-safe Warp contract functions. */
export class Base {
  protected readonly contract: Contract<ContractState>;
  readonly warp: Warp;
  readonly contractTxId: string;
  readonly signer: ArWallet | CustomSignature;

  /**
   * Connects to the given contract via the provided Warp instance using the provided signer.
   * @param signer a Signer, such as Arweave wallet or Ethereum CustomSignature
   * @param contractTxId contract txId to connect to
   * @param warp a Warp instace, such as `WarpFactory.forMainnet()`
   */
  constructor(signer: ArWallet | CustomSignature, contractTxId: string, warp: Warp) {
    this.signer = signer;
    this.contractTxId = contractTxId;
    this.warp = warp
      // SnarkJS extension is required for proof verification
      .use(new SnarkjsExtension())
      // Ethers extension is required for hashing (ripemd160)
      .use(new EthersExtension());

    // instantiate HollowDB
    this.contract = this.warp
      .contract<ContractState>(this.contractTxId)
      .setEvaluationOptions({
        allowBigInt: true, // bigInt is required for circuits
        useKVStorage: true,
      })
      .connect(this.signer);
  }

  /**
   * Return the latest contract state.
   * @returns contract state
   */
  async readState() {
    return await this.contract.readState();
  }

  /**
   * A typed wrapper around `dryWrite`, which evaluates a given input
   * on the local state, without creating a transaction. This may provide
   * better UX for some use-cases.
   * @param input input in the form of `{function, data}`
   * @returns interaction result
   */
  async dryWrite(input: ContractInput) {
    return await this.contract.dryWrite(input);
  }

  /**
   * A typed wrapper around `writeInteraction`, which creates a
   * transaction. You are likely to use this after `dryWrite`, or you
   * may directly call this function.
   * @param input input in the form of `{function, data}`
   * @returns interaction response
   */
  async writeInteraction(input: ContractInput) {
    return await this.contract.writeInteraction(input);
  }

  /**
   * A typed wrapper around `viewState`, which is a read interaction.
   * @param input input in the form of `{function, data}`
   * @returns interaction result
   */
  async viewState<V>(input: ContractInput) {
    return this.contract.viewState<typeof input, V>(input);
  }
}
