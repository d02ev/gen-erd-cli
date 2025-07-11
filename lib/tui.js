import inquirer from 'inquirer';
import chalk from 'chalk';

// Banner display
const showBanner = () => {
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║                    Generate ERD Diagrams                      ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════╝\n'));
};

// Connection string examples
const getConnectionStringExamples = () => {
  return `
${chalk.yellow('PostgreSQL:')} postgresql://username:password@localhost:5432/database_name
${chalk.yellow('MySQL:')} mysql://username:password@localhost:3306/database_name
${chalk.yellow('SQL Server:')} mssql://username:password@localhost:1433/database_name
`;
};

// Main input type selection
export const selectInputType = async () => {
  showBanner();

  const { inputType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'inputType',
      message: 'Choose Input Type:',
      choices: [
        { name: '1. Connection String', value: 'connectionString' },
        { name: '2. Individual Fields', value: 'individualFields' }
      ]
    }
  ]);

  return inputType;
};

// Connection string input
export const getConnectionString = async () => {
  console.log(chalk.cyan('\n📋 Connection String Examples:'));
  console.log(getConnectionStringExamples());

  const { dbUrl } = await inquirer.prompt([
    {
      type: 'input',
      name: 'dbUrl',
      message: 'dbUrl:',
      validate: (input) => {
        if (!input.trim()) {
          return 'Connection string cannot be empty';
        }
        // Basic validation - check if it starts with a valid protocol
        const validProtocols = ['postgresql://', 'postgres://', 'mysql://', 'mssql://'];
        const hasValidProtocol = validProtocols.some(protocol => input.startsWith(protocol));
        if (!hasValidProtocol) {
          return 'Invalid connection string format. Must start with postgresql://, postgres://, mysql://, or mssql://';
        }
        return true;
      }
    }
  ]);

  return dbUrl;
};

// Individual fields input
export const getIndividualFields = async () => {
  console.log(chalk.cyan('\n📋 Database Configuration:'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'dbType',
      message: '1. db-type:',
      choices: [
        { name: 'PostgreSQL', value: 'postgres' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'SQL Server', value: 'mssql' }
      ]
    },
    {
      type: 'input',
      name: 'host',
      message: '2. host:',
      default: 'localhost',
      validate: (input) => {
        if (!input.trim()) {
          return 'Host cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'port',
      message: '3. port:',
      default: (answers) => {
        switch (answers.dbType) {
          case 'postgres': return '5432';
          case 'mysql': return '3306';
          case 'mssql': return '1433';
          default: return '5432';
        }
      },
      validate: (input) => {
        const port = parseInt(input);
        if (isNaN(port) || port < 1 || port > 65535) {
          return 'Port must be a valid number between 1 and 65535';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'username',
      message: '4. username:',
      validate: (input) => {
        if (!input.trim()) {
          return 'Username cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'password',
      message: '5. password:',
      validate: (input) => {
        if (!input.trim()) {
          return 'Password cannot be empty';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'database',
      message: '6. database:',
      validate: (input) => {
        if (!input.trim()) {
          return 'Database name cannot be empty';
        }
        return true;
      }
    }
  ]);

  return answers;
};

// Main TUI flow
export const runTUI = async () => {
  try {
    const inputType = await selectInputType();

    if (inputType === 'connectionString') {
      const dbUrl = await getConnectionString();
      console.log(chalk.green('\n✅ Connection string received:'), chalk.gray(dbUrl));
      // Placeholder for future logic
      console.log(chalk.yellow('\n🔧 Processing... (placeholder for ERD generation logic)'));
    } else {
      const fields = await getIndividualFields();
      console.log(chalk.green('\n✅ Database configuration received:'));
      console.log(chalk.gray(JSON.stringify(fields, null, 2)));
      // Placeholder for future logic
      console.log(chalk.yellow('\n🔧 Processing... (placeholder for ERD generation logic)'));
    }

    console.log(chalk.blue('\n✨ TUI flow completed successfully!'));

  } catch (error) {
    if (error.isTtyError) {
      console.error(chalk.red('❌ This CLI tool requires an interactive terminal.'));
    } else {
      console.error(chalk.red('❌ An error occurred:'), error.message);
    }
    process.exit(1);
  }
};