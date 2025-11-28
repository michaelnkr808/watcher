from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, func
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine
from sqlalchemy import ForeignKey
from datetime import datetime

Base = declarative_base()

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=True)
    image_data = Column(LargeBinary, nullable=False)
    created_at = Column(DateTime, default=func.now())

class SearchResult(Base):
    __tablename__ = "search_results"

    id = Column(Integer, primary_key=True)
    photo_id = Column(Integer, ForeignKey("photos.id"))
    name = Column(String)
    platform = Column(String)
    profile_url = Column(String)
    confidence = Column(Integer)

engine = create_engine("postgresql+psycopg2://michaelnkr808:5199@localhost:5432/watcher_photos_db")
Base.metadata.create_all(engine)