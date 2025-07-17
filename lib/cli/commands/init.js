import { selectInputType, showSuccessMessage, getConnectionString, getIndividualFields, showProcessingMessage, getSchemaSelection, getTableSelection, writeMetadataToFile } from "../../utils/util.js";
import DbService from "../../services/db.service.js";
import PostgresProvider from "../../provider/pg.provider.js";
import { handleCliError, UserInputError } from "../../utils/error.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

async function promptForDbConfig() {
  const inputType = await selectInputType();
  showSuccessMessage('Input type received', inputType === 'connectionString' ? 'Connection String' : 'Individual Fields');
  if (inputType === 'connectionString') {
    const connectionString = await getConnectionString();
    showSuccessMessage('Connection string received', connectionString);
    return { connectionString };
  } else {
    const fields = await getIndividualFields();
    showSuccessMessage('Individual fields received', JSON.stringify(fields));
    return { ...fields };
  }
}

async function connectToDatabase(dbConfig) {
  // For now, only Postgres is supported. In the future, select provider based on user input.
  const dbProvider = new PostgresProvider(dbConfig);
  const dbService = new DbService(dbProvider);
  showProcessingMessage('a connection to the database', 'Attempting');
  const dbConnection = await dbService.testDbConnection();
  if (!dbConnection) {
    throw new UserInputError('Could not connect to the database. Please check your credentials.');
  }
  showSuccessMessage('Connected to the database successfully!');
  return dbService;
}

async function selectSchema(dbService) {
  showProcessingMessage('to fetch available schemas', 'Attempting');
  const availableSchemas = await dbService.fetchSchemas();
  showSuccessMessage('Schemas fetched successfully!', JSON.stringify(availableSchemas));
  const chosenSchema = await getSchemaSelection(availableSchemas);
  showSuccessMessage('Schema selection received', chosenSchema);
  return chosenSchema;
}

async function selectTables(dbService, chosenSchema) {
  showProcessingMessage('to fetch available tables', 'Attempting');
  const availableTables = await dbService.fetchTables(chosenSchema);
  showSuccessMessage('Tables fetched successfully!', JSON.stringify(availableTables));
  const chosenTables = await getTableSelection(availableTables);
  showSuccessMessage('Table selection received', JSON.stringify(chosenTables));
  return chosenTables;
}

async function fetchAndWriteMetadata(dbService, chosenSchema, chosenTables) {
  showProcessingMessage('metadata for ERD generation', 'Fetching');
  const metadata = await dbService.fetchMetadata(chosenSchema, chosenTables);
  showSuccessMessage('Metadata fetched successfully!');
  writeMetadataToFile(metadata);
  return metadata;
}

async function launchRenderer() {
  showProcessingMessage('to open the renderer', 'Attempting');
  // Get the correct path to serveRenderer.js
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const serveRendererPath = path.join(__dirname, '../../serveRenderer.js');
  // Use spawn to properly capture output and keep the process alive
  const serverProcess = spawn('node', [serveRendererPath], {
    stdio: 'inherit',
    detached: false
  });
  // Handle server process events
  serverProcess.on('error', (error) => {
    handleCliError(error);
  });
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      handleCliError(new Error(`Renderer server exited with code ${code}`));
    }
  });
  // Keep the CLI process alive while the server is running
  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}

export function registerInitCommand(program) {
  program
    .command('init')
    .description('initializes the CLI tool')
    .action(async () => {
      try {
        const dbConfig = await promptForDbConfig();
        const dbService = await connectToDatabase(dbConfig);
        const chosenSchema = await selectSchema(dbService);
        const chosenTables = await selectTables(dbService, chosenSchema);
        await fetchAndWriteMetadata(dbService, chosenSchema, chosenTables);
        await launchRenderer();
      } catch (err) {
        handleCliError(err);
      }
    });
}