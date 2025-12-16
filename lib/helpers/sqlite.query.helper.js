export default class SQLiteQueryHelper {
  requestFetchAllSchemasQuery = () => {
    return `SELECT 'main' as schema_name;`;
  };

  requestFetchAllTablesQuery = () => {
    return `
      SELECT name as table_name
      FROM sqlite_master
      WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%';
    `;
  };

  getTableInfo = (tableName) => {
    return `PRAGMA table_info(${tableName});`;
  };

  getForeignKeyList = (tableName) => {
    return `PRAGMA foreign_key_list(${tableName});`;
  };
}