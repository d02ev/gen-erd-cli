import {
  selectDatabaseType,
  selectInputType,
  showSuccessMessage,
  getConnectionString,
  getIndividualFields,
  showProcessingMessage,
  getSchemaSelection,
  getTableSelection,
  writeMetadataToFile
} from "../../utils/util.js";
import DbService from "../../services/db.service.js";
import { getDbProvider, getQueryHelper } from "../../db/index.js";
import { handleCliError, UserInputError } from "../../utils/error.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

async function promptForDbType() {
  const dbType = await selectDatabaseType();
  showSuccessMessage('Database type selected', dbType.toUpperCase());
  return dbType;
}

async function promptForDbConfig(dbType) {
  const inputType = await selectInputType();
  showSuccessMessage('Input type received', inputType === 'connectionString' ? 'Connection String' : 'Individual Fields');

  if (inputType === 'connectionString') {
    const connectionString = await getConnectionString(dbType);
    showSuccessMessage('Connection string received');
    return { connectionString };
  } else {
    const fields = await getIndividualFields(dbType);
    showSuccessMessage('Individual fields received', JSON.stringify(fields));
    return { ...fields };
  }
}

async function connectToDatabase(dbType, dbConfig) {
  const dbProvider = getDbProvider(dbType, dbConfig);
  const queryHelper = await getQueryHelper(dbType);
  const dbService = new DbService(dbProvider, queryHelper, dbType);

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
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const serveRendererPath = path.join(__dirname, '../../serveRenderer.js');

  const serverProcess = spawn('node', [serveRendererPath], {
    stdio: 'inherit',
    detached: false
  });

  serverProcess.on('error', (error) => {
    handleCliError(error);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      handleCliError(new Error(`Renderer server exited with code ${code}`));
    }
  });

  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}

export function registerInitCommand(program) {
  program
    .command('init')
    .description('initializes the CLI tool and generates ERD')
    .action(async () => {
      try {
        const dbType = await promptForDbType();
        const dbConfig = await promptForDbConfig(dbType);
        const dbService = await connectToDatabase(dbType, dbConfig);
        const chosenSchema = await selectSchema(dbService);
        const chosenTables = await selectTables(dbService, chosenSchema);
        await fetchAndWriteMetadata(dbService, chosenSchema, chosenTables);
        await launchRenderer();
      } catch (err) {
        handleCliError(err);
      }
    });
}