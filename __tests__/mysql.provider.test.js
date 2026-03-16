import MySQLProvider from '../lib/provider/mysql.provider.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_AZURE_AD,
} from '../lib/utils/constants.js';

describe('MySQLProvider', () => {
  describe('Constructor', () => {
    it('should create config with connection string', () => {
      const provider = new MySQLProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'mysql://user:pass@localhost:3306/database'
      });
      expect(provider.config.uri).toBe('mysql://user:pass@localhost:3306/database');
    });

    it('should create config with credentials', () => {
      const provider = new MySQLProvider({
        connectionType: CONNECTION_TYPE_CREDENTIALS,
        host: 'localhost',
        port: '3306',
        username: 'root',
        password: 'password',
        database: 'testdb'
      });
      expect(provider.config.host).toBe('localhost');
      expect(provider.config.port).toBe(3306);
      expect(provider.config.user).toBe('root');
      expect(provider.config.password).toBe('password');
      expect(provider.config.database).toBe('testdb');
    });

    it('should create config with Azure AD service principal', () => {
      const provider = new MySQLProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        azureAuthType: 'servicePrincipal',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      });
      expect(provider.config.host).toBe('localhost');
      expect(provider.config.database).toBe('testdb');
      expect(provider.config.user).toBe('client-id');
      expect(provider.config.password).toBe('client-secret');
    });

    it('should create config with Azure AD managed identity', () => {
      const provider = new MySQLProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        azureAuthType: 'managedIdentity'
      });
      expect(provider.config.user).toBeUndefined();
      expect(provider.config.password).toBeUndefined();
    });

    it('should create config with Azure AD user password', () => {
      const provider = new MySQLProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        azureAuthType: 'userPassword',
        username: 'user@tenant.onmicrosoft.com',
        password: 'password'
      });
      expect(provider.config.user).toBe('user@tenant.onmicrosoft.com');
      expect(provider.config.password).toBe('password');
    });

    it('should default to credentials if no connection type provided', () => {
      const provider = new MySQLProvider({
        host: 'localhost',
        port: '3306',
        username: 'root',
        password: 'password',
        database: 'testdb'
      });
      expect(provider.connectionType).toBe(CONNECTION_TYPE_CREDENTIALS);
    });
  });
});