import type {ContractError as WarpContractError, SmartWeaveGlobal} from 'warp-contracts';

declare global {
  const SmartWeave: SmartWeaveGlobal;
  const ContractError = WarpContractError<string>;
}
