#!/usr/bin/env node

import gyp from './gyp';

(async function () {
  const command = process.argv[2];
  const options = process.argv.slice(3);

  try {
    await gyp(command, options);
  } catch (e) {
    console.error(`node-gyp-cache: ${e.message}`);
    process.exit(1);
  }
})();
