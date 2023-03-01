import {HollowDBFunctionSelector} from '../types';

const errors = {
  KeyExistsError: new ContractError('Key already exists, use update instead'),
  KeyNotExistsError: new ContractError('Key does not exist'),
  UnknownFunctionError: (f: HollowDBFunctionSelector) => new ContractError('Unknown function: ', f),
  InvalidProofError: (f: HollowDBFunctionSelector) => new ContractError('Proof verification failed in: ' + f),
  NotOwnerError: (f: HollowDBFunctionSelector) =>
    new ContractError('Only the contract owner has access to contract method: ' + f),
};

export default errors as Readonly<typeof errors>;
