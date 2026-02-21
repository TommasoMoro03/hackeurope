# FastAPI Backend

A production-ready FastAPI backend with authentication (email/password and Google OAuth), following best practices and clean architecture.

## Features

- User authentication with email/password
- Google OAuth integration
- JWT-based authentication (access + refresh tokens)
- PostgreSQL database with SQLAlchemy ORM
- Clean architecture (routes, services, models, schemas separation)
- Docker support for easy deployment
- CORS configuration
- Environment-based configuration

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API endpoints
│   │   └── auth.py      # Authentication routes
│   ├── services/        # Business logic
│   │   ├── auth_service.py
│   │   └── security.py
│   ├── models/          # Database models
│   │   └── user.py
│   ├── schemas/         # Pydantic schemas
│   │   ├── user.py
│   │   └── token.py
│   ├── config.py        # Configuration settings
│   ├── database.py      # Database connection
│   └── dependencies.py  # FastAPI dependencies
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
├── Dockerfile           # Docker configuration
├── .env                 # Environment variables (local)
├── .env.example         # Environment variables template
└── .gitignore
```

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL database
- Google OAuth credentials (for Google login)

### Local Development

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration:
     - Set `DATABASE_URL` to your PostgreSQL connection string
     - Generate a secure `SECRET_KEY`
     - Add your Google OAuth credentials

5. Run the application:
   ```bash
   python main.py
   ```
   Or with uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

6. Access the API:
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

### Docker Deployment

1. Build the Docker image:
   ```bash
   docker build -t fastapi-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env fastapi-backend
   ```

### Push to GitHub Container Registry (GHCR)

1. Login to GHCR:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

2. Tag the image:
   ```bash
   docker tag fastapi-backend ghcr.io/USERNAME/REPO/fastapi-backend:latest
   ```

3. Push to GHCR:
   ```bash
   docker push ghcr.io/USERNAME/REPO/fastapi-backend:latest
   ```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login/signup with Google
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user info (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Health Check

- `GET /` - Root endpoint
- `GET /health` - Health check

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Secret key for JWT encoding
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)

## Security

- Passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Access tokens expire in 30 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- CORS protection
- Environment-based secrets

## Development

To add new routes:
1. Create route file in `src/routes/`
2. Create service logic in `src/services/`
3. Define schemas in `src/schemas/`
4. Add models in `src/models/` if needed
5. Register router in `main.py`

## License

MIT
