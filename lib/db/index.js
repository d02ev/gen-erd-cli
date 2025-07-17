import PostgresProvider from '../provider/pg.provider.js';
import { DB_TYPE_POSTGRES } from '../utils/constants.js';

export function getDbProvider(type, config) {
  switch (type) {
    case DB_TYPE_POSTGRES:
      return new PostgresProvider(config);
    // Future: add more DBs here
    default:
      throw new Error(`Unsupported DB type: ${type}`);
  }
}