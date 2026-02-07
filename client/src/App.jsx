import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import AsteroidDetail from './pages/AsteroidDetail';
import AsteroidList from './pages/AsteroidList';
import Visualization from './pages/Visualization';
import LoadingScreen from './components/Common/LoadingScreen';
import { ToastContainer } from './components/Common/Toast';
import useAuthStore from './stores/authStore';
import useAlertStore from './stores/alertStore';
import socketService from './services/socket';

// Placeholder pages

const Watchlist = () => (
  <div className="min-h-screen pt-24 px-6 pb-12">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">Your Watchlist</h1>
      <p className="text-white/50">Track your favorite asteroids - coming soon!</p>
    </div>
  </div>
);

const Alerts = () => (
  <div className="min-h-screen pt-24 px-6 pb-12">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">Alerts</h1>
      <p className="text-white/50">Real-time notifications - coming soon!</p>
    </div>
  </div>
);

const Settings = () => (
  <div className="min-h-screen pt-24 px-6 pb-12">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">Settings</h1>
      <p className="text-white/50">Customize your experience - coming soon!</p>
    </div>
  </div>
);

const Profile = () => (
  <div className="min-h-screen pt-24 px-6 pb-12">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-4">Your Profile</h1>
      <p className="text-white/50">Manage your account - coming soon!</p>
    </div>
  </div>
);

function App() {
  const { checkAuth, user, isAuthenticated } = useAuthStore();
  const { addAlert } = useAlertStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    // Simulate initial loading
    const initApp = async () => {
      await checkAuth();
      // Give a brief moment to show the loading screen
      setTimeout(() => setIsInitializing(false), 1000);
    };

    initApp();

    // Connect to socket
    socketService.connect();

    // Listen for real-time events
    socketService.on('NEW_HAZARDOUS_ASTEROID', (data) => {
      console.log('🚨 New hazardous asteroid:', data);
      addToast({
        type: 'warning',
        title: 'Hazardous Asteroid Detected',
        message: `${data.name || 'New asteroid'} is approaching Earth`,
      });
    });

    socketService.on('DAILY_UPDATE', (data) => {
      console.log('📡 Daily update:', data);
      addToast({
        type: 'info',
        title: 'Data Updated',
        message: `${data.count || 0} asteroids tracked today`,
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Join user room for personal notifications
    if (isAuthenticated && user?._id) {
      socketService.joinUserRoom(user._id);

      socketService.on('CLOSE_APPROACH_ALERT', (alert) => {
        console.log('🔔 Alert received:', alert);
        addAlert(alert);
        addToast({
          type: 'warning',
          title: 'Close Approach Alert',
          message: alert.message || 'An asteroid is approaching',
        });
      });
    }
  }, [isAuthenticated, user]);

  if (isInitializing) {
    return <LoadingScreen message="Initializing Astral..." />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-space-900 stars-bg flex flex-col">
        <Navbar />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/asteroids" element={<AsteroidList />} />
              <Route path="/asteroid/:id" element={<AsteroidDetail />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/visualization" element={<Visualization />} />
            </Routes>
          </AnimatePresence>
        </main>

        <Footer />

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </BrowserRouter>
  );
}

export default App;
