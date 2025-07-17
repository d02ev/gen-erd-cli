export const DATATYPE_MAPPING = Object.freeze({
  integer: 'int',
  'timestamp without time zone': 'timestamp',
  'timestamp with time zone': 'timestamptz',
  'character varying': 'varchar',
  character: 'char',
  boolean: 'bool',
  'double precision': 'double',
  real: 'float',
  numeric: 'decimal',
});

export const PORT = 5000;

// DB Types
export const DB_TYPE_POSTGRES = 'postgres';

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

// Connection String Protocols
export const VALID_CONNECTION_PROTOCOLS = Object.freeze(['postgresql://', 'postgres://']);