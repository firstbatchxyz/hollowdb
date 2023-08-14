import {JWKInterface, Warp} from 'warp-contracts';
import {ArweaveSigner} from 'warp-contracts-plugin-deploy';
import {BaseSDK} from './sdk';
import type {
  ContractMode,
  ContractState,
  UpdateOwnerInput,
  UpdateRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
} from '../contracts/types';

export class BaseAdmin<V = unknown, M extends ContractMode = {whitelists: []; circuits: []}> extends BaseSDK<V, M> {
  /**
   * Sets the owner as the given wallet address.
   * @param newOwner address of the new owner, make sure that this is correct!
   */
  async updateOwner(newOwner: string) {
    await this.writeInteraction<UpdateOwnerInput>({
      function: 'updateOwner',
      value: {
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
    await this.writeInteraction<UpdateWhitelistInput<M['whitelists']>>({
      function: 'updateWhitelist',
      value: {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateVerificationKey(name: keyof S['verificationKeys'], verificationKey: any) {
    await this.writeInteraction<UpdateVerificationKeyInput<M['circuits']>>({
      function: 'updateVerificationKey',
      value: {
        verificationKey,
        name: name as string,
      },
    });
  }

  /**
   * Disable or enable whitelist checks for a specific whitelist.
   * @param name name of the list
   * @param value a boolean
   */
  async updateWhitelistRequirement(name: keyof State['whitelists'], value: boolean) {
    await this.writeInteraction<UpdateRequirementInput>({
      function: 'updateRequirement',
      value: {
        type: 'whitelist',
        name: name as string,
        value,
      },
    });
  }

  /**
   * Disable or enable proof checks for a specific circuit.
   * @param name name of the circuit
   * @param value a boolean
   */
  async updateProofRequirement(name: keyof State['verificationKeys'], value: boolean) {
    await this.writeInteraction<UpdateRequirementInput>({
      function: 'updateRequirement',
      value: {
        type: 'proof',
        name: name as string,
        value,
      },
    });
  }

  /**
   * Deploy a new contract.
   * @param owner wallet to deploy the contract
   * @param initialState the initial state
   * @param contractSource source code of the contract, as a string
   * @param warp warp instance
   * @returns contract and source transaction ids
   */
  static async deploy(
    owner: JWKInterface,
    initialState: ContractState,
    contractSource: string,
    warp: Warp,
    disableBundling = false
  ): Promise<{contractTxId: string; srcTxId: string | undefined}> {
    const ownerAddress = await warp.arweave.wallets.jwkToAddress(owner);

    initialState.owner = ownerAddress;
    for (const list in initialState.whitelists) {
      initialState.whitelists[list as keyof typeof initialState.whitelists][ownerAddress] = true;
    }

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
   * Deploy a new contract from an existing contract's source code.
   * @param owner wallet to deploy the contract
   * @param initialState the initial state
   * @param srcTxId source transaction id of the contract source code
   * @param warp warp instance
   * @returns contract and source transaction ids
   */
  static async deployFromSrc(
    owner: JWKInterface,
    initialState: ContractState,
    srcTxId: string,
    warp: Warp,
    disableBundling = false
  ): Promise<{contractTxId: string; srcTxId: string | undefined}> {
    const ownerAddress = await warp.arweave.wallets.jwkToAddress(owner);

    initialState.owner = ownerAddress;
    for (const list in initialState.whitelists) {
      initialState.whitelists[list as keyof typeof initialState.whitelists][ownerAddress] = true;
    }

    const {contractTxId} = await warp.deployFromSourceTx({
      wallet: disableBundling ? owner : new ArweaveSigner(owner),
      initState: JSON.stringify(initialState),
      srcTxId: srcTxId,
      evaluationManifest: {
        evaluationOptions: {
          allowBigInt: true,
          useKVStorage: true,
        },
      },
    });

    return {contractTxId, srcTxId};
  }

  /**
   * Evolve an existing contract with a new source code.
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
    const contract = warp.contract(contractTxId).connect(owner);

    const newSource = await warp.createSource(
      {src: contractSource},
      disableBundling ? owner : new ArweaveSigner(owner)
    );

    const newSrcTxId = await warp.saveSource(newSource);
    await contract.evolve(newSrcTxId);

    return {contractTxId, srcTxId: newSrcTxId};
  }

  /**
   * Evolve an existing contract with a source code of an existing contract.
   * @param owner wallet to deploy the new contract
   * @param srcTxId source transaction id of the contract source code
   * @param contractTxId contract transaction id of the old contract
   * @param warp warp instance
   * @returns transaction ids
   */
  static async evolveFromSrc(
    owner: JWKInterface,
    srcTxId: string,
    contractTxId: string,
    warp: Warp
  ): Promise<{contractTxId: string; srcTxId: string}> {
    const contract = warp.contract(contractTxId).connect(owner);
    await contract.evolve(srcTxId);
    return {contractTxId, srcTxId};
  }
}
