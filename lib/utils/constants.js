export const DATATYPE_MAPPING = Object.freeze({
  // PostgreSQL
  integer: 'int',
  'timestamp without time zone': 'timestamp',
  'timestamp with time zone': 'timestamptz',
  'character varying': 'varchar',
  character: 'char',
  boolean: 'bool',
  'double precision': 'double',
  real: 'float',
  numeric: 'decimal',

  // MySQL
  tinyint: 'tinyint',
  smallint: 'smallint',
  mediumint: 'mediumint',
  bigint: 'bigint',
  datetime: 'datetime',

  // SQL Server
  nvarchar: 'nvarchar',
  nchar: 'nchar',
  bit: 'bit',
  money: 'money',

  // Oracle
  number: 'number',
  varchar2: 'varchar2',
  clob: 'clob',
  blob: 'blob',
});

export const PORT = 5000;

// DB Types
export const DB_TYPE_POSTGRES = 'postgres';
export const DB_TYPE_MYSQL = 'mysql';
export const DB_TYPE_MSSQL = 'mssql';
export const DB_TYPE_SQLITE = 'sqlite';
export const DB_TYPE_ORACLE = 'oracle';

// Default ports for each database
export const DEFAULT_PORTS = Object.freeze({
  [DB_TYPE_POSTGRES]: '5432',
  [DB_TYPE_MYSQL]: '3306',
  [DB_TYPE_MSSQL]: '1433',
  [DB_TYPE_SQLITE]: '', // File-based, no port
  [DB_TYPE_ORACLE]: '1521',
});

// Connection string protocols
export const CONNECTION_PROTOCOLS = Object.freeze({
  [DB_TYPE_POSTGRES]: ['postgresql://', 'postgres://'],
  [DB_TYPE_MYSQL]: ['mysql://'],
  [DB_TYPE_MSSQL]: ['mssql://'],
  [DB_TYPE_SQLITE]: ['file:', 'sqlite://'],
  [DB_TYPE_ORACLE]: ['oracle://'],
});

// Error Names
export const ERROR_USER_INPUT = 'UserInputError';
export const ERROR_DATABASE = 'DatabaseError';
export const ERROR_INTERNAL = 'InternalError';

// Exit Codes
export const EXIT_CODE_SUCCESS = 0;
export const EXIT_CODE_GENERAL = 1;
export const EXIT_CODE_USER_INPUT = 2;
export const EXIT_CODE_DATABASE = 3;

// CLI Labels
export const CLI_LABEL_SUCCESS = 'Success:';
export const CLI_LABEL_ERROR = 'Error:';
export const CLI_LABEL_PROCESSING = 'Processing:';
export const CLI_LABEL_CHOOSE_INPUT_TYPE = 'Choose Input Type:';
export const CLI_LABEL_CHOOSE_DB_TYPE = 'Choose Database Type:';
export const CLI_LABEL_CONNECTION_STRING = 'Connection String';
export const CLI_LABEL_INDIVIDUAL_FIELDS = 'Individual Fields';
export const CLI_LABEL_SCHEMA = 'Choose a schema:';
export const CLI_LABEL_TABLE = 'Choose a Table:';
export const CLI_LABEL_METADATA_FILE = 'metadata.json';
export const CLI_LABEL_CONFIG_DIR = '.generdconfig';

// File/Path Constants
import { homedir } from 'os';
import path from 'path';
export const CONFIG_DIR_PATH = path.join(homedir(), CLI_LABEL_CONFIG_DIR);
export const METADATA_FILE_PATH = path.join(CONFIG_DIR_PATH, CLI_LABEL_METADATA_FILE);

// SQL Constraint Types
export const CONSTRAINT_PRIMARY_KEY = 'PRIMARY KEY';
export const CONSTRAINT_UNIQUE = 'UNIQUE';
export const RELATIONSHIP_ONE_TO_ONE = 'OneToOne';
export const RELATIONSHIP_ONE_TO_MANY = 'OneToMany';
export const RELATIONSHIP_MANY_TO_MANY = 'ManyToMany';