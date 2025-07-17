import DbService from '../lib/services/db.service.js';
import { jest, it, beforeEach, describe, expect } from '@jest/globals';

describe('DbService', () => {
  let provider;
  let dbService;
  beforeEach(() => {
    provider = {
      connect: jest.fn().mockResolvedValue(true),
      query: jest.fn()
    };
    dbService = new DbService(provider);
  });
  it('testDbConnection calls provider.connect', async () => {
    await dbService.testDbConnection();
    expect(provider.connect).toHaveBeenCalled();
  });
  it('fetchSchemas returns schema names', async () => {
    provider.query.mockResolvedValue({ rows: [{ schema_name: 'public' }, { schema_name: 'test' }] });
    const schemas = await dbService.fetchSchemas();
    expect(schemas).toEqual(['public', 'test']);
  });
  it('fetchTables returns table names', async () => {
    provider.query.mockResolvedValue({ rows: [{ table_name: 'users' }, { table_name: 'orders' }] });
    const tables = await dbService.fetchTables('public');
    expect(tables).toEqual(['users', 'orders']);
  });
  it('fetchColumnsMetadata returns column metadata', async () => {
    provider.query.mockResolvedValue({ rows: [{ table_name: 'users', column_name: 'id', data_type: 'integer' }] });
    const cols = await dbService.fetchColumnsMetadata('public', ['users']);
    expect(cols).toEqual([{ table_name: 'users', column_name: 'id', data_type: 'int' }]);
  });
  it('fetchConstraintsMetadata returns constraint map', async () => {
    provider.query.mockResolvedValue({ rows: [{ table_name: 'users', column_name: 'id' }] });
    const map = await dbService.fetchConstraintsMetadata('public', ['users'], 'PRIMARY KEY');
    expect(map).toEqual({ users: ['id'] });
  });
  it('fetchFkMetadata returns FK metadata', async () => {
    provider.query.mockResolvedValue({ rows: [{ source_table: 'orders', source_column: 'user_id', target_table: 'users', target_column: 'id' }] });
    const fks = await dbService.fetchFkMetadata('public', ['orders']);
    expect(fks).toEqual([{ source_table: 'orders', source_column: 'user_id', target_table: 'users', target_column: 'id' }]);
  });
  it('fetchMetadata returns correct structure', async () => {
    dbService.fetchColumnsMetadata = jest.fn().mockResolvedValue([
      { table_name: 'users', column_name: 'id', data_type: 'int' },
      { table_name: 'orders', column_name: 'user_id', data_type: 'int' }
    ]);
    dbService.fetchConstraintsMetadata = jest.fn()
      .mockImplementation((_, __, type) => type === 'PRIMARY KEY' ? { users: ['id'] } : {});
    dbService.fetchFkMetadata = jest.fn().mockResolvedValue([
      { source_table: 'orders', source_column: 'user_id', target_table: 'users', target_column: 'id' }
    ]);
    const meta = await dbService.fetchMetadata('public', ['users', 'orders']);
    expect(meta).toEqual([
      {
        table_name: 'users',
        columns: [{ table_name: 'users', column_name: 'id', data_type: 'int' }],
        primary_key: ['id'],
        foreign_keys: []
      },
      {
        table_name: 'orders',
        columns: [{ table_name: 'orders', column_name: 'user_id', data_type: 'int' }],
        primary_key: [],
        foreign_keys: [
          {
            source_column: 'user_id',
            target_table: 'users',
            target_column: 'id',
            relationship_type: 'OneToMany'
          }
        ]
      }
    ]);
  });
});