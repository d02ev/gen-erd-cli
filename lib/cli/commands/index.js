import { registerInitCommand } from './init.js';

export function registerCommands(program) {
  registerInitCommand(program);
  // Future: register other commands here
}