import { Command } from "commander";
import { selectInputType, showErrorMessage, showSuccessMessage, getConnectionString, getIndividualFields, showProcessingMessage, getSchemaSelection, getTableSelection, writeMetadataToFile } from "./utils/util.js";
import DbService from "./services/db.service.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

export const program = new Command('gen-erd-cli');

program
  .description('A CLI tool to generate beautiful ERDs from connection strings')
  .version('1.0.0');

program
  .command('init')
  .description('initializes the CLI tool')
  .action(async () => {
    try {
      const inputType = await selectInputType();
      showSuccessMessage('Input type received', inputType === 'connectionString' ? 'Connection String' : 'Individual Fields');

      // display input option based upon the 'inputType'
      let dbConfig = {};
      if (inputType === 'connectionString') {
        const connectionString = await getConnectionString();
        dbConfig = { connectionString };
        showSuccessMessage('Connection string received', connectionString);
      } else {
        const fields = await getIndividualFields();
        dbConfig = { ...fields };
        showSuccessMessage('Individual fields received', JSON.stringify(fields));
      }

      const dbService = new DbService(dbConfig);
      showProcessingMessage('a connection to the database', 'Attempting');

      const dbConnection = await dbService.testDbConnection();
      if (dbConnection) {
        showSuccessMessage('Connected to the database successfully!');
        showProcessingMessage('to fetch available schemas', 'Attempting');

        const availableSchemas = await dbService.fetchSchemas();
        showSuccessMessage('Schemas fetched successfully!', JSON.stringify(availableSchemas));
        const chosenSchema = await getSchemaSelection(availableSchemas);
        showSuccessMessage('Schema selection received', chosenSchema);

        showProcessingMessage('to fetch available tables', 'Attempting');

        const availableTables = await dbService.fetchTables(chosenSchema);
        showSuccessMessage('Tables fetched successfully!', JSON.stringify(availableTables));
        const chosenTables = await getTableSelection(availableTables);
        showSuccessMessage('Table selection received', JSON.stringify(chosenTables));

        showProcessingMessage('metadata for ERD generation', 'Fetching');
        const metadata = await dbService.fetchMetadata(chosenSchema, chosenTables);
        showSuccessMessage('Metadata fetched successfully!');

        writeMetadataToFile(metadata);

        showProcessingMessage('to open the renderer', 'Attempting');

        // Get the correct path to serveRenderer.js
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const serveRendererPath = path.join(__dirname, 'serveRenderer.js');

        // Use spawn to properly capture output and keep the process alive
        const serverProcess = spawn('node', [serveRendererPath], {
          stdio: 'inherit', // This will show the output directly in the current terminal
          detached: false
        });

        // Handle server process events
        serverProcess.on('error', (error) => {
          showErrorMessage(`Failed to start renderer server: ${error.message}`);
          process.exit(1);
        });

        serverProcess.on('exit', (code) => {
          if (code !== 0) {
            showErrorMessage(`Renderer server exited with code ${code}`);
            process.exit(1);
          }
        });

        // Keep the CLI process alive while the server is running
        process.on('SIGINT', () => {
          serverProcess.kill('SIGINT');
          process.exit(0);
        });
      }
    } catch (err) {
      showErrorMessage(err.message)
      process.exit(1);
    }
  })
