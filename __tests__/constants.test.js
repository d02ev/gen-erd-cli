import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_WINDOWS_AUTH,
  CONNECTION_TYPE_AZURE_AD,
  CONNECTION_TYPE_AWS_IAM,
  CONNECTION_TYPES_BY_DB,
  DB_TYPE_POSTGRES,
  DB_TYPE_MYSQL,
  DB_TYPE_MSSQL,
  DB_TYPE_SQLITE,
} from '../lib/utils/constants.js';

describe('Constants - Connection Types', () => {
  describe('CONNECTION_TYPES_BY_DB', () => {
    it('should have all connection types for PostgreSQL', () => {
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_POSTGRES]).toContain(CONNECTION_TYPE_CONNECTION_STRING);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_POSTGRES]).toContain(CONNECTION_TYPE_CREDENTIALS);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_POSTGRES]).toContain(CONNECTION_TYPE_AWS_IAM);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_POSTGRES]).toContain(CONNECTION_TYPE_AZURE_AD);
    });

    it('should have all connection types for MySQL', () => {
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MYSQL]).toContain(CONNECTION_TYPE_CONNECTION_STRING);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MYSQL]).toContain(CONNECTION_TYPE_CREDENTIALS);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MYSQL]).toContain(CONNECTION_TYPE_AZURE_AD);
    });

    it('should have all connection types for MSSQL', () => {
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MSSQL]).toContain(CONNECTION_TYPE_CONNECTION_STRING);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MSSQL]).toContain(CONNECTION_TYPE_CREDENTIALS);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MSSQL]).toContain(CONNECTION_TYPE_WINDOWS_AUTH);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_MSSQL]).toContain(CONNECTION_TYPE_AZURE_AD);
    });

    it('should have limited connection types for SQLite', () => {
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_SQLITE]).toContain(CONNECTION_TYPE_CONNECTION_STRING);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_SQLITE]).toContain(CONNECTION_TYPE_CREDENTIALS);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_SQLITE]).not.toContain(CONNECTION_TYPE_WINDOWS_AUTH);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_SQLITE]).not.toContain(CONNECTION_TYPE_AZURE_AD);
      expect(CONNECTION_TYPES_BY_DB[DB_TYPE_SQLITE]).not.toContain(CONNECTION_TYPE_AWS_IAM);
    });
  });

  describe('Connection Type Values', () => {
    it('should have correct connection type values', () => {
      expect(CONNECTION_TYPE_CONNECTION_STRING).toBe('connectionString');
      expect(CONNECTION_TYPE_CREDENTIALS).toBe('credentials');
      expect(CONNECTION_TYPE_WINDOWS_AUTH).toBe('windowsAuth');
      expect(CONNECTION_TYPE_AZURE_AD).toBe('azureAd');
      expect(CONNECTION_TYPE_AWS_IAM).toBe('awsIam');
    });
  });
});