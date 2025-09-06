# Smart EcoBin Python Backend

A comprehensive Python FastAPI backend for the Smart EcoBin waste management system.

## Features

- **Authentication**: JWT-based user authentication and authorization
- **Waste Detection**: AI-powered waste identification using OpenAI Vision API
- **Bin Management**: Location-based bin finder with real-time status
- **Analytics**: User statistics, environmental impact tracking, and leaderboards
- **Feedback System**: Multi-category feedback collection and management
- **Voice Assistant**: ElevenLabs-powered conversational AI integration

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Primary database
- **JWT**: Authentication tokens
- **OpenAI**: Waste detection and analysis
- **ElevenLabs**: Voice assistant functionality
- **Pydantic**: Data validation and serialization

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

Install PostgreSQL and create a database:

```sql
CREATE DATABASE smart_ecobin;
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE smart_ecobin TO username;
```

### 3. Environment Configuration

Copy the `.env` file and update with your credentials:

```bash
cp .env.example .env
```

Update the following variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SECRET_KEY`: JWT secret key (generate a secure random string)
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key

### 4. Run the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Waste Detection
- `POST /api/detection/detect` - Analyze waste image
- `GET /api/detection/history` - Get detection history

### Bin Management
- `GET /api/bins/` - Get all bins (with filters)
- `GET /api/bins/nearby` - Get nearby bins
- `GET /api/bins/{bin_id}` - Get specific bin
- `POST /api/bins/` - Create new bin (admin)
- `PUT /api/bins/{bin_id}` - Update bin status
- `GET /api/bins/types/stats` - Get bin statistics

### Analytics
- `GET /api/analytics/dashboard` - User dashboard data
- `GET /api/analytics/environmental-impact` - Environmental impact stats
- `GET /api/analytics/leaderboard` - User leaderboard

### Feedback
- `POST /api/feedback/submit` - Submit feedback
- `GET /api/feedback/` - Get user feedback
- `GET /api/feedback/stats` - Get feedback statistics

### Voice Assistant
- `POST /api/voice/chat` - Voice interaction
- `GET /api/voice/history` - Voice interaction history

## Database Models

### User
- User authentication and profile information
- Relationships to detections, feedback, and analytics

### WasteDetection
- Stores waste detection results and images
- Links to user and includes location data

### Bin
- Waste bin locations and status information
- Supports different bin types (general, recycling, organic, hazardous)

### Feedback
- User feedback with categorization and ratings
- Supports multiple feedback types

### UserAnalytics
- User statistics and environmental impact tracking
- Achievement system and scoring

### VoiceInteraction
- Voice assistant conversation history
- Audio duration and response tracking

## Development

### Adding New Endpoints

1. Create new router in `routers/` directory
2. Define Pydantic schemas in `schemas.py`
3. Add database models in `models.py`
4. Include router in `main.py`

### Database Migrations

```bash
# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

## Production Deployment

### Environment Variables
Set `ENVIRONMENT=production` and `DEBUG=False`

### Database
Use a production PostgreSQL instance with proper backup strategy

### Security
- Use strong JWT secret keys
- Enable HTTPS
- Configure proper CORS origins
- Set up rate limiting

### Monitoring
- Add logging configuration
- Set up health checks
- Monitor API performance

## Frontend Integration

The React frontend should be updated to use these API endpoints:

1. Update authentication to use `/api/auth/` endpoints
2. Replace Supabase calls with HTTP requests to Python backend
3. Update environment variables to point to Python backend URL
4. Maintain existing UI/UX without changes

## Support

For issues or questions, check the API documentation at `/docs` or review the source code in the respective router files.
