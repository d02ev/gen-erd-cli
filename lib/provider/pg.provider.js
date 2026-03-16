import pg from 'pg';
import { DatabaseError } from '../utils/error.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_AWS_IAM,
  CONNECTION_TYPE_AZURE_AD,
} from '../utils/constants.js';

export default class PostgresProvider {
  constructor(dbConfig) {
    this.connectionType = dbConfig.connectionType || CONNECTION_TYPE_CREDENTIALS;
    this.dbConfig = dbConfig;
    this.buildClient();
  }

  buildClient() {
    if (this.connectionType === CONNECTION_TYPE_CONNECTION_STRING) {
      this.client = new pg.Client({ connectionString: this.dbConfig.connectionString });
    } else if (this.connectionType === CONNECTION_TYPE_AWS_IAM) {
      this.client = new pg.Client({
        host: this.dbConfig.host,
        port: parseInt(this.dbConfig.port),
        database: this.dbConfig.database,
        ssl: true,
        awsCreds: this.buildAwsIamConfig()
      });
    } else if (this.connectionType === CONNECTION_TYPE_AZURE_AD) {
      this.client = new pg.Client({
        host: this.dbConfig.host,
        port: parseInt(this.dbConfig.port),
        database: this.dbConfig.database,
        ssl: true,
        ...this.buildAzureAdConfig()
      });
    } else {
      this.client = new pg.Client({
        user: this.dbConfig.username,
        password: this.dbConfig.password,
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        database: this.dbConfig.database
      });
    }
  }

  buildAwsIamConfig() {
    if (this.dbConfig.iamAuthType === 'credentials') {
      return {
        accessKeyId: this.dbConfig.accessKeyId,
        secretAccessKey: this.dbConfig.secretAccessKey,
        region: this.dbConfig.region
      };
    } else {
      return {
        profile: this.dbConfig.profile,
        region: this.dbConfig.region
      };
    }
  }

  buildAzureAdConfig() {
    if (this.dbConfig.azureAuthType === 'servicePrincipal') {
      return {
        password: this.dbConfig.clientSecret,
        user: this.dbConfig.clientId
      };
    } else if (this.dbConfig.azureAuthType === 'managedIdentity') {
      return {
        managedIdentity: true,
        clientId: this.dbConfig.clientId
      };
    } else {
      return {
        user: this.dbConfig.username,
        password: this.dbConfig.password
      };
    }
  }

  async connect() {
    try {
      return await this.client.connect();
    } catch (err) {
      throw new DatabaseError(`Failed to connect to Postgres: ${err.message}`);
    }
  }

  async query(sql, params) {
    try {
      return await this.client.query(sql, params);
    } catch (err) {
      throw new DatabaseError(`Postgres query error: ${err.message}`);
    }
  }

  async close() {
    try {
      return await this.client.end();
    } catch (err) {
      throw new DatabaseError(`Failed to close Postgres connection: ${err.message}`);
    }
  }
}