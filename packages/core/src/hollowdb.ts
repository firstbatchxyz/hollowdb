import {BaseSDK} from './';

export class SDK<V = unknown> extends BaseSDK<V, {proofs: ['auth']; whitelists: ['put', 'update']}> {}
