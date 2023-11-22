import {ExpectedProofError, InvalidProofError, NotOwnerError, NotWhitelistedError, NullValueError} from '../errors';
import {verifyProof} from '../utils';
import {ContractState} from '../types';

/** Ensures `caller` to be the contract owner. */
export const onlyOwner = <I, S extends ContractState>(caller: string, input: I, state: S) => {
  if (caller !== state.owner) {
    throw NotOwnerError;
  }
  return input;
};

/**
 * Ensures `input.value` is not `null`.
 *
 * This is required mainly because SortKeyCache can not differentiate between a non-existing
 * key that returns `null` when queried, or a key that stores `null`. This case causes an
 * ambiguity regarding whether a key exists or not.
 */
export const onlyNonNullValue = <I extends {value: unknown}>(_: string, input: I) => {
  if (input.value === null) {
    throw NullValueError;
  }
  return input;
};

/** Just like {@link onlyNonNullValue} but for arrays. */
export const onlyNonNullValues = <I extends {values: unknown[]}>(_: string, input: I) => {
  if (input.values.some(val => val === null)) {
    throw NullValueError;
  }
  return input;
};

/** Returns a modifier that ensures `caller` is whitelisted for `list`. */
export const onlyWhitelisted = <I, S extends ContractState>(list: keyof S['whitelists']) => {
  return (caller: string, input: I, state: S) => {
    // must have whitelisting enabled for this list
    if (!state.isWhitelistRequired[list as string]) {
      return input;
    }

    // must be whitelisted
    if (!state.whitelists[list as string][caller]) {
      throw NotWhitelistedError;
    }
    return input;
  };
};

/** Returns a modifier that ensures input has a proof . */
export const onlyProofVerified = <I extends {key: string; value?: unknown; proof?: object}, S extends ContractState>(
  proofName: keyof S['isProofRequired'],
  prepareInputs: (caller: string, input: I, state: S) => Promise<bigint[]> | bigint[]
) => {
  return async (caller: string, input: I, state: S) => {
    // must have proofs enabled for this circuit
    if (!state.isProofRequired[proofName as string]) {
      return input;
    }

    // must have a proof object
    if (!input.proof) {
      throw ExpectedProofError;
    }

    // verify proof
    const ok = await verifyProof(
      input.proof,
      await prepareInputs(caller, input, state),
      state.verificationKeys[proofName as string]
    );
    if (!ok) {
      throw InvalidProofError;
    }

    return input;
  };
};

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
export async function apply<I, S extends ContractState>(
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
