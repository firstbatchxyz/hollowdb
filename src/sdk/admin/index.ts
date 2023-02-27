import {ArWallet, EvaluationManifest, knownWarpPlugins, Warp} from 'warp-contracts';
import {Base} from '../base';
import type {HollowDBState} from '../../../contracts/hollowDB/types';
import type {HollowDbSdkArgs} from '../types';

/**
 * HollowDB admin that can set creator and set verification key.
 * For both operations, the admin wallet address must match the
 * creator in the contract state.
 */
export class Admin extends Base {
  constructor(args: HollowDbSdkArgs) {
    super(args);
  }

  /**
   * Sets the creator as the given wallet address.
   * @param jwk wallet of the new owner
   */
  async changeCreator(jwk: ArWallet) {
    const addr = await this.warp.arweave.wallets.jwkToAddress(jwk);
    await this.hollowDB.writeInteraction({
      function: 'setCreator',
      data: {
        creator: addr,
      },
    });
  }

  /**
   * Updates the verification key.
   * @param verificationKey verification key
   */
  async setVerificationKey(verificationKey: object) {
    await this.hollowDB.writeInteraction({
      function: 'setVerificationKey',
      data: {
        verificationKey,
      },
    });
  }

  /**
   * Utility function to deploy the HollowDB contract.
   * @param creator wallet to deploy the contract
   * @param warp optional warp instance, defaults to mainnet
   * @returns transaction ids and the initial state
   */
  static async deploy(
    creator: ArWallet,
    initialState: HollowDBState,
    contractSource: string,
    warp: Warp
  ): Promise<{contractTxId: string; srcTxId: string | undefined}> {
    // override creator with the deployer wallet
    initialState.creator = await warp.arweave.wallets.jwkToAddress(creator);

    // deploy
    const evaluationManifest: EvaluationManifest = {
      evaluationOptions: {
        allowBigInt: true,
        useKVStorage: true,
      },
    };
    const {contractTxId, srcTxId} = await warp.deploy({
      wallet: creator,
      initState: JSON.stringify(initialState),
      src: contractSource,
      evaluationManifest,
    });

    return {contractTxId, srcTxId};
  }
}
