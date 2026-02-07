# Astral NEO Monitoring Platform

A full-stack web platform for tracking Near-Earth Objects (NEOs) with real-time data, risk analysis, and 3D visualization.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ 
- [Docker](https://www.docker.com/) & Docker Compose
- [NASA API Key](https://api.nasa.gov/) (free)

### 1. Start MongoDB with Docker

```bash
cd tracker
docker-compose up -d mongodb mongo-express
```

This starts:
- **MongoDB** on `localhost:27017`
- **Mongo Express** (DB UI) on `localhost:8081` (login: admin/admin123)

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment

Edit `server/.env` and add your NASA API key:
```
NASA_API_KEY=your_api_key_here
```

### 4. Start the Backend Server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 📁 Project Structure

```
tracker/
├── docker-compose.yml      # MongoDB + Mongo Express
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── app.js         # Express + Socket.IO server
│   │   ├── config/        # Database config
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth middleware
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   ├── .env               # Environment variables
│   └── package.json
└── client/                 # React Frontend (Phase 3)
```

## 🔗 API Endpoints

### Health Check
- `GET /health` - Server status

### Asteroids
- `GET /api/asteroids` - List asteroids (with filters)
- `GET /api/asteroids/stats` - Dashboard statistics
- `GET /api/asteroids/today` - Today's approaches
- `GET /api/asteroids/:id` - Single asteroid details
- `GET /api/asteroids/hazardous/all` - Potentially hazardous

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/watchlist/:id` - Add to watchlist (protected)
- `DELETE /api/auth/watchlist/:id` - Remove from watchlist (protected)
- `GET /api/auth/watchlist` - Get watchlist (protected)

## 🗄️ Database Schemas

### User
- Email, password (hashed), display name
- Watchlist array (asteroid IDs)
- Custom alert settings

### Asteroid (with 24h TTL)
- NASA data + calculated risk score
- Indexed fields for fast queries
- Auto-expires to ensure fresh data

### Alert
- User notifications for close approaches
- Read/unread status
- Delivery tracking (dashboard, push, email)

## 📡 Socket.IO Events

### Client → Server
- `watch_asteroid(asteroidId)` - Subscribe to asteroid updates
- `unwatch_asteroid(asteroidId)` - Unsubscribe
- `join_user_room(userId)` - Join personal notification room

### Server → Client
- `NEW_ASTEROID_SPOTTED` - New asteroid detected
- `CLOSE_APPROACH_ALERT` - Approaching asteroid warning
- `watchlist_updated` - Watchlist changed

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiry | 7d |
| `NASA_API_KEY` | NASA API key | DEMO_KEY |
| `SOCKET_CORS_ORIGIN` | Allowed frontend origin | http://localhost:3000 |

## 📝 License

MIT
