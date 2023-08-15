import {SDK as BaseSDK, Admin as BaseAdmin} from './base';

export class SDK<V = unknown> extends BaseSDK<V, {proofs: ['auth']; whitelists: ['put', 'update']}> {}
export class Admin<V = unknown> extends BaseAdmin<V, {proofs: ['auth']; whitelists: ['put', 'update']}> {}
