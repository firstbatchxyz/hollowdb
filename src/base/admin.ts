import type {
  ContractMode,
  UpdateOwnerInput,
  UpdateProofRequirementInput,
  UpdateWhitelistRequirementInput,
  UpdateVerificationKeyInput,
  UpdateWhitelistInput,
  OpitonalArray,
} from '../contracts/types';
import {Base} from './base';

export class Admin<M extends ContractMode = ContractMode> {
  constructor(private readonly base: Base<M>) {}

  /**
   * Sets the owner as the given wallet address.
   * @param newOwner address of the new owner, make sure that this is correct!
   */
  async updateOwner(newOwner: string) {
    await this.base.writeInteraction<UpdateOwnerInput>({
      function: 'updateOwner',
      value: {
        newOwner,
      },
    });
  }

  // TODO: transfer ownership
  // remove yourself from whitelists and such

  /**
   * Changes the whitelist for the selected list.
   * @param users an array of user addresses
   * @param name name of the list to be updated
   * @param op whether to `add` the users to whitelist or `remove` them
   */
  async updateWhitelist(users: string[], name: OpitonalArray<M['whitelists'], string>, op: 'add' | 'remove') {
    const add = op === 'add' ? users : [];
    const remove = op === 'remove' ? users : [];
    await this.base.writeInteraction<UpdateWhitelistInput<M['whitelists']>>({
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
  async updateVerificationKey(
    name: OpitonalArray<M['proofs'], string>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    verificationKey: any
  ) {
    await this.base.writeInteraction<UpdateVerificationKeyInput<M['proofs']>>({
      function: 'updateVerificationKey',
      value: {
        verificationKey,
        name,
      },
    });
  }

  /**
   * Disable or enable whitelist checks for a specific whitelist.
   * @param name name of the list
   * @param value a boolean
   */
  async updateWhitelistRequirement(name: OpitonalArray<M['whitelists'], string>, value: boolean) {
    await this.base.writeInteraction<UpdateWhitelistRequirementInput<M['whitelists']>>({
      function: 'updateWhitelistRequirement',
      value: {
        name,
        value,
      },
    });
  }

  /**
   * Disable or enable proof checks for a specific circuit.
   * @param name name of the circuit
   * @param value a boolean
   */
  async updateProofRequirement(name: OpitonalArray<M['proofs'], string>, value: boolean) {
    await this.base.writeInteraction<UpdateProofRequirementInput<M['proofs']>>({
      function: 'updateProofRequirement',
      value: {
        name,
        value,
      },
    });
  }
}
