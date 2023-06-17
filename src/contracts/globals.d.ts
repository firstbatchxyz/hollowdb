import type {ContractError as WarpContractError, SmartWeaveGlobal} from 'warp-contracts';

// Globally available things must be declared here
declare global {
  const SmartWeave: SmartWeaveGlobal;
  const ContractError = WarpContractError<string>;
}
