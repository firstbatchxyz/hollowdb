import hollowdbState from './hollowdb.state.json';
import hollowdbHtxState from './hollowdb-htx.state.json';
import {handle as hollowdbHandle} from '../hollowdb.contract';
import {handle as hollowdbHtxHandle} from '../hollowdb-htx.contract';

// adding `satisfies` here allows us to assert that the JSON file conforms our type
export const hollowdb = hollowdbState satisfies Parameters<typeof hollowdbHandle>[0];
export const hollowdbHtx = hollowdbHtxState satisfies Parameters<typeof hollowdbHtxHandle>[0];
