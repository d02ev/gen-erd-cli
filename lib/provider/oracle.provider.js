import oracledb from 'oracledb';
import { DatabaseError } from '../utils/error.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_AZURE_AD,
} from '../utils/constants.js';

export default class OracleProvider {
  constructor(dbConfig) {
    this.connectionType = dbConfig.connectionType || CONNECTION_TYPE_CREDENTIALS;
    this.dbConfig = dbConfig;
    this.buildConfig();
    this.connection = null;
  }

  buildConfig() {
    if (this.connectionType === CONNECTION_TYPE_CONNECTION_STRING) {
      this.config = { connectionString: this.dbConfig.connectionString };
    } else if (this.connectionType === CONNECTION_TYPE_AZURE_AD) {
      this.config = {
        connectString: `${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`,
        ...this.buildAzureAdAuth()
      };
    } else {
      this.config = {
        user: this.dbConfig.username,
        password: this.dbConfig.password,
        connectString: `${this.dbConfig.host}:${this.dbConfig.port}/${this.dbConfig.database}`
      };
    }
  }

  buildAzureAdAuth() {
    if (this.dbConfig.azureAuthType === 'servicePrincipal') {
      return {
        user: this.dbConfig.clientId,
        password: this.dbConfig.clientSecret,
        externalAuth: false
      };
    } else if (this.dbConfig.azureAuthType === 'managedIdentity') {
      return {
        externalAuth: true,
        clientId: this.dbConfig.clientId || ''
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
      this.connection = await oracledb.getConnection(this.config);
      return this.connection;
    } catch (err) {
      throw new DatabaseError(`Failed to connect to Oracle: ${err.message}`);
    }
  }

  async query(sql, params = []) {
    try {
      const result = await this.connection.execute(sql, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT
      });
      return { rows: result.rows };
    } catch (err) {
      throw new DatabaseError(`Oracle query error: ${err.message}`);
    }
  }

  async close() {
    try {
      if (this.connection) {
        await this.connection.close();
      }
    } catch (err) {
      throw new DatabaseError(`Failed to close Oracle connection: ${err.message}`);
    }
  }
}