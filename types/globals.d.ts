import {ContractError, SmartWeaveGlobal} from 'warp-contracts';

// Globally available things must be declared here
declare global {
  var SmartWeave: SmartWeaveGlobal;
  var ContractError = ContractError;
}
