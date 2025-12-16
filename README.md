# gen-erd-cli

A CLI tool that generates beautiful ERD diagrams using database connection configurations.

## Features

- Interactive Terminal User Interface (TUI)
- Web-based ERD visualization with automatic browser opening
- Support for connection string input
- Support for individual database field configuration
- Support for multiple database types:
  - PostgreSQL
  - MySQL
  - SQL Server
  - SQLite
  - Oracle

## Installation

```bash
npm install -g gen-erd-cli
gen-erd-cli init
```

Or use with npx:

```bash
npx gen-erd-cli init
```

## Usage

Run the CLI tool:

```bash
gen-erd-cli init
```

This will open a beautiful interactive interface with ASCII art banners and styled boxes. After connecting to your database, the tool will automatically open a web browser to display the generated ERD diagram.

### 1. Connection String Option

Choose "1. Connection String" to provide a database connection string directly.

**Supported formats:**

- PostgreSQL: `postgresql://username:password@localhost:5432/database_name`
- MySQL: `mysql://username:password@localhost:3306/database_name`
- SQL Server: `mssql://username:password@localhost:1433/database_name`
- SQLite: `sqlite://path/to/database.sqlite`
- Oracle: `oracle://username:password@localhost:1521/service_name`

### 2. Individual Fields Option

Choose "2. Individual Fields" to configure database connection step by step:

1. **Host**: Database host (defaults to localhost)
2. **Port**: Database port (auto-suggests based on database type)
3. **Username**: Database username
4. **Password**: Database password (hidden input)
5. **Database**: Database name

## Dependencies

- `inquirer`: Interactive command line interface
- `chalk`: Terminal string styling
- `commander`: CLI arg parsing
- `express`: Web server for ERD visualization
- `open`: Automatic browser opening
- Database drivers:
  - `pg`: PostgreSQL client
  - `mysql2`: MySQL client
  - `mssql`: SQL Server client
  - `sqlite3`: SQLite client
  - `oracledb`: Oracle client

## How it Works

1. Run `gen-erd-cli init` to start the interactive CLI
2. Choose your preferred connection method (connection string or individual fields)
3. Select your database type from the supported options
4. Provide connection details
5. The tool automatically opens a web browser displaying your ERD diagram
6. The ERD visualization shows tables, fields, relationships, and data types

## Recent Updates

- **v2.0.0**: Added support for MySQL, SQL Server, SQLite, and Oracle
- **v2.0.0**: Introduced web-based ERD visualization with automatic browser opening
- **v2.0.0**: Enhanced interactive CLI with better error handling and user experience

## License

MIT
