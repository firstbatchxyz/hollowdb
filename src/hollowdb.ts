import {BaseSDK, BaseAdmin} from './base';
import {HollowState} from './contracts/hollowdb';

export class SDK<V = unknown> extends BaseSDK<HollowState, V> {}
export class Admin<V = unknown> extends BaseAdmin<HollowState, V> {}
