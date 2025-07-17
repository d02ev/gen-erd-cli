import { Command } from "commander";
import { registerCommands } from "./cli/commands/index.js";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export const program = new Command('gen-erd-cli');

program
  .description('A CLI tool to generate beautiful ERDs from connection strings')
  .version(pkg.version);

// Register all CLI commands
registerCommands(program);
