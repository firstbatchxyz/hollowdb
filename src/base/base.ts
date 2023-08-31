import {Warp, Contract, ArWallet, CustomSignature} from 'warp-contracts';
import {SnarkjsExtension} from 'warp-contracts-plugin-snarkjs';
import {EthersExtension} from 'warp-contracts-plugin-ethers';
import type {ContractInput, ContractInputGeneric, ContractMode, ContractState} from '../contracts/types/contract';

export class Base<M extends ContractMode> {
  protected readonly contract: Contract<ContractState<M>>;
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
      // Ethers utilities extension is required for hashing
      .use(new EthersExtension());

    this.contract = this.warp
      .contract<ContractState<M>>(this.contractTxId)
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
   * @param input input in the form of `{function, value}`
   * @returns interaction result
   */
  async dryWrite<I extends ContractInputGeneric>(input: I) {
    return await this.contract.dryWrite(input);
  }

  /**
   * A typed wrapper around `writeInteraction`, which creates a
   * transaction. You are likely to use this after `dryWrite`, or you
   * may directly call this function.
   * @param input input in the form of `{function, value}`
   * @returns interaction response
   */
  async writeInteraction<I extends ContractInputGeneric>(input: I) {
    return await this.contract.writeInteraction(input);
  }

  /**
   * A typed wrapper around `dryWrite` followed by `writeInteraction`. This
   * function first executes the interaction locally via `dryWrite`, and if
   * there is an error, throws an error with an optional prefix in the message.
   * @param input input in the form of `{function, value}`
   * @param errorPrefix optional prefix for the error message
   */
  async dryWriteInteraction<I extends ContractInputGeneric>(input: I) {
    const result = await this.dryWrite(input);
    if (result.type !== 'ok') {
      throw new Error(`Contract Error [${input.function}]: ${result.errorMessage}`);
    }
    await this.writeInteraction(input);
  }

  /**
   * A typed wrapper around `viewState` followed with a repsonse type check. If
   * response type is not `ok`, it will throw an error with an optional prefix.
   * @param input input in the form of `{function, value}`
   * @param errorPrefix optional prefix for the error message
   * @returns
   */
  async safeReadInteraction<I extends ContractInputGeneric, V>(input: I) {
    const response = await this.viewState<I, V>(input);
    if (response.type !== 'ok') {
      throw new Error(`Contract Error [${input.function}]: ${response.errorMessage}`);
    }
    return response.result;
  }

  /**
   * A typed wrapper around `viewState`, which is a read interaction.
   * @param input input in the form of `{function, value}`
   * @returns interaction result
   */
  async viewState<I extends ContractInputGeneric, R>(input: I) {
    return await this.contract.viewState<I, R>(input);
  }
}
