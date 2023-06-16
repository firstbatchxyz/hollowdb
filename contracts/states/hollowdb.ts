import {ContractState} from '../common/types/contract';

const initialState: ContractState = {
  owner: '',
  canEvolve: true,
  verificationKeys: {
    auth: null,
  },
  isProofRequired: {
    auth: true,
  },
  whitelists: {
    put: {},
    update: {},
  },
  isWhitelistRequired: {
    put: false,
    update: false,
  },
};

export default initialState;
