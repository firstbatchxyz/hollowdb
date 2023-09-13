import {handle} from '../hollowdb.contract';

export default {
  version: '0.0.0',
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
} satisfies Parameters<typeof handle>[0];
