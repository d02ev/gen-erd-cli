# gen-erd-cli

A CLI tool that generates beautiful ERD diagrams from your database schema using various authentication methods.

## Features

- Interactive Terminal User Interface (TUI)
- Web-based ERD visualization with automatic browser opening
- Support for multiple database types:
  - PostgreSQL
  - MySQL
  - SQL Server (MSSQL)
  - SQLite
  - Oracle
- Support for multiple authentication methods:
  - Connection String
  - Credentials (Username/Password)
  - Windows Authentication (NTLM) - MSSQL only
  - Azure AD (Entra ID) - MSSQL, PostgreSQL, MySQL, Oracle
  - AWS IAM - PostgreSQL (RDS) only

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

This will open an interactive interface where you can:

1. Select your database type
2. Choose your authentication method
3. Provide connection details
4. Select schema and tables
5. View the ERD in your browser

## Authentication Options

### 1. Connection String

A single string containing all connection details. Quick and simple.

**Supported formats:**

```
# PostgreSQL
postgresql://username:password@localhost:5432/database_name
postgresql://username:password@host:5432/database_name?sslmode=require

# MySQL
mysql://username:password@localhost:3306/database_name

# SQL Server
mssql://username:password@localhost:1433/database_name

# SQLite
sqlite:///path/to/database.db
file:/absolute/path/to/database.db

# Oracle
oracle://username:password@localhost:1521/service_name
```

### 2. Credentials (Username/Password)

Traditional authentication using individual fields:

- **Host**: Database server hostname or IP (default: localhost)
- **Port**: Database port (default varies by DB type)
- **Username**: Database username
- **Password**: Database password (hidden input)
- **Database**: Database name to connect to

### 3. Windows Authentication (NTLM)

**Supported only by SQL Server (MSSQL)**

Use this when connecting to databases in corporate environments using Active Directory credentials.

**When to use:**

- Corporate networks using Windows/Active Directory
- Azure SQL Database with AD authentication
- On-premises SQL Server with Windows authentication

**Fields:**

- **Domain**: Your Active Directory domain (e.g., `CORP`, `MYCOMPANY`)
- **Username**: Your Windows username (without domain)
- **Host**: Database server hostname
- **Port**: Usually 1433
- **Database**: Database name

**Example:**

```
Domain: CORP
Username: johndoe
Host: localhost
Port: 1433
Database: SalesDB
```

This will authenticate as `CORP\johndoe` using NTLM authentication.

### 4. Azure AD (Entra ID)

**Supported by:** SQL Server, PostgreSQL, MySQL, Oracle

Use this for Azure cloud databases where you want to authenticate using Azure Active Directory.

#### A. Service Principal (App Registration)

Best for automated scripts and applications.

**When to use:**

- CI/CD pipelines
- Applications requiring non-user identity
- Service-to-service communication

**Fields:**

- **Host**: Your Azure database server (e.g., `mydb.database.windows.net`)
- **Port**: Usually 1433 (MSSQL) or 5432 (PostgreSQL)
- **Database**: Database name
- **Azure Auth Type**: Service Principal
- **Tenant ID**: Your Azure tenant ID (UUID format)
- **Client ID**: Application (client) ID from App Registration
- **Client Secret**: Secret generated in Azure AD

**Example values:**

```
Host: myserver.database.windows.net
Port: 1433
Database: myappdb
Tenant ID: 12345678-1234-1234-1234-123456789012
Client ID: aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
Client Secret: ********************
```

#### B. Managed Identity

Best for Azure resources (VMs, App Services, Functions) that need database access.

**When to use:**

- Running on Azure VM
- Azure App Service
- Azure Kubernetes Service
- Any Azure resource with managed identity enabled

**Fields:**

- **Host**: Your Azure database server
- **Port**: Database port
- **Database**: Database name
- **Azure Auth Type**: Managed Identity
- **Client ID**: (Optional) User-assigned managed identity client ID

**Note:** System-assigned managed identity doesn't require client ID. User-assigned requires the client ID of the identity.

#### C. Username/Password

Best for testing and development with cloud identities.

**When to use:**

- Development/testing with cloud account
- When you have an Azure AD user without MFA

**Fields:**

- **Host**: Your Azure database server
- **Port**: Database port
- **Database**: Database name
- **Azure Auth Type**: Username/Password
- **Username**: Your Azure AD username (e.g., `user@domain.onmicrosoft.com`)
- **Password**: Your Azure AD password

### 5. AWS IAM Authentication

**Supported only by PostgreSQL (Amazon RDS)**

Use this to connect to AWS RDS PostgreSQL databases using IAM credentials instead of native database credentials.

**When to use:**

- Connecting to Amazon RDS PostgreSQL
- Using AWS IAM for access control
- Wanting to leverage AWS security (MFA, password policies)
- Connecting from EC2, Lambda, ECS with IAM role

#### A. IAM Credentials

Direct AWS access key and secret key authentication.

**Fields:**

- **RDS Endpoint**: Your RDS instance endpoint (e.g., `mydb.xxxx.us-east-1.rds.amazonaws.com`)
- **Port**: Usually 5432
- **Database**: Database name
- **AWS Auth Type**: Credentials
- **Access Key ID**: AWS IAM user access key
- **Secret Access Key**: AWS IAM user secret key
- **Region**: AWS region where RDS is located

**Example values:**

