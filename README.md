# gen-erd-cli

A CLI tool that generates beautiful ERD diagrams using database connection configurations.

## Features

- Interactive Terminal User Interface (TUI)
- Support for connection string input
- Support for individual database field configuration
- Support for PostgreSQL (currently)

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

This will open a beautiful interactive interface with ASCII art banners and styled boxes.

### 1. Connection String Option

Choose "1. Connection String" to provide a database connection string directly.

**Supported formats:**

- PostgreSQL: `postgresql://username:password@localhost:5432/database_name`

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
- `pg`: PostgreSQL client

## License

MIT
