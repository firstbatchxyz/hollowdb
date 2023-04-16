import {WarpFactory} from 'warp-contracts';
import {Admin} from '../src/sdk';
import {fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs';
import type {JWKInterface} from 'warp-contracts/lib/types/utils/types/arweave-types';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function evolve() {
  let walletName: string;
  let contractTxId: string;

  if (process.argv.length === 4) {
    walletName = process.argv[2];
    contractTxId = process.argv[3];
  } else {
    throw new Error('Usage: yarn contract:evolve <wallet-name> <contract-tx-id>');
  }

  // read wallet
  const walletPath = __dirname + '/../config/wallet/' + walletName + '.json';
  const wallet = JSON.parse(fs.readFileSync(walletPath).toString()) as JWKInterface;

  // read the new source code
  const contractSourcePath = __dirname + '/../build/hollowDB/contract.js';
  const contractSource = fs.readFileSync(contractSourcePath).toString();

  // create a warp instance
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  // evolve
  console.log('Evolving contract...');
  const result = await Admin.evolve(wallet, contractSource, contractTxId, warp);
  console.log('Evolved.', result);
}

evolve();
