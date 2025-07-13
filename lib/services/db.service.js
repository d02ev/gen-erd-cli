import PgClientFactory from "../factory/pgClient.factory.js";
import { showErrorMessage, simplifyType } from "../utils/util.js";
import QueryHelper from "../helpers/query.helper.js";
import chalk from "chalk";

export default class DbService {
  constructor(dbConfig) {
    this.client = new PgClientFactory(dbConfig).getClient();
    this.queryHelper = new QueryHelper();
  }

  testDbConnection = async () => {
    let connectionSuccessful = false;
    try {
      await this.client.connect();
      connectionSuccessful = true;
      return connectionSuccessful;
    } catch (err) {
      showErrorMessage(`Failed to connect to the database: ${err.message}`);
    }
  };

  fetchSchemas = async () => {
    try {
      // await this.client.connect();
      const query = this.queryHelper.requestFetchAllSchemasQuery();
      const result = await this.client.query(query);
      const schemas = result.rows.map(row => row.schema_name);
      return schemas;
    } catch (err) {
      showErrorMessage(`Failed to retrieve schemas: ${err.message}`);
    }
  };

  fetchTables = async schema => {
    try {
      // await this.client.connect();
      const query = this.queryHelper.requestFetchAllTablesQuery();
      const result = await this.client.query(query, [schema]);
      const tableNames = result.rows.map(row => row.table_name);
      return tableNames;
    } catch (err) {
      showErrorMessage(`Failed to retrieve tables: ${err.message}`);
    }
  }

  fetchColumnsMetadata = async (client, schema, tables) => {
    try {
      const query = this.queryHelper.requestFetchColumnsMetadataQuery();
      const result = await client.query(query, [schema, tables]);
      return result.rows.map(row => ({
        table_name: row.table_name,
        column_name: row.column_name,
        data_type: simplifyType(row.data_type),
      }));
    } catch (err) {
      showErrorMessage(`Failed to retrieve columns metadata: ${err.message}`);
    }
  };

  fetchConstraintsMetadata = async (client, schema, tables, constraintType) => {
    try {
      const query = this.queryHelper.requestFetchConstraintsMetadataQuery();
      const result = await client.query(query, [constraintType, schema, tables]);
      const constraintMap = {};

      result.rows.forEach(row => {
        if (!constraintMap[row.table_name]) {
          constraintMap[row.table_name] = [];
        }
        constraintMap[row.table_name].push(row.column_name);
      });

      return constraintMap;
    } catch (err) {
      showErrorMessage(`Failed to retrieve ${constraintType} constraint metadata: ${err.message}`);
    }
  };

  fetchFkMetadata = async (client, schema, tables) => {
    try {
      const query = this.queryHelper.requestFetchFkMetadataQuery();
      const result = await client.query(query, [schema, tables]);
      return result.rows.map(row => ({
        source_table: row.source_table,
        source_column: row.source_column,
        target_table: row.target_table,
        target_column: row.target_column,
      }));
    } catch (err) {
      showErrorMessage(`Failed to retrieve foreign key metadata: ${err.message}`);
    }
  };

  fetchMetadata = async (schema, tables) => {
    try {
      // await this.client.connect();
      const columns = await this.fetchColumnsMetadata(this.client, schema, tables);
      const pk = await this.fetchConstraintsMetadata(this.client, schema, tables, 'PRIMARY KEY');
      const uniq = await this.fetchConstraintsMetadata(this.client, schema, tables, 'UNIQUE');
      const fks = await this.fetchFkMetadata(this.client, schema, tables);

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
          const relType = isUnique ? 'OneToOne' : 'OneToMany';

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
          tableMetadata.relationship_type = 'ManyToMany';
        }

        metadata.push(tableMetadata);
      });

      return metadata;
    } catch (err) {
      showErrorMessage(`Failed to retrieve metadata: ${err.message}`);
    }
  };
};