import sql from 'mssql';
import { DatabaseError } from '../utils/error.js';

export default class MSSQLProvider {
  constructor(dbConfig) {
    if ('connectionString' in dbConfig) {
      this.config = { connectionString: dbConfig.connectionString };
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
    this.pool = null;
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