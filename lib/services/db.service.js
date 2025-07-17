import { showErrorMessage, simplifyType } from "../utils/util.js";
import QueryHelper from "../helpers/query.helper.js";
import { DatabaseError } from "../utils/error.js";
import {
  CONSTRAINT_PRIMARY_KEY,
  CONSTRAINT_UNIQUE,
  RELATIONSHIP_ONE_TO_ONE,
  RELATIONSHIP_ONE_TO_MANY,
  RELATIONSHIP_MANY_TO_MANY
} from '../utils/constants.js';

export default class DbService {
  constructor(dbProvider) {
    this.provider = dbProvider;
    this.queryHelper = new QueryHelper();
  }

  testDbConnection = async () => {
    await this.provider.connect();
    return true;
  };

  fetchSchemas = async () => {
    const query = this.queryHelper.requestFetchAllSchemasQuery();
    const result = await this.provider.query(query);
    const schemas = result.rows.map(row => row.schema_name);
    return schemas;
  };

  fetchTables = async schema => {
    const query = this.queryHelper.requestFetchAllTablesQuery();
    const result = await this.provider.query(query, [schema]);
    const tableNames = result.rows.map(row => row.table_name);
    return tableNames;
  }

  fetchColumnsMetadata = async (schema, tables) => {
    const query = this.queryHelper.requestFetchColumnsMetadataQuery();
    const result = await this.provider.query(query, [schema, tables]);
    return result.rows.map(row => ({
      table_name: row.table_name,
      column_name: row.column_name,
      data_type: simplifyType(row.data_type),
    }));
  };

  fetchConstraintsMetadata = async (schema, tables, constraintType) => {
    const query = this.queryHelper.requestFetchConstraintsMetadataQuery();
    const result = await this.provider.query(query, [constraintType, schema, tables]);
    const constraintMap = {};
    result.rows.forEach(row => {
      if (!constraintMap[row.table_name]) {
        constraintMap[row.table_name] = [];
      }
      constraintMap[row.table_name].push(row.column_name);
    });
    return constraintMap;
  };

  fetchFkMetadata = async (schema, tables) => {
    const query = this.queryHelper.requestFetchFkMetadataQuery();
    const result = await this.provider.query(query, [schema, tables]);
    return result.rows.map(row => ({
      source_table: row.source_table,
      source_column: row.source_column,
      target_table: row.target_table,
      target_column: row.target_column,
    }));
  };

  fetchMetadata = async (schema, tables) => {
    const columns = await this.fetchColumnsMetadata(schema, tables);
    const pk = await this.fetchConstraintsMetadata(schema, tables, CONSTRAINT_PRIMARY_KEY);
    const uniq = await this.fetchConstraintsMetadata(schema, tables, CONSTRAINT_UNIQUE);
    const fks = await this.fetchFkMetadata(schema, tables);

    const fkMap = {};
    fks.forEach(fk => {
      if (!fkMap[fk.source_table]) {
        fkMap[fk.source_table] = [];
      }
      fkMap[fk.source_table].push(fk);
    });

    const metadata = [];

    tables.forEach(table => {
      const foreignKeys = [];
      const tableFks = fkMap[table] || [];

      tableFks.forEach(fk => {
        const src = fk.source_column;
        const isUnique = (pk[table] || []).includes(src) || (uniq[table] || []).includes(src);
        const relType = isUnique ? RELATIONSHIP_ONE_TO_ONE : RELATIONSHIP_ONE_TO_MANY;

        foreignKeys.push({
          source_column: src,
          target_table: fk.target_table,
          target_column: fk.target_column,
          relationship_type: relType,
        });
      });

      const isJoinTable = (pk[table] || []).length === 2 && tableFks.length === 2;
      const tableMetadata = {
        table_name: table,
        columns: columns.filter(col => col.table_name === table),
        primary_key: pk[table] || [],
        foreign_keys: foreignKeys,
      };

      if (isJoinTable) {
        tableMetadata.relationship_type = RELATIONSHIP_MANY_TO_MANY;
      }

      metadata.push(tableMetadata);
    });

    return metadata;
  };
};