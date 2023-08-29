import type {handle} from '../hollowdb-htx';

const initialState: Parameters<typeof handle>[0] = {
  owner: '',
  verificationKeys: {
    auth: null,
  },
  isProofRequired: {
    auth: true,
  },
  canEvolve: true,
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
