import fs from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { DATATYPE_MAPPING } from "./constants.js";
import { homedir } from 'os';
import path from 'path';

export const simplifyType = dataType => {
  if (dataType in DATATYPE_MAPPING) {
    return DATATYPE_MAPPING[dataType];
  }
  return dataType;
};

const getConnectionStringExamples = () => {
  const examples = `
${chalk.yellow.bold('Connection String Examples:')}
${chalk.green('PostgreSQL:')} ${chalk.gray('postgresql://username:password@localhost:5432/database_name')}`;

  return examples;
};

export const showSuccessMessage = (message, data = null) => {
  console.log(`${chalk.green.bold('Success:')}\t${message}\t${!data ? '' : chalk.gray(data)}`);
};

export const showProcessingMessage = (message, prefix = 'Processing') => {
  console.log(`${chalk.yellow.bold(`${prefix}:`)}\t${message}`);
};

export const showErrorMessage = (message) => {
 console.log(`${chalk.red.bold('Error:')}\t${chalk.red(message)}`);
};

export const selectInputType = async () => {
  const { inputType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'inputType',
      message: chalk.cyan.bold('Choose Input Type:'),
      choices: [
        { name: chalk.green('1. Connection String'), value: 'connectionString' },
        { name: chalk.blue('2. Individual Fields'), value: 'individualFields' }
      ]
    }
  ]);

  return inputType;
};

export const getConnectionString = async () => {
  console.log(getConnectionStringExamples());

  const { connectionString } = await inquirer.prompt([
    {
      type: 'input',
      name: 'connectionString',
      message: chalk.cyan.bold('🔗 Connection String:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Connection string cannot be empty');
        }
        const validProtocols = ['postgresql://', 'postgres://'];
        const hasValidProtocol = validProtocols.some(protocol => input.startsWith(protocol));
        if (!hasValidProtocol) {
          return chalk.red('Invalid connection string format. Must start with postgresql://, postgres://');
        }
        return true;
      }
    }
  ]);

  return connectionString;
};

export const getIndividualFields = async () => {
  const answers = await inquirer.prompt([
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
      default: '5432',
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
      type: 'input',
      name: 'password',
      message: chalk.cyan.bold('4. Password:'),
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
  ]);

  return answers;
};

export const getSchemaSelection = async (schemas) => {

  const schemaChoices = schemas.map(schema => (
    { name: schema, value: schema }
  ));

  const { chosenSchema } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chosenSchema',
      message: chalk.cyan.bold('Choose a schema:'),
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
      message: chalk.cyan.bold('Choose a Table:'),
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

export const writeMetadataToFile = (metadata) => {
  const fileDirPath = homedir() + '/.generdconfig';
  if (!fs.existsSync(fileDirPath)) {
    fs.mkdirSync(fileDirPath);
  }

  fs.writeFileSync(path.join(homedir(), '/.generdconfig/metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
};
