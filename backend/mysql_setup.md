# MySQL Setup Guide for Smart EcoBin Backend

This guide will help you set up MySQL for the Smart EcoBin Python backend.

## Prerequisites

- MySQL 8.0 or higher
- Python 3.8+
- pip (Python package manager)

## MySQL Installation

### Windows
1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
2. Run the installer and follow the setup wizard
3. Choose "Developer Default" setup type
4. Set a root password during installation
5. Start MySQL service

### macOS (using Homebrew)
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

## Database Setup

1. **Connect to MySQL as root:**
```bash
mysql -u root -p
```

2. **Create the database and user:**
```sql
CREATE DATABASE smart_ecobin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ecobin_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON smart_ecobin.* TO 'ecobin_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Backend Configuration

1. **Update your `.env` file with your MySQL credentials:**
```env
# Database Configuration - MySQL
DATABASE_URL=mysql+pymysql://ecobin_user:your_secure_password@localhost:3306/smart_ecobin
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=smart_ecobin
DATABASE_USER=ecobin_user
DATABASE_PASSWORD=your_secure_password
```

2. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Run database migrations:**
```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

4. **Seed the database with sample data:**
```bash
python seed_data.py
```

## Docker Setup (Alternative)

If you prefer using Docker, you can use the provided `docker-compose.yml`:

```bash
cd backend
docker-compose up -d mysql redis
```

This will start MySQL and Redis containers with the following default credentials:
- **Database:** smart_ecobin
- **Username:** username
- **Password:** password
- **Root Password:** rootpassword

## Testing the Connection

1. **Start the FastAPI server:**
```bash
python start.py
```

2. **Check the health endpoint:**
```bash
curl http://localhost:8000/health
```

You should see a response like:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Common Issues and Solutions

### Connection Refused
- Ensure MySQL service is running: `sudo systemctl status mysql`
- Check if MySQL is listening on port 3306: `netstat -tlnp | grep 3306`

### Authentication Plugin Error
If you get an authentication plugin error, run:
```sql
ALTER USER 'ecobin_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_secure_password';
FLUSH PRIVILEGES;
```

### Character Set Issues
Ensure your database uses UTF8MB4:
```sql
ALTER DATABASE smart_ecobin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Permission Denied
Make sure your user has the correct privileges:
```sql
SHOW GRANTS FOR 'ecobin_user'@'localhost';
```

## Security Recommendations

1. **Use strong passwords** for database users
2. **Limit user privileges** to only what's needed
3. **Enable SSL/TLS** for production deployments
4. **Regular backups** of your database
5. **Keep MySQL updated** to the latest version

## Backup and Restore

### Create Backup
```bash
mysqldump -u ecobin_user -p smart_ecobin > backup.sql
```

### Restore Backup
```bash
mysql -u ecobin_user -p smart_ecobin < backup.sql
```

## Production Considerations

1. **Configure MySQL for production** with appropriate buffer sizes
2. **Set up replication** for high availability
3. **Monitor performance** with tools like MySQL Workbench
4. **Implement connection pooling** (already configured in SQLAlchemy)
5. **Use environment variables** for sensitive configuration

## Next Steps

After setting up MySQL:
1. Update your credentials in the `.env` file
2. Run the backend server: `python start.py`
3. Test all API endpoints
4. Deploy using Docker or your preferred method

For any issues, check the logs in the backend console or MySQL error logs.
