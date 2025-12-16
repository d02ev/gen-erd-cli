import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { DatabaseError } from '../utils/error.js';

export default class SQLiteProvider {
  constructor(dbConfig) {
    // SQLite uses file path or :memory:
    this.dbPath = dbConfig.database || dbConfig.connectionString || ':memory:';
    this.db = null;
  }

  async connect() {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      return this.db;
    } catch (err) {
      throw new DatabaseError(`Failed to connect to SQLite: ${err.message}`);
    }
  }

  async query(sql, params = []) {
    try {
      const rows = await this.db.all(sql, params);
      return { rows };
    } catch (err) {
      throw new DatabaseError(`SQLite query error: ${err.message}`);
    }
  }

  async close() {
    try {
      if (this.db) {
        await this.db.close();
      }
    } catch (err) {
      throw new DatabaseError(`Failed to close SQLite connection: ${err.message}`);
    }
  }
}