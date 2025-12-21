import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from models.face_scan import Base, Photo, Transcript, DetectedFace, FaceEncoding, PersonInfo

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set!")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)

#create tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Photo helper functions ----------------------------------------

def save_photo(filename: str, image_data: bytes):
    with SessionLocal() as session:
        try:
            photo = Photo(filename=filename, image_data=image_data)
            session.add(photo)
            session.commit()
            return photo.id
        except:
            session.rollback()
            raise

def get_photo_by_id(photo_id: int):
    with SessionLocal() as session:
        return session.query(Photo).filter(Photo.id == photo_id).first()

def get_most_recent_photo():
    with SessionLocal() as session:
        return session.query(Photo).order_by(Photo.created_at.desc()).first()
    
# Face helper functions ------------------------------------------

def save_detected_face(photo_id: int, x: int, y:int, width: int, height: int,
                       face_image_data: bytes = None, confidence: float = None):
    """Save a detected face to the database"""
    with SessionLocal() as session:
        try:
            face = DetectedFace(
                photo_id=photo_id,
                x=x, y=y, width=width, height=height,
                face_image_data=face_image_data,
                confidence=confidence
            )
            session.add(face)
            session.commit()
            session.refresh(face)
            return face.id
        except Exception as e:
            session.rollback()
            raise e
        
def save_face_encoding(face_id: int, encoding: list, model_name: str = "Facenet"):
    """Save a face encoding (128-d vector)"""
    with SessionLocal() as session:
        try:
            face_encoding = FaceEncoding(
                face_id=face_id,
                encoding=encoding,
                model_name=model_name   
            )
            session.add(face_encoding)
            session.commit()
            return face_encoding.id
        except Exception as e:
            session.rollback()
            raise e

def find_matching_face(query_encoding: list, threshold: float = 0.6):
    """
    Find a matching face using pgvector similarity search
    Returns the best match if distance < threshold, else None
    """
    with SessionLocal() as session:
        # Use pgvector's <-> operator for L2 distance
        result = session.query(
            FaceEncoding,
            FaceEncoding.encoding.l2_distance(query_encoding).label('distance')
        ).order_by('distance').first()
        
        if result and result.distance < threshold:
            return result[0], result.distance
        return None, None

# Person info helper functions ---------------------------------------

def save_person_info(face_id: int, name: str = None, conversation_context: str = None):
    """Save person information"""
    with SessionLocal() as session:
        try:
            person_info = PersonInfo(
                face_id=face_id,
                name=name,
                conversation_context=conversation_context
            )
            session.add(person_info)
            session.commit()
            return person_info.id
        except Exception as e:
            session.rollback()
            raise e

def get_person_info_by_face_id(face_id:int):
    """Get person info for a face"""
    with SessionLocal() as session:
        return session.query(PersonInfo).filter(PersonInfo.face_id == face_id).first()

def update_person_last_seen(person_info_id: int):
    """Update last seen timestamp and increment times_met"""        
    with SessionLocal() as session:
        try:
            person_info = session.query(PersonInfo).filter(PersonInfo.id == person_info_id).first()
            if person_info:
                person_info.last_seen_at = func.now()
                person_info.times_met += 1
                session.commit()
        except Exception as e:
            session.rollback()
            raise e

# Transcript helper functions ----------------------------------------

def save_transcript(photo_id: int, raw_text: str = None, extracted_name: str = None, context: str = None):
    """Save transcript data"""
    with SessionLocal() as session:
        try:
            transcript = Transcript(
                photo_id=photo_id,
                raw_text=raw_text,
                extracted_name=extracted_name,
                context=context
            )
            session.add(transcript)
            session.commit()
            return transcript.id
        except Exception as e:
            session.rollback()
            raise e