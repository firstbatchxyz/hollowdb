export * from './contract';
export * from './inputs';

/**
 * A type-utility to convert an array of `T`s into a mapped type,
 * that can be used for example as a mapping key type.
 *
 * If the array is empty, defaults to `T`.
 */
export type OpitonalArray<A extends T[], T> = A extends [] ? T : A[number];
