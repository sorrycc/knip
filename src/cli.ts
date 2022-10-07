#!/usr/bin/env node

import path from 'node:path';
import { parseArgs } from 'node:util';
import { printHelp } from './help';
import { resolveConfig, resolveIncludedFromArgs } from './util/config';
import reporters from './reporters';
import { run } from '.';
import type { ImportedConfiguration, Configuration, IssueType } from './types';

const {
  values: {
    help,
    cwd: cwdArg,
    config,
    only = [],
    exclude = [],
    noProgress = false,
    reporter = 'symbols',
    jsdoc = [],
  },
} = parseArgs({
  options: {
    help: { type: 'boolean' },
    cwd: { type: 'string' },
    config: { type: 'string' },
    only: { type: 'string', multiple: true },
    exclude: { type: 'string', multiple: true },
    noProgress: { type: 'boolean' },
    reporter: { type: 'string' },
    jsdoc: { type: 'string', multiple: true },
  },
});

if (help || !config) {
  printHelp();
  process.exit(0);
}

const cwd = cwdArg ? path.resolve(cwdArg) : process.cwd();

const configuration: ImportedConfiguration = require(path.resolve(config));

const isShowProgress = !noProgress || !process.stdout.isTTY;

const report =
  reporter in reporters ? reporters[reporter as keyof typeof reporters] : require(path.join(cwd, reporter));

const jsDocOptions = {
  isReadPublicTag: jsdoc.includes('public'),
};

const main = async () => {
  const resolvedConfig = resolveConfig(configuration, cwdArg);

  if (!resolvedConfig) {
    printHelp();
    process.exit(1);
  }

  const config: Configuration = Object.assign({}, resolvedConfig, {
    cwd,
    include: resolveIncludedFromArgs(only, exclude),
    isShowProgress,
    jsDocOptions,
  });

  const issues = await run(config);

  report({ issues, cwd, config });
};

main();
