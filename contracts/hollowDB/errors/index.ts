const errors = {
  KeyExistsError: new ContractError('Key already exists, use update instead'),
  KeyNotExistsError: new ContractError('Key does not exist'),
  CantEvolveError: new ContractError('Evolving is disabled'),
  NotWhitelistedError: (f: string) => new ContractError('User is not whitelisted for: ' + f),
  UnknownFunctionError: (f: string) => new ContractError('Unknown function: ', f),
  InvalidProofError: (f: string) => new ContractError('Proof verification failed in: ' + f),
  NotOwnerError: (f: string) => new ContractError('Only the contract owner has access to: ' + f),
};

export default errors as Readonly<typeof errors>;
