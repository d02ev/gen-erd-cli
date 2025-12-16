import inquirer from 'inquirer';
import chalk from 'chalk';
import {
  DB_TYPE_POSTGRES,
  DB_TYPE_MYSQL,
  DB_TYPE_MSSQL,
  DB_TYPE_SQLITE,
  DB_TYPE_ORACLE,
  DEFAULT_PORTS,
  CONNECTION_PROTOCOLS,
  CLI_LABEL_CHOOSE_DB_TYPE,
  CLI_LABEL_CHOOSE_INPUT_TYPE,
  CLI_LABEL_CONNECTION_STRING,
  CLI_LABEL_INDIVIDUAL_FIELDS,
  CLI_LABEL_SCHEMA,
  CLI_LABEL_TABLE,
  CONFIG_DIR_PATH,
  METADATA_FILE_PATH,
  DATATYPE_MAPPING,
  CLI_LABEL_SUCCESS,
  CLI_LABEL_ERROR,
  CLI_LABEL_PROCESSING,
} from './constants.js';
import fs from 'fs';
import os from 'os';

export const simplifyType = dataType => {
  if (dataType in DATATYPE_MAPPING) {
    return DATATYPE_MAPPING[dataType];
  }
  return dataType;
};

export const getSchemaSelection = async (schemas) => {
  const schemaChoices = schemas.map(schema => (
    { name: schema, value: schema }
  ));

  const { chosenSchema } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenSchema',
      message: chalk.cyan.bold(CLI_LABEL_SCHEMA),
      choices: schemaChoices
    }
  ]);

  return chosenSchema;
}

export const getTableSelection = async (tables) => {
  const tableChoices = tables.map(table => (
    { name: table, value: table }
  ));

  const { chosenTables } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'chosenTables',
      message: chalk.cyan.bold(CLI_LABEL_TABLE),
      choices: tableChoices,
      validate: (input) => {
        if (input.length === 0) {
          return 'Choose atleast 1 table';
        }
        return true;
      }
    }
  ]);

  return chosenTables;
}

export const selectInputType = async () => {
  const { inputType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'inputType',
      message: chalk.cyan.bold(CLI_LABEL_CHOOSE_INPUT_TYPE),
      choices: [
        { name: chalk.green(`1. ${CLI_LABEL_CONNECTION_STRING}`), value: 'connectionString' },
        { name: chalk.blue(`2. ${CLI_LABEL_INDIVIDUAL_FIELDS}`), value: 'individualFields' }
      ]
    }
  ]);

  return inputType;
};

export const writeMetadataToFile = (metadata) => {
  if (!fs.existsSync(CONFIG_DIR_PATH)) {
    fs.mkdirSync('CONFIG_DIR_PATH');
  }
  const schemaMetadata = JSON.stringify(metadata, null, 2);

  fs.writeFileSync(METADATA_FILE_PATH, schemaMetadata, 'utf-8');
};

// Select database type
export const selectDatabaseType = async () => {
  const { dbType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dbType',
      message: chalk.cyan.bold(CLI_LABEL_CHOOSE_DB_TYPE),
      choices: [
        { name: chalk.green('PostgreSQL'), value: DB_TYPE_POSTGRES },
        { name: chalk.blue('MySQL'), value: DB_TYPE_MYSQL },
        { name: chalk.yellow('SQL Server'), value: DB_TYPE_MSSQL },
        { name: chalk.magenta('SQLite'), value: DB_TYPE_SQLITE },
        { name: chalk.red('Oracle'), value: DB_TYPE_ORACLE },
      ]
    }
  ]);
  return dbType;
};

// Get connection string examples for selected DB
const getConnectionStringExamples = (dbType) => {
  const examples = {
    [DB_TYPE_POSTGRES]: 'postgresql://username:password@localhost:5432/database_name',
    [DB_TYPE_MYSQL]: 'mysql://username:password@localhost:3306/database_name',
    [DB_TYPE_MSSQL]: 'mssql://username:password@localhost:1433/database_name',
    [DB_TYPE_SQLITE]: 'file:/path/to/database.db or sqlite:///path/to/database.db',
    [DB_TYPE_ORACLE]: 'oracle://username:password@localhost:1521/service_name',
  };

  return `
${chalk.yellow.bold('Connection String Examples:')}
${chalk.green(dbType.toUpperCase() + ':')} ${chalk.gray(examples[dbType])}`;
};

// Get connection string with validation
export const getConnectionString = async (dbType) => {
  console.log(getConnectionStringExamples(dbType));

  const { connectionString } = await inquirer.prompt([
    {
      type: 'input',
      name: 'connectionString',
      message: chalk.cyan.bold('🔗 Connection String:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Connection string cannot be empty');
        }
        const protocols = CONNECTION_PROTOCOLS[dbType];
        const hasValidProtocol = protocols.some(protocol => input.startsWith(protocol));
        if (!hasValidProtocol) {
          return chalk.red(`Invalid connection string format. Must start with ${protocols.join(' or ')}`);
        }
        return true;
      }
    }
  ]);

  return connectionString;
};

// Get individual fields with DB-specific prompts
export const getIndividualFields = async (dbType) => {
  const questions = [];

  // SQLite only needs file path
  if (dbType === DB_TYPE_SQLITE) {
    questions.push({
      type: 'input',
      name: 'database',
      message: chalk.cyan.bold('Database File Path:'),
      default: './database.db',
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Database file path cannot be empty');
        }
        return true;
      }
    });
  } else {
    // Other databases need full connection details
    questions.push(
      {
        type: 'input',
        name: 'host',
        message: chalk.cyan.bold('1. Host:'),
        default: 'localhost',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Host cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'port',
        message: chalk.cyan.bold('2. Port:'),
        default: DEFAULT_PORTS[dbType],
        validate: (input) => {
          const port = parseInt(input);
          if (isNaN(port) || port < 1 || port > 65535) {
            return chalk.red('Port must be a valid number between 1 and 65535');
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'username',
        message: chalk.cyan.bold('3. Username:'),
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Username cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'password',
        message: chalk.cyan.bold('4. Password:'),
        mask: '*',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Password cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'database',
        message: chalk.cyan.bold('5. Database:'),
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Database name cannot be empty');
          }
          return true;
        }
      }
    );
  }

  const answers = await inquirer.prompt(questions);
  return answers;
};

export const showSuccessMessage = (message, data = null) => {
  console.log(`${chalk.green.bold(CLI_LABEL_SUCCESS)}\t${message}\t${!data ? '' : chalk.gray(data)}`);
};

export const showProcessingMessage = (message, prefix = CLI_LABEL_PROCESSING.replace(':', '')) => {
  console.log(`${chalk.yellow.bold(`${prefix}:`)}\t${message}`);
};

export const showErrorMessage = (message) => {
  console.log(`${chalk.red.bold(CLI_LABEL_ERROR)}\t${chalk.red(message)}`);
};