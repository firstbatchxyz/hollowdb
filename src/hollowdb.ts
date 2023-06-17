import {BaseSDK, BaseAdmin} from './common';
import {HollowState} from './contracts/hollowdb';

export class SDK<V = unknown> extends BaseSDK<HollowState, V> {}
export class Admin<V = unknown> extends BaseAdmin<HollowState, V> {}
