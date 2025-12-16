export default class MSSQLQueryHelper {
  requestFetchAllSchemasQuery = () => {
    return `
      SELECT SCHEMA_NAME as schema_name
      FROM INFORMATION_SCHEMA.SCHEMATA
      WHERE SCHEMA_NAME NOT IN ('INFORMATION_SCHEMA', 'sys', 'db_accessadmin', 'db_backupoperator',
                                  'db_datareader', 'db_datawriter', 'db_ddladmin', 'db_denydatareader',
                                  'db_denydatawriter', 'db_owner', 'db_securityadmin', 'guest')
      ORDER BY SCHEMA_NAME;
    `;
  };

  requestFetchAllTablesQuery = () => {
    return `
      SELECT TABLE_NAME as table_name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = @param0
      AND TABLE_TYPE = 'BASE TABLE';
    `;
  };

  requestFetchColumnsMetadataQuery = () => {
    return `
      SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = @param0
      AND TABLE_NAME IN (SELECT value FROM STRING_SPLIT(@param1, ','));
    `;
  };

  requestFetchConstraintsMetadataQuery = () => {
    return `
      SELECT tc.TABLE_NAME as table_name, kcu.COLUMN_NAME as column_name
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
      JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.CONSTRAINT_TYPE = @param0
      AND tc.TABLE_SCHEMA = @param1
      AND tc.TABLE_NAME IN (SELECT value FROM STRING_SPLIT(@param2, ','));
    `;
  };

  requestFetchFkMetadataQuery = () => {
    return `
      SELECT
        OBJECT_NAME(fk.parent_object_id) AS source_table,
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS source_column,
        OBJECT_NAME(fk.referenced_object_id) AS target_table,
        COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS target_column
      FROM sys.foreign_keys AS fk
      INNER JOIN sys.foreign_key_columns AS fkc
      ON fk.object_id = fkc.constraint_object_id
      WHERE OBJECT_SCHEMA_NAME(fk.parent_object_id) = @param0
      AND OBJECT_NAME(fk.parent_object_id) IN (SELECT value FROM STRING_SPLIT(@param1, ','));
    `;
  };
}