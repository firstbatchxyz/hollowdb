const {build} = require('esbuild');
const replace = require('replace-in-file');
const {readdirSync} = require('fs');

const outBase = './src/contracts';
const outDir = './build';

// read contracts from the folder
const contracts = readdirSync(outBase).filter(file => file.endsWith('.contract.ts'));

build({
  entryPoints: contracts.map(source => {
    return `${outBase}/${source}`;
  }),
  outdir: outDir,
  outbase: outBase,
  minify: false,
  bundle: true,
  format: 'iife',
})
  .catch(() => {
    console.error('Build failed');
    process.exit(1);
  })
  .finally(() => {
    const files = contracts.map(source => {
      return `${outDir}/${source}`.replace('.ts', '.js');
    });

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
