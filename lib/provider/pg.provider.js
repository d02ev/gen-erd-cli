import pg from 'pg';
import { DatabaseError } from '../utils/error.js';

export default class PostgresProvider {
  constructor(dbConfig) {
    if ('connectionString' in dbConfig) {
      this.client = new pg.Client({ connectionString: dbConfig.connectionString });
    } else {
      this.client = new pg.Client({ user: dbConfig.username, password: dbConfig.password, host: dbConfig.host, port: dbConfig.port, database: dbConfig.database });
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