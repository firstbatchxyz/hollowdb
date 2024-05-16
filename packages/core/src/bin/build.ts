import {build as esbuild} from 'esbuild';
import {readdirSync} from 'fs';
import replace from 'replace-in-file';

const CONTRACTS_DIR = './src/contracts';
const DEST = CONTRACTS_DIR + '/build';

/** Bundle a contract source code to be deployed.
 *
 * If no name is provided, all contracts will be built.
 */
export async function build(name?: string) {
  const contracts = name
    ? [name + '.contract.ts']
    : readdirSync(CONTRACTS_DIR).filter(file => file.endsWith('.contract.ts'));

  esbuild({
    entryPoints: contracts.map(contract => `${CONTRACTS_DIR}/${contract}`),
    outdir: DEST,
    outbase: CONTRACTS_DIR,
    minify: false,
    bundle: true,
    format: 'iife',
  })
    .catch(() => {
      throw new Error('Build failed.');
    })
    .finally(() => {
      const files = contracts.map(source => `${DEST}/${source}`.replace('.ts', '.js'));

      // turn IIFE into normal file
      // NOTE: but should we? this was ignored in the first place
      replace.sync({
        files,
        from: [/\(\(\) => {/g, /}\)\(\);/g],
        to: '',
        countMatches: true,
      });

      // remove use strict, it breaks Warp source code reader
      replace.sync({
        files,
        from: '"use strict";\n',
        to: '',
        countMatches: true,
      });
    });
}
