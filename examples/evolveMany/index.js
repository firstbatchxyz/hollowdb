import {readFileSync} from 'fs';
import {LoggerFactory, WarpFactory, sleep} from 'warp-contracts';
import {contractTxIds} from './contracts.js';
import chalk from 'chalk';

// new source txId for evolve
const srcTxId = 'your-txid-here';

// your wallet should be the contract owner for evolve to happen
const walletPath = '/path/to/wallet.json';
const owner = JSON.parse(readFileSync(walletPath, 'utf-8'));

// create warp instance
const warp = WarpFactory.forMainnet();

// `none` hides Warp logs, can be a different level if you want
LoggerFactory.INST.logLevel('none');

// each evolve takes around 200-300ms to finish
// if you want to start from a later index, just change the `i` below
// to something like `i = startIdx`
for (let i = 0; i < contractTxIds.length; i++) {
  try {
    const idxStr = chalk.yellow(`[${i.toString().padEnd(5, '')}]`);
    const contractTxId = contractTxIds[i];
    console.log(`${idxStr} ${contractTxId} beginning to evolve.`);
    const msg = chalk.green(`${idxStr} ${contractTxId} evolved`);

    // the main evolve logic
    console.time(msg);
    const contract = warp.contract(contractTxId).connect(owner);
    await contract.evolve(srcTxId);
    console.timeEnd(msg);

    // sleep a bit to avoid rate-limiting
    await sleep(1000);
  } catch {
    // timed-out, try again after a long sleep
    i--;
    await sleep(7000);
  }
}
