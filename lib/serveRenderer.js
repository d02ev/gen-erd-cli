import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { showErrorMessage, showProcessingMessage, showSuccessMessage } from './utils/util.js';
import { PORT } from './utils/constants.js';
import open from 'open';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const renderedDir = path.join(__dirname, '..', 'renderer');
const metadataPath = path.join(homedir(), '.generdconfig', 'metadata.json');

app.use(express.static(renderedDir));

// Serve index.html as the default route
app.get('/', (_, res) => {
  res.sendFile(path.join(renderedDir, 'index.html'));
});

app.get('/metadata.json', (_, res) => {
  if (!fs.existsSync(metadataPath)) {
    showErrorMessage('Metadata file does not exist.');
    showProcessingMessage('to exit gracefully.');
    process.exit(0);
  }

  const metadata = fs.readFileSync(metadataPath, 'utf-8');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.send(metadata);
});

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  showSuccessMessage(`Renderer available at: ${url}`);

  open(url).catch((error) => {
    showErrorMessage(`Failed to open browser automatically: ${error.message}`);
    showSuccessMessage(`Please manually open: ${url}`);
  });
});