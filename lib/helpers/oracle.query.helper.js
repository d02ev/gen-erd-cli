export default class OracleQueryHelper {
  requestFetchAllSchemasQuery = () => {
    return `
      SELECT USERNAME as schema_name
      FROM ALL_USERS
      WHERE USERNAME NOT IN ('SYS', 'SYSTEM', 'DBSNMP', 'SYSMAN', 'OUTLN', 'MGMT_VIEW',
                             'DIP', 'ORACLE_OCM', 'XDB', 'WMSYS', 'CTXSYS', 'MDSYS',
                             'ORDSYS', 'ORDDATA', 'SI_INFORMTN_SCHEMA', 'OLAPSYS')
      ORDER BY USERNAME;
    `;
  };

  requestFetchAllTablesQuery = () => {
    return `
      SELECT TABLE_NAME as table_name
      FROM ALL_TABLES
      WHERE OWNER = :1
      ORDER BY TABLE_NAME;
    `;
  };

  requestFetchColumnsMetadataQuery = () => {
    return `
      SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type
      FROM ALL_TAB_COLUMNS
      WHERE OWNER = :1
      AND TABLE_NAME IN (
        SELECT COLUMN_VALUE FROM TABLE(
          SYS.ODCIVARCHAR2LIST(${Array(50).fill(':2').join(',')})
        )
      );
    `;
  };

  requestFetchConstraintsMetadataQuery = () => {
    return `
      SELECT
        ac.TABLE_NAME as table_name,
        acc.COLUMN_NAME as column_name
      FROM ALL_CONSTRAINTS ac
      JOIN ALL_CONS_COLUMNS acc ON ac.CONSTRAINT_NAME = acc.CONSTRAINT_NAME
      WHERE ac.CONSTRAINT_TYPE = :1
      AND ac.OWNER = :2
      AND ac.TABLE_NAME IN (
        SELECT COLUMN_VALUE FROM TABLE(
          SYS.ODCIVARCHAR2LIST(${Array(50).fill(':3').join(',')})
        )
      );
    `;
  };

  requestFetchFkMetadataQuery = () => {
    return `
      SELECT
        ac.TABLE_NAME AS source_table,
        acc.COLUMN_NAME AS source_column,
        ac_pk.TABLE_NAME AS target_table,
        acc_pk.COLUMN_NAME AS target_column
      FROM ALL_CONSTRAINTS ac
      JOIN ALL_CONS_COLUMNS acc ON ac.CONSTRAINT_NAME = acc.CONSTRAINT_NAME
      JOIN ALL_CONSTRAINTS ac_pk ON ac.R_CONSTRAINT_NAME = ac_pk.CONSTRAINT_NAME
      JOIN ALL_CONS_COLUMNS acc_pk ON ac_pk.CONSTRAINT_NAME = acc_pk.CONSTRAINT_NAME
      WHERE ac.CONSTRAINT_TYPE = 'R'
      AND ac.OWNER = :1
      AND ac.TABLE_NAME IN (
        SELECT COLUMN_VALUE FROM TABLE(
          SYS.ODCIVARCHAR2LIST(${Array(50).fill(':2').join(',')})
        )
      );
    `;
  };
}