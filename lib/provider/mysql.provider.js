import mysql from 'mysql2/promise';
import { DatabaseError } from '../utils/error.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_AZURE_AD,
} from '../utils/constants.js';

export default class MySQLProvider {
  constructor(dbConfig) {
    this.connectionType = dbConfig.connectionType || CONNECTION_TYPE_CREDENTIALS;
    this.dbConfig = dbConfig;
    this.buildConfig();
    this.connection = null;
  }

  buildConfig() {
    if (this.connectionType === CONNECTION_TYPE_CONNECTION_STRING) {
      this.config = { uri: this.dbConfig.connectionString };
    } else if (this.connectionType === CONNECTION_TYPE_AZURE_AD) {
      this.config = {
        host: this.dbConfig.host,
        port: parseInt(this.dbConfig.port),
        database: this.dbConfig.database,
        ...this.buildAzureAdAuth()
      };
    } else {
      this.config = {
        host: this.dbConfig.host,
        port: parseInt(this.dbConfig.port),
        user: this.dbConfig.username,
        password: this.dbConfig.password,
        database: this.dbConfig.database
      };
    }
  }

  buildAzureAdAuth() {
    if (this.dbConfig.azureAuthType === 'servicePrincipal') {
      return {
        user: this.dbConfig.clientId,
        password: this.dbConfig.clientSecret,
        authPlugin: 'mysql_clear_password'
      };
    } else if (this.dbConfig.azureAuthType === 'managedIdentity') {
      return {
        authPlugin: 'mysql_clear_password'
      };
    } else {
      return {
        user: this.dbConfig.username,
        password: this.dbConfig.password,
        authPlugin: 'mysql_clear_password'
      };
    }
  }

  async connect() {
    try {
      this.connection = await mysql.createConnection(this.config);
      return this.connection;
    } catch (err) {
      throw new DatabaseError(`Failed to connect to MySQL: ${err.message}`);
    }
  }

  async query(sql, params) {
    try {
      const [rows] = await this.connection.execute(sql, params);
      return { rows };
    } catch (err) {
      throw new DatabaseError(`MySQL query error: ${err.message}`);
    }
  }

  async close() {
    try {
      if (this.connection) {
        await this.connection.end();
      }
    } catch (err) {
      throw new DatabaseError(`Failed to close MySQL connection: ${err.message}`);
    }
  }
}