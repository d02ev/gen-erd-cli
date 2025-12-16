export default class MySQLQueryHelper {
  requestFetchAllSchemasQuery = () => {
    return `
      SELECT SCHEMA_NAME as schema_name
      FROM INFORMATION_SCHEMA.SCHEMATA
      WHERE SCHEMA_NAME NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
      ORDER BY SCHEMA_NAME;
    `;
  };

  requestFetchAllTablesQuery = () => {
    return `
      SELECT TABLE_NAME as table_name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_TYPE = 'BASE TABLE';
    `;
  };

  requestFetchColumnsMetadataQuery = () => {
    return `
      SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN (?);
    `;
  };

  requestFetchConstraintsMetadataQuery = () => {
    return `
      SELECT tc.TABLE_NAME as table_name, kcu.COLUMN_NAME as column_name
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_TYPE = ?
      AND tc.TABLE_SCHEMA = ?
      AND tc.TABLE_NAME IN (?);
    `;
  };

  requestFetchFkMetadataQuery = () => {
    return `
      SELECT
        kcu.TABLE_NAME AS source_table,
        kcu.COLUMN_NAME AS source_column,
        kcu.REFERENCED_TABLE_NAME AS target_table,
        kcu.REFERENCED_COLUMN_NAME AS target_column
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
      WHERE kcu.CONSTRAINT_SCHEMA = ?
      AND kcu.TABLE_NAME IN (?)
      AND kcu.REFERENCED_TABLE_NAME IS NOT NULL;
    `;
  };
}