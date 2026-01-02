# Visage

A face recognition memory assistant for MentraOS. Helps you remember people you've met by recognizing faces and storing context about your interactions.

> *Visage* (n.) — a person's face, with reference to the form or features.

## What It Does

```
Meet someone → Say "Hey, what's your name?" → 📸 Photo captured (background)
                                                       ↓
                                              🎤 Records conversation
                                                       ↓
                           Say "Nice to meet you" OR 20-second timeout
                                                       ↓
                                   🤖 Gemini extracts: name, workplace, context, details
                                                       ↓
                                              🔍 Face detected in photo
                                                       ↓
                                              🧠 Face → 128D vector
                                                       ↓
                                      💾 Stored in database (PostgreSQL + pgvector)
                                                       ↓
                    See them again → 🎯 Face matched → "That's Sarah! You met at the coffee shop."
```

## Features

- **Voice-activated conversation capture** — Say "Hey, what's your name?" to start recording
- **Intelligent conversation parsing** — Gemini extracts names, workplace, and context automatically
- **Non-blocking photo capture** — Camera runs in the background while you talk
- **Farewell detection** — Automatically ends recording when you say "nice to meet you" or "catch you later"
- **Face detection & recognition** — Uses DeepFace with Facenet model
- **Vector similarity search** — pgvector finds matching faces in milliseconds
- **Relationship memory** — Tracks names, conversation context, when you met, how many times
- **Audio feedback** — Confirms when information is saved successfully

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | [Bun](https://bun.sh) |
| Backend | Python / FastAPI |
| Database | PostgreSQL + pgvector |
| Face Detection | DeepFace (Facenet) |
| AI/LLM | Google Gemini 2.5 Flash |
| ORM | SQLAlchemy + Alembic |
| Device SDK | @mentra/sdk |

## Prerequisites

- [Bun](https://bun.sh) v1.3.3+
- Python 3.11+
- PostgreSQL 17+ with pgvector extension
- MentraOS device with camera/audio
- Google Gemini API key (free tier available)

## Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/michaelnkr808/visage/tree/main
cd mentra-facescan

# Frontend/SDK
bun install

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Database Setup

```bash
# Create database
createdb visage_db

# Enable pgvector extension
psql visage_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
cd backend/app
alembic upgrade head
```

### 3. Environment Variables

Create `.env` in project root:
```env
PACKAGE_NAME=visage
MENTRAOS_API_KEY=your-mentraos-api-key
GEMINI_API_KEY=your-gemini-api-key
BACKEND_URL=http://localhost:8000
PORT=3000
```

> Get your Gemini API key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

Create `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg2://your-username@localhost:5432/visage_db
FACE_MATCH_THRESHOLD=0.6
FACE_CONFIDENCE_MIN=0.9
```

## Running the App

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2: Start frontend
bun run index.ts
```

## Database Schema

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Photo     │────▶│  DetectedFace    │────▶│  FaceEncoding  │
│             │     │                  │     │                │
│ - image     │     │ - bounding box   │     │ - 128D vector  │
│ - filename  │     │ - cropped face   │     │ - model name   │
│ - timestamp │     │ - confidence     │     └────────────────┘
└─────────────┘     └──────────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌──────────────────┐
│ Transcript  │     │   PersonInfo     │
│             │     │                  │
│ - raw_text  │     │ - name           │
│ - extracted │     │ - context        │
│   name      │     │ - first_met_at   │
└─────────────┘     │ - last_seen_at   │
                    │ - times_met      │
                    └──────────────────┘
```

## Voice Commands

| Command | Action |
|---------|--------|
| "Hey, what's your name?" | Starts recording conversation + captures photo in background |
| "Nice to meet you" / "Nice meeting you" / "Catch you later" | Ends recording early and processes the conversation |

**Recording automatically stops after 20 seconds if no farewell phrase is detected.**

## How It Works

### 1. Conversation Capture & Extraction
- User says trigger phrase: `"Hey, what's your name?"`
- Photo capture starts in background (non-blocking)
- Transcription buffers **only final transcriptions** (not partial)
- Ends when: farewell phrase detected OR 20-second timeout
- **Gemini 2.5 Flash** extracts structured data:
  ```json
  {
    "name": "John",
    "workplace": "Apple",
    "context": "hackathon",
    "details": "software engineer, working on AI projects"
  }
  ```

### 2. Face Detection & Matching
1. **Detection**: DeepFace finds faces in the photo and extracts bounding boxes
2. **Encoding**: Each face is converted to a 128-dimensional vector using Facenet
3. **Storage**: Vectors are stored in PostgreSQL using pgvector
4. **Matching**: New faces are compared using L2 distance (Euclidean)
5. **Threshold**: Faces with distance < 0.6 are considered a match

```python
# The magic query
FaceEncoding.encoding.l2_distance(query_encoding) < 0.6
```

## Troubleshooting

### "GEMINI_API_KEY is not set" error
- Make sure `.env` file exists in project root (not in `backend/`)
- Get your API key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- Add to `.env`: `GEMINI_API_KEY=your-key-here`

### pgvector not available
```bash
# macOS with Homebrew PostgreSQL
brew install pgvector
brew services restart postgresql@17
```

### Database connection fails
- Check `backend/.env` has correct `DATABASE_URL`
- Ensure PostgreSQL is running: `brew services list`
- Verify database exists: `psql -l | grep visage`

### Face detection not working
- Ensure DeepFace models are downloaded (happens on first run)
- Check image quality — needs clear, front-facing faces

### Photo capture times out on emulator
- This is expected — the MentraOS emulator doesn't have camera access
- Test on a real MentraOS device with a camera
- For emulator testing, conversation recording still works

### Conversation buffer is empty / not capturing speech
- Check MentraOS app has microphone permissions
- Ensure device isn't in mute mode
- Look for `📝 Buffered:` logs in console to confirm transcription is working

## Project Structure

```
visage/
├── src/                              # TypeScript frontend (MentraOS SDK)
│   ├── index.ts                      # Main app logic, conversation capture
│   └── config.ts                     # Environment config loader
├── backend/
│   ├── .env                          # Backend environment variables
│   └── app/
│       ├── main.py                   # FastAPI entry point
│       ├── config.py                 # Backend configuration
│       ├── models/
│       │   └── face_scan.py          # SQLAlchemy models (Photo, DetectedFace, etc.)
│       ├── routes/
│       │   └── scan.py               # API endpoints (workflow1, workflow2)
│       ├── services/
│       │   ├── database.py           # Database helper functions
│       │   └── face_detection.py     # DeepFace integration
│       └── alembic/                  # Database migrations
│           ├── env.py
│           └── versions/
├── .env                              # Frontend environment variables
├── package.json
└── README.md
```

## Current Implementation Status

### ✅ What's Working
- Voice trigger: `"Hey, what's your name?"` starts conversation recording
- Conversation buffering (only final transcriptions)
- Farewell phrase detection (`"nice to meet you"`, `"catch you later"`)
- 20-second timeout for recording
- Gemini AI extraction of name, workplace, context, details
- Non-blocking photo capture
- Face detection and encoding (DeepFace + Facenet)
- Database storage (PostgreSQL + pgvector)
- Audio feedback when information is saved

### 🚧 In Progress / TODO
- **Workflow 2: Face Recognition** — Recognize people you've already met
- Support for multiple faces in one photo (group conversations)
- Better error handling for no face detected
- Persistent conversation history
- Web dashboard to view stored people

## API Endpoints

### `POST /api/workflow1/first-meeting`
Register a new person with photo and conversation context.

**Request** (form-encoded):
```
image_data: base64-encoded image
name: extracted name
conversation_context: workplace, context, details
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully registered John",
  "data": {
    "photo_id": 1,
    "face_id": 1,
    "person_info_id": 1,
    "name": "John"
  }
}
```

### `POST /api/workflow2/recognize` (Not yet integrated in frontend)
Recognize a person from a photo.

**Request** (form-encoded):
```
image_data: base64-encoded image
```

**Response**:
```json
{
  "success": true,
  "recognized": true,
  "distance": 0.42,
  "person": {
    "name": "John",
    "conversation_context": "Works at Apple, met at hackathon",
    "first_met_at": "2025-01-01T12:00:00",
    "last_seen_at": "2025-01-01T12:00:00",
    "times_met": 1
  }
}
```

## License

MIT
