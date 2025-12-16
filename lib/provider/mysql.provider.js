import mysql from 'mysql2/promise';
import { DatabaseError } from '../utils/error.js';

export default class MySQLProvider {
  constructor(dbConfig) {
    if ('connectionString' in dbConfig) {
      this.config = { uri: dbConfig.connectionString };
    } else {
      this.config = {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database
      };
    }
    this.connection = null;
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