import MSSQLProvider from '../lib/provider/mssql.provider.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_WINDOWS_AUTH,
  CONNECTION_TYPE_AZURE_AD,
} from '../lib/utils/constants.js';

describe('MSSQLProvider', () => {
  describe('Constructor', () => {
    it('should create config with connection string', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'mssql://user:pass@localhost:1433/database'
      });
      expect(provider.config.server).toBe('localhost');
      expect(provider.config.port).toBe(1433);
      expect(provider.config.user).toBe('user');
      expect(provider.config.password).toBe('pass');
      expect(provider.config.database).toBe('database');
    });

    it('should create config with credentials', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_CREDENTIALS,
        host: 'localhost',
        port: '1433',
        username: 'sa',
        password: 'password',
        database: 'testdb'
      });
      expect(provider.config.server).toBe('localhost');
      expect(provider.config.port).toBe(1433);
      expect(provider.config.user).toBe('sa');
      expect(provider.config.password).toBe('password');
      expect(provider.config.database).toBe('testdb');
    });

    it('should create config with Windows Authentication', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_WINDOWS_AUTH,
        host: 'localhost',
        port: '1433',
        domain: 'DOMAIN',
        username: 'user',
        database: 'testdb'
      });
      expect(provider.config.server).toBe('localhost');
      expect(provider.config.port).toBe(1433);
      expect(provider.config.authentication.type).toBe('ntlm');
      expect(provider.config.authentication.options.domain).toBe('DOMAIN');
      expect(provider.config.authentication.options.userName).toBe('user');
      expect(provider.config.database).toBe('testdb');
    });

    it('should create config with Azure AD service principal', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '1433',
        database: 'testdb',
        azureAuthType: 'servicePrincipal',
        tenantId: 'tenant-id',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      });
      expect(provider.config.server).toBe('localhost');
      expect(provider.config.database).toBe('testdb');
      expect(provider.config.authentication.type).toBe('default');
      expect(provider.config.authentication.options.tenantId).toBe('tenant-id');
      expect(provider.config.authentication.options.clientId).toBe('client-id');
      expect(provider.config.authentication.options.clientSecret).toBe('client-secret');
      expect(provider.config.authentication.options.authentication).toBe('activeDirectoryServicePrincipal');
    });

    it('should create config with Azure AD managed identity', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '1433',
        database: 'testdb',
        azureAuthType: 'managedIdentity',
        clientId: 'client-id'
      });
      expect(provider.config.authentication.type).toBe('default');
      expect(provider.config.authentication.options.authentication).toBe('activeDirectoryManagedIdentity');
      expect(provider.config.authentication.options.clientId).toBe('client-id');
    });

    it('should create config with Azure AD user password', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '1433',
        database: 'testdb',
        azureAuthType: 'userPassword',
        username: 'user@tenant.onmicrosoft.com',
        password: 'password'
      });
      expect(provider.config.authentication.type).toBe('default');
      expect(provider.config.authentication.options.authentication).toBe('activeDirectoryPassword');
      expect(provider.config.authentication.options.userName).toBe('user@tenant.onmicrosoft.com');
    });

    it('should default to credentials if no connection type provided', () => {
      const provider = new MSSQLProvider({
        host: 'localhost',
        port: '1433',
        username: 'sa',
        password: 'password',
        database: 'testdb'
      });
      expect(provider.connectionType).toBe(CONNECTION_TYPE_CREDENTIALS);
    });

    it('should parse connection string with URL-encoded password', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'mssql://user:p%40ss%40word@localhost:1433/database'
      });
      expect(provider.config.server).toBe('localhost');
      expect(provider.config.user).toBe('user');
      expect(provider.config.password).toBe('p@ss@word');
      expect(provider.config.database).toBe('database');
    });

    it('should parse connection string with query parameters', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'mssql://user:pass@localhost:1433/database?encrypt=true&trustServerCertificate=false'
      });
      expect(provider.config.server).toBe('localhost');
      expect(provider.config.database).toBe('database');
      expect(provider.config.options.encrypt).toBe(true);
      expect(provider.config.options.trustServerCertificate).toBe(false);
    });

    it('should parse connection string with database in query param', () => {
      const provider = new MSSQLProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'mssql://user:pass@localhost:1433?database=testdb'
      });
      expect(provider.config.database).toBe('testdb');
    });
  });
});