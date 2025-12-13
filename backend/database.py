from sqlmodel import SQLModel, create_engine, Session
from models import Project  # Import to ensure tables are registered
import os

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
DATABASE_URL = os.environ.get("DATABASE_URL", sqlite_url)

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
