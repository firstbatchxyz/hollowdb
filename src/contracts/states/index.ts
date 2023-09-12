import hollowdbState from './hollowdb.json';
import {handle as hollowdbHandle} from '../hollowdb.contract';

import hollowdbHtxState from './hollowdb-htx.json';
import {handle as hollowdbHtxHandle} from '../hollowdb-htx.contract';

export const hollowdb = hollowdbState as Parameters<typeof hollowdbHandle>[0];
export const hollowdbHtx = hollowdbHtxState as Parameters<typeof hollowdbHtxHandle>[0];
