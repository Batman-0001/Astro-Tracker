import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import asteroidRoutes from './routes/asteroidRoutes.js';
import authRoutes from './routes/authRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initScheduler, runDailyFetch } from './services/scheduler.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});

// Make io accessible to routes
app.set('io', io);

// ========== MIDDLEWARE ==========

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
        next();
    });
}

// ========== ROUTES ==========

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Welcome route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 Welcome to Astral NEO Monitoring API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            asteroids: {
                list: 'GET /api/asteroids',
                stats: 'GET /api/asteroids/stats',
                today: 'GET /api/asteroids/today',
                single: 'GET /api/asteroids/:id',
                hazardous: 'GET /api/asteroids/hazardous/all',
            },
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/me',
                watchlist: 'GET /api/auth/watchlist',
            },
            alerts: {
                list: 'GET /api/alerts',
                unread: 'GET /api/alerts/unread',
                markRead: 'PUT /api/alerts/:id/read',
                markAllRead: 'PUT /api/alerts/read-all',
            },
            admin: {
                testNasa: 'GET /api/admin/test-nasa',
                triggerFetch: 'POST /api/admin/fetch',
                stats: 'GET /api/admin/stats',
            },
        },
    });
});

// API routes
app.use('/api/asteroids', asteroidRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ========== SOCKET.IO EVENTS ==========

io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a room for specific asteroid updates
    socket.on('watch_asteroid', (asteroidId) => {
        socket.join(`asteroid:${asteroidId}`);
        console.log(`👁️ ${socket.id} watching asteroid: ${asteroidId}`);
    });

    // Leave asteroid room
    socket.on('unwatch_asteroid', (asteroidId) => {
        socket.leave(`asteroid:${asteroidId}`);
        console.log(`👁️ ${socket.id} stopped watching asteroid: ${asteroidId}`);
    });

    // Join user's personal notification room
    socket.on('join_user_room', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`👤 ${socket.id} joined user room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ASTRAL NEO MONITORING SERVER                        ║
║                                                           ║
║   🌐 Server:     http://localhost:${PORT}                   ║
║   📡 Socket.IO:  ws://localhost:${PORT}                     ║
║   🗄️  Database:   MongoDB Connected                       ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);

            // Initialize scheduler with Socket.IO
            initScheduler(io);

            // Fetch initial data on startup (in background)
            console.log('📡 Running initial asteroid fetch...');
            runDailyFetch();
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏳ Shutting down gracefully...');
    httpServer.close(() => {
        console.log('👋 Server closed');
        process.exit(0);
    });
});

export { app, io };