```
RDS Endpoint: mydb.xxxx.us-east-1.rds.amazonaws.com
Port: 5432
Database: myappdb
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: ********************
Region: us-east-1
```

**Prerequisites:**

1. Enable IAM authentication on RDS: `aws rds modify-db-instance --db-instance-identifier mydb --iam-database-authentication enabled`
2. Create IAM policy allowing `rds-db:connect`
3. Add IAM user/role to database user mapping

#### B. AWS Profile

Use credentials from your local AWS config (~/.aws/config).

**Fields:**

- **RDS Endpoint**: Your RDS instance endpoint
- **Port**: Database port
- **Database**: Database name
- **AWS Auth Type**: Profile
- **Profile Name**: Name from ~/.aws/config (default: default)
- **Region**: AWS region

**Example:**

```
Profile Name: development
Region: us-west-2
```

## Database Compatibility Table

| Database | Connection String | Credentials | Windows Auth | Azure AD | AWS IAM |
|----------|------------------|-------------|--------------|----------|---------|
| PostgreSQL | ✓ | ✓ | - | ✓ | ✓ |
| MySQL | ✓ | ✓ | - | ✓ | - |
| SQL Server | ✓ | ✓ | ✓ | ✓ | - |
| SQLite | ✓ | ✓ | - | - | - |
| Oracle | ✓ | ✓ | - | ✓ | - |

## Authentication Flow by Database

### SQL Server (MSSQL)

1. Connection String → Standard connection string parsing
2. Credentials → SQL Server authentication
3. Windows Auth → NTLM/Active Directory authentication
4. Azure AD → Azure Active Directory authentication

### PostgreSQL

1. Connection String → Standard connection string
2. Credentials → Native PostgreSQL authentication
3. Azure AD → Azure AD token-based authentication
4. AWS IAM → AWS RDS IAM authentication

### MySQL

1. Connection String → Standard connection string
2. Credentials → Native MySQL authentication
3. Azure AD → Azure AD authentication via mysql_clear_password plugin

### Oracle

1. Connection String → Oracle connection string
2. Credentials → Oracle authentication
3. Azure AD → Oracle Cloud IAM or external authentication

### SQLite

1. Connection String → File path in URI format
2. Credentials → File path only (no auth)

## Troubleshooting

### Azure AD Issues

**Error: "Tenant not found" or "Invalid tenant ID"**

- Verify your Tenant ID is correct (format: 8-4-4-4-12 UUID)
- Check tenant ID in Azure Portal → Azure AD → Properties

**Error: "Invalid client secret"**

- Verify client secret hasn't expired
- Check secret in Azure Portal → App Registrations → Your App → Certificates & secrets
- Regenerate secret if needed

**Error: "Managed identity not enabled"**

- For system-assigned: Enable in Azure Portal → Your Resource → Identity
- For user-assigned: Assign identity to the resource
- Verify the managed identity has access to the database

**Error: "Authentication failed"**

- Ensure your Azure AD user has access to the database
- Run: `CREATE USER [your-email] FROM EXTERNAL PROVIDER;` in SQL

### AWS IAM Issues

**Error: "Authentication failed"**

- Verify IAM authentication is enabled on RDS:

  ```bash
  aws rds describe-db-instances --db-instance-identifier <name> --query 'DBInstances[0].IAMDatabaseAuthenticationEnabled'
  ```

- Enable if disabled:

  ```bash
  aws rds modify-db-instance --db-instance-identifier <name> --iam-database-authentication-enabled --apply-immediately
  ```

**Error: "Invalid credentials"**

- Verify Access Key ID and Secret Access Key are correct
- Check IAM user has `AmazonRDSFullAccess` policy or custom policy with `rds-db:connect`

**Error: "Region mismatch"**

- Ensure the region in the CLI matches your RDS region
- Check endpoint URL for correct region

**Error: "IAM authentication not supported"**

- Some RDS instance types don't support IAM auth
- Verify your RDS instance is not in an unsupported state

### Windows Authentication Issues

**Error: "Login failed for user 'DOMAIN\\username'"**

- Verify domain and username format is correct
- Try format: `DOMAIN\username` or just `username@domain.com`
- Check Active Directory connectivity

**Error: "Cannot connect to SQL Server"**

- Verify SQL Server allows Windows authentication
- Check Windows Authentication is enabled in SQL Server
- Verify firewall allows SMB/NTLM traffic

**Error: "Trust relationship failed"**

- Computer needs to be on the domain or VPN
- Re-join computer to domain if needed

### General Connection Issues

**Connection timeout**

- Verify host is reachable: `ping <hostname>`
- Check firewall rules
- Verify port is open: `telnet <hostname> <port>`
- Check SQL Server Browser service is running (MSSQL)

**Database not found**

- Verify database name exists on server
- Check you have permission to access the database
- Verify connection string database name matches exactly

**SSL/TLS errors**

- For Azure: Ensure SSL is enabled (usually required)
- For PostgreSQL: Try adding `?sslmode=require`
- For MSSQL Azure: Ensure `encrypt=true` in connection

## Recent Updates

- **v2.1.0**: Added multiple authentication methods:
  - Windows Authentication (NTLM) for SQL Server
  - Azure AD / Entra ID support (Service Principal, Managed Identity, Username/Password)
  - AWS IAM authentication for PostgreSQL RDS
- **v2.0.0**: Added MySQL, SQL Server, SQLite, Oracle databases and web-based ERD visualization
- Enhanced interactive CLI with better error handling

## License

MIT
