# Astral NEO Monitoring Platform

A full-stack web platform for tracking Near-Earth Objects (NEOs) with real-time NASA data, risk analysis, 3D orbital visualization, real-time chat, and customizable alerts.

![Tech Stack](https://img.shields.io/badge/React_19-blue?style=flat) ![Tech Stack](https://img.shields.io/badge/Node.js-green?style=flat) ![Tech Stack](https://img.shields.io/badge/MongoDB_7-darkgreen?style=flat) ![Tech Stack](https://img.shields.io/badge/Docker-blue?style=flat) ![Tech Stack](https://img.shields.io/badge/Three.js-black?style=flat) ![Tech Stack](https://img.shields.io/badge/Socket.IO-white?style=flat)

---

## Features

- **Real-time asteroid tracking** — Fetches daily data from NASA's NeoWs API
- **Custom risk scoring engine** — Weighted formula analyzing hazard status, size, proximity, and velocity
- **3D orbital visualization** — Interactive Earth + asteroid orbits rendered with Three.js
- **Impact simulator** — Hypothetical impact physics (crater size, energy, earthquake magnitude)
- **Real-time chat** — Socket.IO-powered community chat
- **Alert system** — Configurable notifications for close approaches and high-risk asteroids
- **Watchlist** — Track specific asteroids and get updates
- **User auth** — JWT-based registration, login, and profile management

---

## Running with Docker (Recommended)

This is the fastest way to get the entire stack running. You only need **Docker** installed — no Node.js, no MongoDB, nothing else.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
  - **Windows**: Docker Desktop for Windows (requires WSL 2 or Hyper-V)
  - **Mac**: Docker Desktop for Mac
  - **Linux**: [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose plugin](https://docs.docker.com/compose/install/)
- A free [NASA API Key](https://api.nasa.gov/) (optional — the app works with `DEMO_KEY` but has lower rate limits)

### Quick Start (Development)

**1. Clone the repository**

```bash
git clone <your-repo-url>
cd tracker
```

**2. Create the server environment file**

```bash
# On Linux/Mac:
cp server/.env.example server/.env

# On Windows (PowerShell):
Copy-Item server/.env.example server/.env
```

If `.env.example` doesn't exist, create `server/.env` manually:

```env
PORT=5000
MONGODB_URI=mongodb://astral_admin:astral_secret_2024@mongodb:27017/astral_neo?authSource=admin
JWT_SECRET=your_jwt_secret_here_change_this
JWT_EXPIRES_IN=7d
NASA_API_KEY=DEMO_KEY
CORS_ORIGIN=http://localhost
```

> Replace `DEMO_KEY` with your NASA API key for higher rate limits (1000 requests/hour vs. 30).

**3. Build and start all services**

```bash
docker compose up -d --build
```

This builds and starts **4 containers**:

| Service       | Container              | URL                                            | Description               |
| ------------- | ---------------------- | ---------------------------------------------- | ------------------------- |
| Frontend      | `astral-frontend`      | [http://localhost](http://localhost)           | React app served by Nginx |
| Backend       | `astral-backend`       | [http://localhost:5000](http://localhost:5000) | Express API + Socket.IO   |
| MongoDB       | `astral-mongodb`       | `localhost:27017`                              | Database                  |
| Mongo Express | `astral-mongo-express` | [http://localhost:8081](http://localhost:8081) | Database UI (dev only)    |

**4. Open the app**

Navigate to **[http://localhost](http://localhost)** in your browser. That's it!

The backend automatically fetches asteroid data from NASA on startup, so you should see data in the dashboard within a minute or two.

### Quick Start (Production)

For a production-ready deployment with resource limits and optimized builds:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The production compose file:

- Removes Mongo Express (not needed in production)
- Adds memory limits (512MB backend, 128MB frontend, 512MB MongoDB)
- Sets `restart: always` for crash recovery
- Uses environment variable injection for secrets

To configure production secrets, create a `.env` file in the `tracker/` root:

```env
MONGODB_URI=mongodb://astral_admin:your_strong_password@mongodb:27017/astral_neo?authSource=admin
JWT_SECRET=a_long_random_secret_string_at_least_32_chars
NASA_API_KEY=your_nasa_api_key
CORS_ORIGIN=https://yourdomain.com
APP_PORT=80
```

### Common Docker Commands

```bash
# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# Rebuild a single service after code changes
docker compose up -d --build backend

# Check container status
docker compose ps

# Open a shell inside a container
docker compose exec backend sh
docker compose exec mongodb mongosh -u astral_admin -p astral_secret_2024
```

### Troubleshooting Docker

| Problem                          | Solution                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Port 80 already in use           | Change the frontend port: edit `docker-compose.yml` and change `"80:80"` to `"3000:80"`, then open `http://localhost:3000`                                           |
| Port 27017 already in use        | You have a local MongoDB running. Stop it first, or remove the `ports` mapping from the mongodb service (the backend connects via the Docker network, not localhost) |
| MongoDB auth errors              | Run `docker compose down -v` to wipe the data volume, then `docker compose up -d --build` for a fresh start                                                          |
| Backend can't connect to MongoDB | Make sure the `MONGODB_URI` in `server/.env` uses `mongodb` as the hostname (not `localhost`), since containers communicate via Docker's internal network            |
| Frontend shows blank page        | Check browser console for errors. The Vite build args `VITE_API_URL` and `VITE_SOCKET_URL` should be empty strings (Nginx proxies them)                              |
| "Cannot find module" errors      | Run `docker compose up -d --build` to rebuild with a fresh `npm ci`                                                                                                  |

---

## Running Without Docker (Manual Setup)

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB 7](https://www.mongodb.com/try/download/community) (running locally or via Docker)
- [NASA API Key](https://api.nasa.gov/) (free)

### 1. Start MongoDB

Either start MongoDB locally or use Docker for just the database:

```bash
cd tracker
docker compose up -d mongodb mongo-express
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://astral_admin:astral_secret_2024@localhost:27017/astral_neo?authSource=admin
JWT_SECRET=your_jwt_secret_here
NASA_API_KEY=your_nasa_api_key
CORS_ORIGIN=http://localhost:5173
```

```bash
npm run dev
```

Server runs on `http://localhost:5000`.

### 3. Frontend

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Project Structure

```
tracker/
├── docker-compose.yml          # Dev Docker stack (all services)
├── docker-compose.prod.yml     # Production Docker stack
├── AI-LOG.md                   # How AI was used to build this project
├── GUIDE.md                    # Technical guide (risk engine, orbital math, impact physics)
├── README.md                   # This file
├── mongo-init/                 # MongoDB initialization scripts
│   └── 01-create-app-user.js
├── server/                     # Node.js Backend
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js              # Express + Socket.IO server entry
│       ├── config/             # Database config
│       ├── controllers/        # Route controllers
│       ├── middleware/          # Auth middleware (JWT)
│       ├── models/             # Mongoose schemas (Asteroid, User, Alert, ChatMessage)
│       ├── routes/             # REST API routes
│       └── services/           # Business logic
│           ├── nasaService.js      # NASA NeoWs API wrapper
│           ├── riskEngine.js       # Risk scoring engine
│           ├── scheduler.js        # Cron-based data fetcher
│           └── alertDispatcher.js  # User alert matching + dispatch
└── client/                     # React Frontend
    ├── Dockerfile
    ├── nginx.conf              # Nginx reverse proxy config
    ├── package.json
    └── src/
        ├── components/
        │   ├── Visualization/      # 3D Earth, orbits, impact sim
        │   ├── Dashboard/          # Stats, ticker
        │   ├── Chat/               # Real-time chat
        │   └── ...
        ├── pages/                  # Route pages
        ├── stores/                 # Zustand state management
        ├── services/               # API + Socket.IO clients
        └── utils/
            └── orbitalMechanics.js # Orbit estimation + Kepler solver
```

---

## API Endpoints

### Health Check

- `GET /health` — Server status

### Asteroids

- `GET /api/asteroids` — List asteroids (with filters, pagination)
- `GET /api/asteroids/stats` — Dashboard statistics
- `GET /api/asteroids/today` — Today's close approaches
- `GET /api/asteroids/:id` — Single asteroid details
- `GET /api/asteroids/hazardous/all` — Potentially hazardous asteroids

### Authentication

- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Current user (protected)
- `PUT /api/auth/profile` — Update profile (protected)

### Watchlist (Protected)

- `POST /api/auth/watchlist/:id` — Add asteroid to watchlist
- `DELETE /api/auth/watchlist/:id` — Remove from watchlist
- `GET /api/auth/watchlist` — Get user's watchlist

### Alerts (Protected)

- `GET /api/alerts` — Get user's alerts
- `PUT /api/alerts/:id/read` — Mark alert as read

### Chat (Protected)

- `GET /api/chat/messages` — Get chat history
- `POST /api/chat/messages` — Send a message

---

## Socket.IO Events

### Client → Server

| Event              | Payload      | Description                          |
| ------------------ | ------------ | ------------------------------------ |
| `watch_asteroid`   | `asteroidId` | Subscribe to updates for an asteroid |
| `unwatch_asteroid` | `asteroidId` | Unsubscribe                          |
| `join_user_room`   | `userId`     | Join personal notification channel   |

### Server → Client

| Event                  | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `NEW_ASTEROID_SPOTTED` | New asteroid detected in latest fetch                 |
| `CLOSE_APPROACH_ALERT` | Asteroid approaching within user's distance threshold |
| `watchlist_updated`    | Watchlist asteroid has new data                       |
| `DAILY_UPDATE`         | Daily fetch completed (includes stats)                |

---

## Environment Variables

| Variable          | Description                                          | Default            |
| ----------------- | ---------------------------------------------------- | ------------------ |
| `PORT`            | Backend server port                                  | `5000`             |
| `MONGODB_URI`     | MongoDB connection string                            | —                  |
| `JWT_SECRET`      | JWT signing secret                                   | —                  |
| `JWT_EXPIRES_IN`  | Token expiry duration                                | `7d`               |
| `NASA_API_KEY`    | NASA API key ([get one free](https://api.nasa.gov/)) | `DEMO_KEY`         |
| `CORS_ORIGIN`     | Allowed frontend origin                              | `http://localhost` |
| `VITE_API_URL`    | Backend URL for frontend (dev only)                  | —                  |
| `VITE_SOCKET_URL` | Socket.IO URL for frontend (dev only)                | —                  |

---

## Documentation

- [AI-LOG.md](AI-LOG.md) — How AI was used to build this project (tools, prompts, lessons learned)
- [GUIDE.md](GUIDE.md) — Technical guide: risk scoring formula, orbital mechanics, impact physics, data pipeline

---

## License

MIT
