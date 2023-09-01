#!/usr/bin/env node
import {existsSync, readFileSync} from 'fs';
import {JWKInterface, WarpFactory} from 'warp-contracts';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {deploy, deployFromSrc, evolve, evolveFromSrc} from '../tools';
import {DeployPlugin} from 'warp-contracts-plugin-deploy';
import {ContractState} from '../contracts/types';

yargs(hideBin(process.argv))
  .scriptName('hollowdb-contracts')
  .option('walletPath', {
    alias: 'w',
    describe: 'Path to Arweave wallet',
  })
  .string('walletPath')
  .demandOption('walletPath')
  .check(yargs => {
    if (!existsSync(yargs.walletPath)) {
      throw new Error('A wallet does not exist at the given path.');
    }
    return true;
  })

  .option('codePath', {
    alias: 'code',
    describe: 'Path to the JS contract code',
  })
  .string('codePath')

  .option('initialStatePath', {
    alias: 'init',
    describe: 'Path to initial state',
  })
  .string('initialStatePath')

  .option('contractTxId', {
    alias: 'ctx',
    describe: 'Contract transaction id',
  })
  .string('contractTxId')

  .option('sourceTxId', {
    alias: 'stx',
    describe: 'Source transaction id',
  })
  .string('sourceTxId')

  .command(
    'evolve',
    'Evolve an existing contract',
    yargs => {
      yargs.demandOption('contractTxId');
      yargs.check(yargs => {
        if (!yargs.sourceCode && !yargs.sourceTxId) {
          throw new Error('Please specify a contract source code path or a source transaction id.');
        } else if (yargs.sourceCode && !existsSync(yargs.codePath)) {
          throw new Error('No source code found at the given path.');
        }
        return true;
      });
    },
    async args => {
      const warp = WarpFactory.forMainnet().use(new DeployPlugin());
      const wallet = JSON.parse(readFileSync(args.walletPath, 'utf-8')) as JWKInterface;

      if (args.codePath) {
        const code = readFileSync(args.codePath, 'utf-8');
        evolve(wallet, warp, args.contractTxId, code);
      } else {
        evolveFromSrc(wallet, warp, args.contractTxId, args.sourceTxId);
      }
    }
  )

  .command(
    'deploy',
    'Deploy a new contract',
    yargs => {
      yargs.demandOption('initialStatePath');
      yargs.check(yargs => {
        if (!existsSync(yargs.initialStatePath)) {
          throw new Error('An initial state does not exist at the given path.');
        }
        return true;
      });
      yargs.check(yargs => {
        if (!yargs.sourceCode && !yargs.sourceTxId) {
          throw new Error('Please specify a contract source code path or a source transaction id.');
        } else if (yargs.sourceCode && !existsSync(yargs.codePath)) {
          throw new Error('No source code found at the given path.');
        }
        return true;
      });
    },
    async args => {
      const warp = WarpFactory.forMainnet().use(new DeployPlugin());
      const wallet = JSON.parse(readFileSync(args.walletPath, 'utf-8')) as JWKInterface;
      const initialState = JSON.parse(readFileSync(args.initialStatePath, 'utf-8')) as ContractState;

      if (args.codePath) {
        const code = readFileSync(args.codePath, 'utf-8');
        deploy(wallet, warp, initialState, code);
      } else {
        deployFromSrc(wallet, warp, initialState, args.sourceTxId);
      }
    }
  )

  // only allow one command to be called
  .demandCommand(1, 1)
  .parse();
