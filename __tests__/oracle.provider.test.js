import OracleProvider from '../lib/provider/oracle.provider.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_AZURE_AD,
} from '../lib/utils/constants.js';

describe('OracleProvider', () => {
  describe('Constructor', () => {
    it('should create config with connection string', () => {
      const provider = new OracleProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'oracle://user:pass@localhost:1521/service'
      });
      expect(provider.config.connectionString).toBe('oracle://user:pass@localhost:1521/service');
    });

    it('should create config with credentials', () => {
      const provider = new OracleProvider({
        connectionType: CONNECTION_TYPE_CREDENTIALS,
        host: 'localhost',
        port: '1521',
        username: 'system',
        password: 'password',
        database: 'ORCL'
      });
      expect(provider.config.user).toBe('system');
      expect(provider.config.password).toBe('password');
      expect(provider.config.connectString).toBe('localhost:1521/ORCL');
    });

    it('should create config with Azure AD service principal', () => {
      const provider = new OracleProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '1521',
        database: 'ORCL',
        azureAuthType: 'servicePrincipal',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      });
      expect(provider.config.connectString).toBe('localhost:1521/ORCL');
      expect(provider.config.user).toBe('client-id');
      expect(provider.config.password).toBe('client-secret');
      expect(provider.config.externalAuth).toBe(false);
    });

    it('should create config with Azure AD managed identity', () => {
      const provider = new OracleProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '1521',
        database: 'ORCL',
        azureAuthType: 'managedIdentity',
        clientId: 'client-id'
      });
      expect(provider.config.externalAuth).toBe(true);
      expect(provider.config.clientId).toBe('client-id');
    });

    it('should create config with Azure AD user password', () => {
      const provider = new OracleProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '1521',
        database: 'ORCL',
        azureAuthType: 'userPassword',
        username: 'user@tenant.onmicrosoft.com',
        password: 'password'
      });
      expect(provider.config.user).toBe('user@tenant.onmicrosoft.com');
      expect(provider.config.password).toBe('password');
    });

    it('should default to credentials if no connection type provided', () => {
      const provider = new OracleProvider({
        host: 'localhost',
        port: '1521',
        username: 'system',
        password: 'password',
        database: 'ORCL'
      });
      expect(provider.connectionType).toBe(CONNECTION_TYPE_CREDENTIALS);
    });
  });
});