import type {HollowState} from '../hollowdb';

export default {
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
} satisfies HollowState;
