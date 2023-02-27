import {WarpFactory} from 'warp-contracts';
import {Admin} from '../src/sdk';
import {fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs';
import type {JWKInterface} from 'warp-contracts/lib/types/utils/types/arweave-types';
import {HollowDBState} from '../contracts/hollowDB/types';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// initial state for your deployment
const initialState: HollowDBState = {
  creator: '',
  verificationKey: {},
};

async function main() {
  let walletName: string = 'wallet-main';
  if (process.argv.length === 3) {
    walletName = process.argv[2];
  }
  // deploying to mainnet
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  // read wallet
  const walletPath = __dirname + '/../../config/wallet/' + walletName + '.json';
  const wallet = JSON.parse(fs.readFileSync(walletPath).toString()) as JWKInterface;

  // read source code
  const contractSourcePath = __dirname + '/../../build/hollowDB/contract.js';
  const contractSource = fs.readFileSync(contractSourcePath).toString();

  // deploy
  console.log('Deploying contract...');
  const result = await Admin.deploy(wallet, initialState, contractSource, warp);
  console.log(result);
}

main();
