import {JWKInterface, Warp} from 'warp-contracts';
import {ArweaveSigner} from 'warp-contracts-plugin-deploy';
import type {ContractState} from '../contracts/common/types/contract';
import {SDK} from './sdk';

/**
 * HollowDB admin that can set owner and set verification key.
 * For both operations, the admin wallet address must match the
 * owner in the contract state.
 */
export class Admin<V = unknown> extends SDK<V> {
  /**
   * Sets the owner as the given wallet address.
   * @param newOwner address of the new owner, make sure that this is correct!
   */
  async changeOwner(newOwner: ContractState['owner']) {
    await this.writeInteraction({
      function: 'updateOwner',
      data: {
        newOwner,
      },
    });
  }

  /**
   * Changes the whitelist for the selected list.
   * @param users an array of user addresses
   * @param name name of the list to be updated
   * @param op whether to `add` the users to whitelist or `remove` them
   */
  async updateWhitelist(users: string[], name: string, op: 'add' | 'remove') {
    const add = op === 'add' ? users : [];
    const remove = op === 'remove' ? users : [];
    await this.writeInteraction({
      function: 'updateWhitelist',
      data: {
        add,
        remove,
        name,
      },
    });
  }

  /**
   * Update a verification key.
   * @param name name of the circuit that the verification key belongs to
   * @param verificationKey verification key
   */
  async updateVerificationKey(name: string, verificationKey: any) {
    await this.writeInteraction({
      function: 'updateVerificationKey',
      data: {
        name,
        verificationKey,
      },
    });
  }

  /**
   * Updates the requirement of whitelist or proof, essentially changing the mode of operation.
   * @param type type of requirement, either `whitelist` or `proof`
   * @param name name of the whitelist / circuit
   * @param value `true` to enable, `false` to disable the requirement
   */
  async updateRequirement(type: 'whitelist' | 'proof', name: string, value: boolean) {
    await this.writeInteraction({
      function: 'updateRequirement',
      data: {
        name,
        type,
        value,
      },
    });
  }

  /**
   * Utility function to deploy a contract.
   * @param owner wallet to deploy the contract
   * @param initialState the initial state
   * @param contractSource source code of the contract, as a string
   * @param warp warp instance
   * @returns transaction ids
   */
  static async deploy(
    owner: JWKInterface,
    initialState: ContractState,
    contractSource: string,
    warp: Warp,
    disableBundling = false
  ): Promise<{contractTxId: string; srcTxId: string | undefined}> {
    const ownerAddress = await warp.arweave.wallets.jwkToAddress(owner);

    // deployer is the owner by default
    initialState.owner = ownerAddress;

    // owner is also whitelisted on everything, whether or not whitelisting is enabled
    for (const list in initialState.whitelists) {
      initialState.whitelists[list as keyof typeof initialState.whitelists][ownerAddress] = true;
    }

    // deploy
    const {contractTxId, srcTxId} = await warp.deploy(
      {
        wallet: disableBundling ? owner : new ArweaveSigner(owner),
        initState: JSON.stringify(initialState),
        src: contractSource,
        evaluationManifest: {
          evaluationOptions: {
            allowBigInt: true,
            useKVStorage: true,
          },
        },
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
