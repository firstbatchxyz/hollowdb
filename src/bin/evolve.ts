import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../hollowdb';
import fs from 'fs';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

async function main() {
  if (process.argv.length !== 4) {
    throw new Error('Usage: yarn contract:evolve <wallet-name> <contract-tx-id>');
  }
  const walletName = process.argv[2];
  const contractTxId = process.argv[3];

  const wallet = JSON.parse(fs.readFileSync(`./config/wallets/${walletName}.json`, 'utf-8')) as JWKInterface;
  const contractSource = fs.readFileSync('./build/hollowdb.js', 'utf-8');
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  console.log('Evolving contract...');
  const result = await Admin.evolve(wallet, contractSource, contractTxId, warp);
  console.log('Evolved.', result);
}

main();
