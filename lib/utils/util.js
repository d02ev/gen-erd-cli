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
  CLI_LABEL_WINDOWS_AUTH,
  CLI_LABEL_AZURE_AD,
  CLI_LABEL_AWS_IAM,
  CLI_LABEL_SCHEMA,
  CLI_LABEL_TABLE,
  CONFIG_DIR_PATH,
  METADATA_FILE_PATH,
  DATATYPE_MAPPING,
  CLI_LABEL_SUCCESS,
  CLI_LABEL_ERROR,
  CLI_LABEL_PROCESSING,
  CONNECTION_TYPES_BY_DB,
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_WINDOWS_AUTH,
  CONNECTION_TYPE_AZURE_AD,
  CONNECTION_TYPE_AWS_IAM,
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

export const selectConnectionType = async (dbType) => {
  const supportedTypes = CONNECTION_TYPES_BY_DB[dbType] || [];
  
  const choices = supportedTypes.map((type, index) => {
    let label;
    switch (type) {
      case CONNECTION_TYPE_CONNECTION_STRING:
        label = CLI_LABEL_CONNECTION_STRING;
        break;
      case CONNECTION_TYPE_CREDENTIALS:
        label = CLI_LABEL_INDIVIDUAL_FIELDS;
        break;
      case CONNECTION_TYPE_WINDOWS_AUTH:
        label = CLI_LABEL_WINDOWS_AUTH;
        break;
      case CONNECTION_TYPE_AZURE_AD:
        label = CLI_LABEL_AZURE_AD;
        break;
      case CONNECTION_TYPE_AWS_IAM:
        label = CLI_LABEL_AWS_IAM;
        break;
      default:
        label = type;
    }
    return { name: chalk.green(`${index + 1}. ${label}`), value: type };
  });

  const { connectionType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'connectionType',
      message: chalk.cyan.bold(CLI_LABEL_CHOOSE_INPUT_TYPE),
      choices: choices
    }
  ]);

  return connectionType;
};

export const selectInputType = async (dbType) => {
  return selectConnectionType(dbType);
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

export const getWindowsAuthFields = async () => {
  const { domain } = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: chalk.cyan.bold('Domain:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Domain cannot be empty');
        }
        return true;
      }
    }
  ]);

  const { username } = await inquirer.prompt([
    {
      type: 'input',
      name: 'username',
      message: chalk.cyan.bold('Username:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Username cannot be empty');
        }
        return true;
      }
    }
  ]);

  const { database } = await inquirer.prompt([
    {
      type: 'input',
      name: 'database',
      message: chalk.cyan.bold('Database:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Database name cannot be empty');
        }
        return true;
      }
    }
  ]);

  const { host } = await inquirer.prompt([
    {
      type: 'input',
      name: 'host',
      message: chalk.cyan.bold('Host:'),
      default: 'localhost',
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Host cannot be empty');
        }
        return true;
      }
    }
  ]);

  const { port } = await inquirer.prompt([
    {
      type: 'input',
      name: 'port',
      message: chalk.cyan.bold('Port:'),
      default: DEFAULT_PORTS[DB_TYPE_MSSQL],
      validate: (input) => {
        const portNum = parseInt(input);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          return chalk.red('Port must be a valid number between 1 and 65535');
        }
        return true;
      }
    }
  ]);

  return { domain, username, database, host, port };
};

export const getAzureAdFields = async (dbType) => {
  const questions = [
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
      name: 'database',
      message: chalk.cyan.bold('3. Database:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Database name cannot be empty');
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'azureAuthType',
      message: chalk.cyan.bold('4. Azure AD Authentication Type:'),
      choices: [
        { name: 'Service Principal (Client Secret)', value: 'servicePrincipal' },
        { name: 'Managed Identity', value: 'managedIdentity' },
        { name: 'Username/Password', value: 'userPassword' }
      ]
    }
  ];

  const answers = await inquirer.prompt(questions);

  if (answers.azureAuthType === 'servicePrincipal') {
    const tenantQuestions = [
      {
        type: 'input',
        name: 'tenantId',
        message: chalk.cyan.bold('5. Tenant ID:'),
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Tenant ID cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'clientId',
        message: chalk.cyan.bold('6. Client ID:'),
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Client ID cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'clientSecret',
        message: chalk.cyan.bold('7. Client Secret:'),
        mask: '*',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Client Secret cannot be empty');
          }
          return true;
        }
      }
    ];
    const tenantAnswers = await inquirer.prompt(tenantQuestions);
    return { ...answers, ...tenantAnswers };
  } else if (answers.azureAuthType === 'managedIdentity') {
    const { clientId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'clientId',
        message: chalk.cyan.bold('5. Client ID (optional for system-assigned):'),
      }
    ]);
    return { ...answers, clientId };
  } else {
    const userQuestions = [
      {
        type: 'input',
        name: 'username',
        message: chalk.cyan.bold('5. Username:'),
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
        message: chalk.cyan.bold('6. Password:'),
        mask: '*',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Password cannot be empty');
          }
          return true;
        }
      }
    ];
    const userAnswers = await inquirer.prompt(userQuestions);
    return { ...answers, ...userAnswers };
  }
};

export const getAwsIamFields = async () => {
  const questions = [
    {
      type: 'input',
      name: 'host',
      message: chalk.cyan.bold('1. RDS Endpoint:'),
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
      default: DEFAULT_PORTS[DB_TYPE_POSTGRES],
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
      name: 'database',
      message: chalk.cyan.bold('3. Database:'),
      validate: (input) => {
        if (!input.trim()) {
          return chalk.red('Database name cannot be empty');
        }
        return true;
      }
    },
    {
      type: 'list',
      name: 'iamAuthType',
      message: chalk.cyan.bold('4. AWS IAM Authentication Type:'),
      choices: [
        { name: 'Credentials (Access Key ID & Secret Key)', value: 'credentials' },
        { name: 'Profile (from ~/.aws/config)', value: 'profile' }
      ]
    }
  ];

  const answers = await inquirer.prompt(questions);

  if (answers.iamAuthType === 'credentials') {
    const credQuestions = [
      {
        type: 'input',
        name: 'accessKeyId',
        message: chalk.cyan.bold('5. AWS Access Key ID:'),
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Access Key ID cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'secretAccessKey',
        message: chalk.cyan.bold('6. AWS Secret Access Key:'),
        mask: '*',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Secret Access Key cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'region',
        message: chalk.cyan.bold('7. AWS Region:'),
        default: 'us-east-1',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Region cannot be empty');
          }
          return true;
        }
      }
    ];
    const credAnswers = await inquirer.prompt(credQuestions);
    return { ...answers, ...credAnswers };
  } else {
    const profileQuestion = [
      {
        type: 'input',
        name: 'profile',
        message: chalk.cyan.bold('5. AWS Profile Name:'),
        default: 'default',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Profile name cannot be empty');
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'region',
        message: chalk.cyan.bold('6. AWS Region:'),
        default: 'us-east-1',
        validate: (input) => {
          if (!input.trim()) {
            return chalk.red('Region cannot be empty');
          }
          return true;
        }
      }
    ];
    const profileAnswers = await inquirer.prompt(profileQuestion);
    return { ...answers, ...profileAnswers };
  }
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