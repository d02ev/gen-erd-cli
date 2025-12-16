import PostgresProvider from '../provider/pg.provider.js';
import MySQLProvider from '../provider/mysql.provider.js';
import MSSQLProvider from '../provider/mssql.provider.js';
import SQLiteProvider from '../provider/sqlite.provider.js';
import OracleProvider from '../provider/oracle.provider.js';

import {
  DB_TYPE_POSTGRES,
  DB_TYPE_MYSQL,
  DB_TYPE_MSSQL,
  DB_TYPE_SQLITE,
  DB_TYPE_ORACLE,
} from '../utils/constants.js';

export function getDbProvider(type, config) {
  switch (type) {
    case DB_TYPE_POSTGRES:
      return new PostgresProvider(config);
    case DB_TYPE_MYSQL:
      return new MySQLProvider(config);
    case DB_TYPE_MSSQL:
      return new MSSQLProvider(config);
    case DB_TYPE_SQLITE:
      return new SQLiteProvider(config);
    case DB_TYPE_ORACLE:
      return new OracleProvider(config);
    default:
      throw new Error(`Unsupported DB type: ${type}`);
  }
}

export function getQueryHelper(type) {
  switch (type) {
    case DB_TYPE_POSTGRES:
      return import('../helpers/pg.query.helper.js').then(m => new m.default());
    case DB_TYPE_MYSQL:
      return import('../helpers/mysql.query.helper.js').then(m => new m.default());
    case DB_TYPE_MSSQL:
      return import('../helpers/mssql.query.helper.js').then(m => new m.default());
    case DB_TYPE_SQLITE:
      return import('../helpers/sqlite.query.helper.js').then(m => new m.default());
    case DB_TYPE_ORACLE:
      return import('../helpers/oracle.query.helper.js').then(m => new m.default());
    default:
      throw new Error(`Unsupported DB type: ${type}`);
  }
}