import type {ContractInputGeneric, ContractState} from '../types';

/**
 * Apply allows one to execute modifiers which are functions that are run
 * before the function body is executed, similar to [Solidity modifiers](https://docs.soliditylang.org/en/latest/contracts.html#function-modifiers).
 *
 * The first three arguments are mandatory, and the remaining arguments are expected to be modifier functions. These modifiers
 * will run in the order they appear, and if all pass, a result with the same type of the input is returned.
 *
 * For example, consider a function call with the following type:
 *
 * ```ts
 * {
 *    function: "divide",
 *    value: {
 *      a: number,
 *      b: number,
 *    }
 * }
 * ```
 *
 * We take two numbers and return `a/b`. We can write a modifier to ensure `b` is non-zero.
 *
 * ```ts
 * const {a, b} = await apply(caller, input.value, state,
 *   (caller, input, state) => {
 *     if (input.b === 0) {
 *       throw new Error("denominator cant be zero");
 *     }
 *     return input;
 *   }
 * );
 * ```
 *
 * Due to the generic template parameters, when `apply` is used within the switch-case of the `handle` function, it gets type-safety
 * based on which function is being handled!
 */
export async function apply<I extends ContractInputGeneric['value'], S extends ContractState>(
  caller: string,
  input: I,
  state: S,
  ...modifiers: ((caller: string, input: I, state: S) => I | Promise<I>)[]
): Promise<typeof input> {
  for (const modifier of modifiers) {
    input = await modifier(caller, input, state);
  }
  return input;
}
