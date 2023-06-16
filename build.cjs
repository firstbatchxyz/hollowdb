const {build} = require('esbuild');
const replace = require('replace-in-file');

const contracts = ['hollowdb.ts'];

build({
  entryPoints: contracts.map(source => {
    return `./contracts/${source}`;
  }),
  outdir: './build',
  outbase: './contracts',
  minify: false,
  bundle: true,
  format: 'iife',
})
  .catch(() => {
    console.log('Build failed');
    process.exit(1);
  })
  .finally(() => {
    const files = contracts.map(source => {
      return `./build/${source}`.replace('.ts', '.js');
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
      from: '"use strict";',
      to: '',
      countMatches: true,
    });
  });
