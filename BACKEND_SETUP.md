# Backend Setup Guide

## Overview

FastAPI backend with PostgreSQL database, featuring:
- JWT-based authentication (access + refresh tokens)
- Email/password signup & login
- Google OAuth integration
- User management
- CORS configured for frontend integration

## Prerequisites

- Docker & Docker Compose installed
- Python 3.11+ (for local development without Docker)
- PostgreSQL (if running locally without Docker)

---

## 🚀 Quick Start with Docker (Recommended)

### 1. Start Everything

```bash
# From project root
docker-compose up --build
```

This will:
- Start PostgreSQL on port 5432
- Start FastAPI backend on port 8000
- Create database tables automatically
- Enable hot reload for development

### 2. Verify It's Running

```bash
# Check health
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","environment":"development"}
```

### 3. Stop Everything

```bash
docker-compose down

# To also remove volumes (database data):
docker-compose down -v
```

---

## 🔧 Local Development (Without Docker)

### 1. Create PostgreSQL Database

```bash
# Using psql or your preferred method:
createdb -U postgres hackeurope_db

# Or manually:
psql -U postgres
CREATE DATABASE hackeurope_db;
CREATE USER hackeurope_user WITH PASSWORD 'hackeurope_password';
GRANT ALL PRIVILEGES ON DATABASE hackeurope_db TO hackeurope_user;
```

### 2. Setup Python Environment

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://hackeurope_user:hackeurope_password@localhost:5432/hackeurope_db
SECRET_KEY=generate-a-secure-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Run the Server

```bash
# From backend directory
python main.py

# Or with uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## 📡 API Endpoints

### Health Check
```bash
GET /
GET /health
```

### Authentication

#### 1. Signup (Email/Password)
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "john_doe",
  "full_name": "John Doe",
  "password": "SecurePass123!"
}

# Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### 2. Login (Email/Password)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response: Same as signup
```

#### 3. Google OAuth Login
```bash
POST /api/auth/google
Content-Type: application/json

{
  "code": "google-id-token-here"
}

# Response: Same token structure
```

#### 4. Get Current User
```bash
GET /api/auth/me
Authorization: Bearer <access_token>

# Response:
{
  "id": 1,
  "email": "user@example.com",
  "username": "john_doe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "profile_picture": null,
  "created_at": "2024-02-21T12:00:00",
  "updated_at": null
}
```

#### 5. Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

# Response: New access + refresh tokens
```

#### 6. Logout
```bash
POST /api/auth/logout
Authorization: Bearer <access_token>

# Response:
{"message": "Successfully logged out"}
```

---

## 🧪 Testing the Auth Flow

### Test Signup
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "full_name": "Test User",
    "password": "TestPass123!"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Test Protected Endpoint
```bash
# Save the access_token from login response
TOKEN="your_access_token_here"

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ Database Management

### Access Database (Docker)
```bash
# Connect to PostgreSQL container
docker exec -it hackeurope_postgres psql -U hackeurope_user -d hackeurope_db

# List tables
\dt

# View users
SELECT * FROM "user";

# Exit
\q
```

### Reset Database
```bash
# Stop containers
docker-compose down -v

# Restart (fresh database)
docker-compose up --build
```

---

## 🔐 Security Notes

1. **Change SECRET_KEY**: Generate a secure key for production:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

2. **Google OAuth Setup**:
   - Create OAuth credentials at [Google Cloud Console](https://console.cloud.google.com/)
   - Add redirect URI: `http://localhost:8000/api/auth/google/callback`
   - Add both CLIENT_ID and CLIENT_SECRET to `.env`

3. **Password Requirements**:
   - Passwords are hashed with bcrypt
   - No minimum requirements enforced (add validation if needed)

4. **CORS Configuration**:
   - Currently allows `localhost:3000` and `localhost:5173`
   - Update `CORS_ORIGINS` in `.env` for production

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/
│   │   └── user.py              # SQLAlchemy User model
│   ├── schemas/
│   │   ├── user.py              # Pydantic schemas
│   │   └── token.py             # Token schemas
│   ├── routes/
│   │   └── auth.py              # Auth endpoints
│   ├── services/
│   │   ├── auth_service.py      # Auth business logic
│   │   └── security.py          # JWT & password utilities
│   ├── config.py                # Settings from .env
│   ├── database.py              # DB connection
│   └── dependencies.py          # FastAPI dependencies
├── main.py                      # FastAPI app entry point
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker image definition
└── .env                         # Environment variables
```

---

## ✅ Auth Implementation Review

### What's Working:
- ✅ User model with proper fields (email, username, google_id, timestamps, etc.)
- ✅ Email/password signup and login
- ✅ Google OAuth integration
- ✅ JWT access and refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Protected endpoints with Bearer auth
- ✅ Database models match Pydantic schemas
- ✅ CORS configuration for frontend
- ✅ Docker setup with Postgres

### Potential Improvements (Optional):
- Add email verification flow
- Implement token blacklisting for logout
- Add rate limiting
- Add password strength validation
- Add user roles/permissions
- Add OAuth with other providers (GitHub, etc.)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or change port in docker-compose.yml
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs hackeurope_postgres
```

### Import Errors
```bash
# Rebuild Docker image
docker-compose build --no-cache backend
```

### Database Schema Issues
```bash
# Drop and recreate tables (CAREFUL: destroys data)
docker-compose down -v
docker-compose up --build
```

---

## 🎯 Next Steps

1. **Test all endpoints** using the curl examples above
2. **Integrate with frontend** using the access tokens
3. **Add more features** (projects, events, etc.)
4. **Set up Alembic** for database migrations (optional but recommended)

---

## Need Help?

- Check logs: `docker-compose logs -f backend`
- API documentation: http://localhost:8000/docs (Swagger UI)
- Alternative docs: http://localhost:8000/redoc
