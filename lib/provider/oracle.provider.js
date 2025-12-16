import oracledb from 'oracledb';
import { DatabaseError } from '../utils/error.js';

export default class OracleProvider {
  constructor(dbConfig) {
    if ('connectionString' in dbConfig) {
      this.config = { connectionString: dbConfig.connectionString };
    } else {
      this.config = {
        user: dbConfig.username,
        password: dbConfig.password,
        connectString: `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
      };
    }
    this.connection = null;
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