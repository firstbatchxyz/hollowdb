import type {Warp, Contract, ArWallet, CustomSignature} from 'warp-contracts';
import type {ContractInputGeneric, ContractMode, ContractState} from '../contracts/types/contract';

export class Base<M extends ContractMode> {
  readonly contract: Contract<ContractState<M>>;
  readonly warp: Warp;
  readonly signer: ArWallet | CustomSignature;

  constructor(signer: ArWallet | CustomSignature, contractTxId: string, warp: Warp) {
    this.signer = signer;

    this.warp = warp;

    this.contract = this.warp
      .contract<ContractState<M>>(contractTxId)
      .setEvaluationOptions({
        allowBigInt: true,
        useKVStorage: true,
        sequencerUrl: warp.environment === 'mainnet' ? 'https://gw.warp.cc/' : undefined,
      })
      .connect(this.signer);
  }

  /**
   * Return the latest contract state.
   *
   * This is a good way to trigger Warp to fetch the latest data from Arweave.
   * Note that if the contract has many transactions, fetching up to the latest
   * state may take some time.
   *
   * @returns contract state along with corresponding sort key
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
   * A typed wrapper around `viewState` followed with a repsonse type check.
   * If response type is not `ok`, it will throw an error.
   * @param input input in the form of `{function, value}`
   * @returns interaction result
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
