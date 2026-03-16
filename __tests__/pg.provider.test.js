import PostgresProvider from '../lib/provider/pg.provider.js';
import {
  CONNECTION_TYPE_CONNECTION_STRING,
  CONNECTION_TYPE_CREDENTIALS,
  CONNECTION_TYPE_AWS_IAM,
  CONNECTION_TYPE_AZURE_AD,
} from '../lib/utils/constants.js';

describe('PostgresProvider', () => {
  describe('Constructor', () => {
    it('should create client with connection string', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_CONNECTION_STRING,
        connectionString: 'postgresql://user:pass@localhost:5432/database'
      });
      expect(provider.client).toBeDefined();
    });

    it('should create client with credentials', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_CREDENTIALS,
        host: 'localhost',
        port: '5432',
        username: 'postgres',
        password: 'password',
        database: 'testdb'
      });
      expect(provider.client).toBeDefined();
      expect(provider.connectionType).toBe(CONNECTION_TYPE_CREDENTIALS);
    });

    it('should create client with AWS IAM credentials', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_AWS_IAM,
        host: 'localhost',
        port: '5432',
        database: 'testdb',
        iamAuthType: 'credentials',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1'
      });
      expect(provider.client).toBeDefined();
      expect(provider.dbConfig.iamAuthType).toBe('credentials');
    });

    it('should create client with AWS IAM profile', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_AWS_IAM,
        host: 'localhost',
        port: '5432',
        database: 'testdb',
        iamAuthType: 'profile',
        profile: 'default',
        region: 'us-east-1'
      });
      expect(provider.client).toBeDefined();
      expect(provider.dbConfig.iamAuthType).toBe('profile');
    });

    it('should create client with Azure AD service principal', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '5432',
        database: 'testdb',
        azureAuthType: 'servicePrincipal',
        clientId: 'client-id',
        clientSecret: 'client-secret'
      });
      expect(provider.client).toBeDefined();
      expect(provider.dbConfig.azureAuthType).toBe('servicePrincipal');
    });

    it('should create client with Azure AD managed identity', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '5432',
        database: 'testdb',
        azureAuthType: 'managedIdentity',
        clientId: 'client-id'
      });
      expect(provider.client).toBeDefined();
      expect(provider.dbConfig.azureAuthType).toBe('managedIdentity');
    });

    it('should create client with Azure AD user password', () => {
      const provider = new PostgresProvider({
        connectionType: CONNECTION_TYPE_AZURE_AD,
        host: 'localhost',
        port: '5432',
        database: 'testdb',
        azureAuthType: 'userPassword',
        username: 'user@tenant.onmicrosoft.com',
        password: 'password'
      });
      expect(provider.client).toBeDefined();
      expect(provider.dbConfig.azureAuthType).toBe('userPassword');
    });

    it('should default to credentials if no connection type provided', () => {
      const provider = new PostgresProvider({
        host: 'localhost',
        port: '5432',
        username: 'postgres',
        password: 'password',
        database: 'testdb'
      });
      expect(provider.connectionType).toBe(CONNECTION_TYPE_CREDENTIALS);
    });
  });
});