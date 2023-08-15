import {ContractState} from '../types';

export * from './core';
export * from './htx';

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
