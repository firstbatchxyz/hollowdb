import {readFileSync} from 'fs';
import {JWKInterface, Warp, WarpFactory} from 'warp-contracts';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import {prepareState as prepareStateWithWarp} from './deploy';
import {ContractState} from '../contracts/types';

export function getPath(name: string, type: 'state' | 'source' | 'contract'): string {
  if (type === 'contract') {
    return './src/contracts/' + name + '.contract.ts';
  } else if (type === 'source') {
    return './src/contracts/build/' + name + '.contract.js';
  } else {
    return './src/contracts/states/' + name + '.state.ts';
  }
}

export function prepareWarp(target: string): Warp {
  const warp =
    target === 'main'
      ? WarpFactory.forMainnet().use(new DeployPlugin())
      : WarpFactory.forTestnet().use(new DeployPlugin());

  return warp;
}

export function prepareWallet(path: string): JWKInterface {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export async function prepareState(wallet: JWKInterface, name: string, warp: Warp): Promise<ContractState> {
  const initialState: ContractState = JSON.parse(readFileSync(getPath(name, 'state'), 'utf-8'));
  return await prepareStateWithWarp(wallet, initialState, warp);
}

export function prepareCode(name: string): string {
  return JSON.parse(readFileSync(getPath(name, 'source'), 'utf-8'));
}
