import {WarpFactory, JWKInterface} from 'warp-contracts';
import {Admin} from '../hollowdb';
import fs from 'fs';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';

async function main() {
  if (process.argv.length !== 5) {
    throw new Error('Usage: yarn contract:evolve <wallet-name> <src-tx-id> <contract-tx-id>');
  }
  const walletName = process.argv[2];
  const srcTxId = process.argv[3];
  const contractTxId = process.argv[4];

  const wallet = JSON.parse(fs.readFileSync(`./config/wallets/${walletName}.json`, 'utf-8')) as JWKInterface;
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  console.log('Evolving contract...');
  const result = await Admin.evolveFromSrc(wallet, srcTxId, contractTxId, warp);
  console.log('Evolved.', result);
}

main();
