import {BaseSDK} from './';

type Mode = {proofs: ['auth']; whitelists: ['put', 'update']};
export class SDK<V = unknown> extends BaseSDK<V, Mode> {}
