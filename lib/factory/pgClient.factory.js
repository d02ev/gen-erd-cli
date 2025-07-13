import pg from 'pg';

export default class PgClientFactory {
  client = null;

  constructor(dbConfig) {
    if ('connectionString' in dbConfig) {
      this.client = new pg.Client({ connectionString: dbConfig.connectionString });
    } else {
      this.client = new pg.Client({ user: dbConfig.username, password: dbConfig.password, host: dbConfig.host, port: dbConfig.port, database: dbConfig.database });
    }
  }

  getClient = () => {
    return this.client;
  }
};