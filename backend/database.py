from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# MySQL connection string format: mysql+pymysql://username:password@host:port/database
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://username:password@localhost:3306/smart_ecobin")

# MySQL specific engine configuration
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,
    # MySQL specific settings
    connect_args={
        "charset": "utf8mb4",
        "use_unicode": True,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
