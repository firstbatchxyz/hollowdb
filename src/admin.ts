import {EvaluationManifest, JWKInterface, Warp} from 'warp-contracts';
import type {HollowDBInput, HollowDBState} from '../contracts/hollowDB/types';
import {ArweaveSigner} from 'warp-contracts-plugin-deploy';
import {SDK} from './sdk';

/**
 * HollowDB admin that can set owner and set verification key.
 * For both operations, the admin wallet address must match the
 * owner in the contract state.
 */
export class Admin extends SDK {
  /**
   * Sets the owner as the given wallet address.
   * @param newOwnerAddress address of the new owner, make sure that this is correct!
   */
  async changeOwner(newOwnerAddress: HollowDBState['owner']) {
    // TODO: add regex check for arweave & ethereum addresses
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          owner: newOwnerAddress,
        },
      },
    });
  }

  /**
   * Updates the verification key.
   * @param verificationKey verification key
   */
  async setVerificationKey(verificationKey: HollowDBState['verificationKey']) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          verificationKey,
        },
      },
    });
  }

  /**
   * Set the whitelist requirement condition.
   * - if true, certain operations will require callers to be whitelisted
   * - otherwise, whitelisting will be ignored
   * @param isProofRequired true if you want whitelisting
   */
  async setWhitelistRequirement(isWhitelistRequired: HollowDBState['isWhitelistRequired']) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          isWhitelistRequired,
        },
      },
    });
  }

  /**
   * Set the proof requirement condition.
   * - if true, certain operations will require zero-knowledge proofs (ZKP)
   * - otherwise, proofs will be ignored
   * @param isProofRequired true if you want zero-knowledge proofs
   */
  async setProofRequirement(isProofRequired: HollowDBState['isProofRequired']) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateState',
      data: {
        newState: {
          isProofRequired,
        },
      },
    });
  }

  /**
   * Add a list of users to the whitelist. This way, if `isWhitelistRequired` is true,
   * only the whitelisted users may do operations on HollowDB.
   * @param users a list of users to be whitelisted
   * @param type type of whitelist, PUT or UPDATE. Note that REMOVE also uses the whitelist of UPDATE
   */
  async addUsersToWhitelist(users: string[], type: keyof HollowDBState['whitelist']) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateWhitelist',
      data: {
        whitelist: {
          add: users,
          remove: [],
        },
        type,
      },
    });
  }

  /**
   * Removes a list of users from whitelist.
   * @param users a list of users to be removed from whitelist
   * @param type type of whitelist, PUT or UPDATE. Note that REMOVE also uses the whitelist of UPDATE
   */
  async removeUsersFromWhitelist(users: string[], type: keyof HollowDBState['whitelist']) {
    await this.hollowDB.writeInteraction<HollowDBInput>({
      function: 'updateWhitelist',
      data: {
        whitelist: {
          remove: users,
          add: [],
        },
        type,
      },
    });
  }

  /**
   * Utility function to deploy the HollowDB contract.
   * @param owner wallet to deploy the contract
   * @param initialState the initial HollowDB state; owner will be overwritten
   * @param contractSource source code of the contract, as a string
   * @param warp warp instance
   * @returns transaction ids
   */
  static async deploy(
    // TODO: we may allow "signer" type from arbundle, which would allow any wallet to deploy a contract https://github.com/Bundlr-Network/arbundles
    owner: JWKInterface,
    initialState: HollowDBState,
    contractSource: string,
    warp: Warp,
    disableBundling = false
  ): Promise<{contractTxId: string; srcTxId: string | undefined}> {
    // default owner becomes the deployer, and is also whitelisted
    // although whitelisting is not enabled, this is done just in case*
    const ownerAddress = await warp.arweave.wallets.jwkToAddress(owner);
    initialState.owner = ownerAddress;
    initialState.whitelist['put'][ownerAddress] = true;
    initialState.whitelist['update'][ownerAddress] = true;

    // deploy
    const evaluationManifest: EvaluationManifest = {
      evaluationOptions: {
        allowBigInt: true,
        useKVStorage: true,
      },
    };

    const {contractTxId, srcTxId} = await warp.deploy(
      {
        wallet: disableBundling ? owner : new ArweaveSigner(owner),
        initState: JSON.stringify(initialState),
        src: contractSource,
        evaluationManifest,
      },
      disableBundling
    );

    return {contractTxId, srcTxId};
  }

  /**
   * Utility function to evolve the HollowDB contract.
   * @param owner wallet to deploy the new contract
   * @param contractSource source code of the new contract, as a string
   * @param contractTxId contract transaction id of the old contract
   * @param warp warp instance
   * @returns transaction ids
   */
  static async evolve(
    owner: JWKInterface,
    contractSource: string,
    contractTxId: string,
    warp: Warp,
    disableBundling = false
  ): Promise<{contractTxId: string; srcTxId: string}> {
    // connect to the contract that we want to evolve
    const contract = warp.contract(contractTxId).connect(owner);

    // create a new source
    // TODO: we may allow "signer" type from arbundle, which would allow any wallet to deploy a contract https://github.com/Bundlr-Network/arbundles
    const newSource = await warp.createSource(
      {src: contractSource},
      disableBundling ? owner : new ArweaveSigner(owner)
    );

    // save contract source
    const newSrcTxId = await warp.saveSource(newSource);

    // evolve contract
    await contract.evolve(newSrcTxId);

    return {contractTxId, srcTxId: newSrcTxId};
  }
}
