import type {HollowDBState} from '../contracts/hollowDB/types';

const initialState: HollowDBState = {
  owner: '',
  verificationKey: {},
  isProofRequired: true,
  whitelist: {},
  isWhitelistRequired: false,
};

export default initialState;
