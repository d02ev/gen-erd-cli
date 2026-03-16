import sql from 'mssql';
import { DatabaseError } from '../utils/error.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_WINDOWS_AUTH,
  CONNECTION_TYPE_AZURE_AD,
} from '../utils/constants.js';

export default class MSSQLProvider {
  constructor(dbConfig) {
    this.connectionType = dbConfig.connectionType || CONNECTION_TYPE_CREDENTIALS;
    this.buildConfig(dbConfig);
    this.pool = null;
  }

  buildConfig(dbConfig) {
    if (this.connectionType === CONNECTION_TYPE_CONNECTION_STRING) {
      this.config = { connectionString: dbConfig.connectionString };
    } else if (this.connectionType === CONNECTION_TYPE_WINDOWS_AUTH) {
      this.config = {
        server: dbConfig.host,
        port: parseInt(dbConfig.port),
        database: dbConfig.database,
        authentication: {
          type: 'ntlm',
          options: {
            domain: dbConfig.domain,
            userName: dbConfig.username,
            password: ''
          }
        },
        options: {
          encrypt: false,
          trustServerCertificate: true
        }
      };
    } else if (this.connectionType === CONNECTION_TYPE_AZURE_AD) {
      this.config = {
        server: dbConfig.host,
        port: parseInt(dbConfig.port),
        database: dbConfig.database,
        authentication: this.buildAzureAdAuth(dbConfig),
        options: {
          encrypt: true,
          trustServerCertificate: false
        }
      };
    } else {
      this.config = {
        server: dbConfig.host,
        port: parseInt(dbConfig.port),
        user: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        options: {
          encrypt: false,
          trustServerCertificate: true
        }
      };
    }
  }

  buildAzureAdAuth(dbConfig) {
    if (dbConfig.azureAuthType === 'servicePrincipal') {
      return {
        type: 'default',
        options: {
          tenantId: dbConfig.tenantId,
          clientId: dbConfig.clientId,
          clientSecret: dbConfig.clientSecret,
          authentication: 'activeDirectoryServicePrincipal'
        }
      };
    } else if (dbConfig.azureAuthType === 'managedIdentity') {
      return {
        type: 'default',
        options: {
          authentication: 'activeDirectoryManagedIdentity',
          clientId: dbConfig.clientId || ''
        }
      };
    } else {
      return {
        type: 'default',
        options: {
          userName: dbConfig.username,
          password: dbConfig.password,
          authentication: 'activeDirectoryPassword'
        }
      };
    }
  }

  async connect() {
    try {
      this.pool = await sql.connect(this.config);
      return this.pool;
    } catch (err) {
      throw new DatabaseError(`Failed to connect to SQL Server: ${err.message}`);
    }
  }

  async query(queryString, params) {
    try {
      const request = this.pool.request();

      if (params && Array.isArray(params)) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }

      const result = await request.query(queryString);
      return { rows: result.recordset };
    } catch (err) {
      throw new DatabaseError(`SQL Server query error: ${err.message}`);
    }
  }

  async close() {
    try {
      if (this.pool) {
        await this.pool.close();
      }
    } catch (err) {
      throw new DatabaseError(`Failed to close SQL Server connection: ${err.message}`);
    }
  }
}