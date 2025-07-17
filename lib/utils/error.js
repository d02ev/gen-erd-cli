import chalk from 'chalk';
import {
  ERROR_USER_INPUT,
  ERROR_DATABASE,
  ERROR_INTERNAL,
  EXIT_CODE_USER_INPUT,
  EXIT_CODE_DATABASE,
  EXIT_CODE_GENERAL
} from './constants.js';

// Custom error classes for different error types
export class UserInputError extends Error {
  constructor(message) {
    super(message);
    this.name = ERROR_USER_INPUT;
    this.exitCode = EXIT_CODE_USER_INPUT;
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = ERROR_DATABASE;
    this.exitCode = EXIT_CODE_DATABASE;
  }
}

export class InternalError extends Error {
  constructor(message) {
    super(message);
    this.name = ERROR_INTERNAL;
    this.exitCode = EXIT_CODE_GENERAL;
  }
}

export function handleCliError(err) {
  if (err.exitCode) {
    console.error(
      `${chalk.red.bold(`[${err.name}]`)} ${chalk.red(err.message)}`
    );
    process.exit(err.exitCode);
  } else {
    // Unexpected error
    console.error(
      `${chalk.red.bold(`[${ERROR_INTERNAL}]`)} ${chalk.red('An unexpected error occurred.')}`
    );
    if (process.env.NODE_ENV === 'development') {
      console.error(err);
    }
    process.exit(EXIT_CODE_GENERAL);
  }
}