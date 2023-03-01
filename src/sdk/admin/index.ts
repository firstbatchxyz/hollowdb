import {ArWallet, EvaluationManifest, Warp} from 'warp-contracts';
import {Base} from '../base';
import {HollowDBInput, HollowDBState} from '../../../contracts/hollowDB/types';
import type {HollowDbSdkArgs} from '../types';

/**
 * HollowDB admin that can set owner and set verification key.
 * For both operations, the admin wallet address must match the
 * owner in the contract state.
 */
export class Admin extends Base {
  constructor(args: HollowDbSdkArgs) {
    super(args);
  }

  /**
   * Sets the owner as the given wallet address.
   * @param jwk wallet of the new owner
   */
  async changeOwner(jwk: ArWallet) {
    const addr = await this.warp.arweave.wallets.jwkToAddress(jwk);
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          owner: addr,
        },
      },
    });
  }

  /**
   * Updates the verification key.
   * @param verificationKey verification key
   */
  async setVerificationKey(verificationKey: object) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          verificationKey: verificationKey,
        },
      },
    });
  }

  /**
   * Updates the verification key.
   * @param verificationKey verification key
   */
  async setWhitelistRequirement(isWhitelistRequired: boolean) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          isWhitelistRequired: isWhitelistRequired,
        },
      },
    });
  }

  /**
   * Updates the verification key.
   * @param isProofRequired true if you want ZKP to be mandatory
   */
  async setProofRequirement(isProofRequired: boolean) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          isProofRequired: isProofRequired,
        },
      },
    });
  }

  /**
   * Add a list of users to the whitelist. This way, if `isWhitelistRequired` is true,
   * only the whitelisted users may do operations on HollowDB.
   * @param users a list of users to be whitelisted
   */
  async addUsersToWhitelist(users: string[]) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateWhitelist',
      data: {
        whitelist: {
          add: users,
          remove: [],
        },
      },
    });
  }

  async removeUsersFromWhitelist(users: string[]) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateWhitelist',
      data: {
        whitelist: {
          remove: users,
          add: [],
        },
      },
    });
  }

  /**
   * Utility function to deploy the HollowDB contract.
   * @param owner wallet to deploy the contract
   * @param initialState the initial HollowDB state; owner will be overwritten
   * @param contractSource source code of the contract, as a string
   * @param warp optional warp instance, defaults to mainnet
   * @returns transaction ids and the initial state
   */
  static async deploy(
    owner: ArWallet,
    initialState: HollowDBState,
    contractSource: string,
    warp: Warp
  ): Promise<{contractTxId: string; srcTxId: string | undefined}> {
    // default owner becomes the deployer, and is also whitelisted
    const ownerAddress = await warp.arweave.wallets.jwkToAddress(owner);
    initialState.owner = ownerAddress;
    initialState.whitelist[ownerAddress] = true;

    // deploy
    const evaluationManifest: EvaluationManifest = {
      evaluationOptions: {
        allowBigInt: true,
        useKVStorage: true,
      },
    };
    const {contractTxId, srcTxId} = await warp.deploy({
      wallet: owner,
      initState: JSON.stringify(initialState),
      src: contractSource,
      evaluationManifest,
    });

    return {contractTxId, srcTxId};
  }
}
