import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AsteroidDetail from "./pages/AsteroidDetail";
import AsteroidList from "./pages/AsteroidList";
import Watchlist from "./pages/Watchlist";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Visualization from "./pages/Visualization";
import ImpactVisualizer from "./pages/ImpactVisualizer";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/Common/LoadingScreen";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { ToastContainer } from "./components/Common/Toast";
import ChatSidebar from "./components/Chat/ChatSidebar";
import useAuthStore from "./stores/authStore";
import useAlertStore from "./stores/alertStore";
import socketService from "./services/socket";

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
    // Initialize app
    const initApp = async () => {
      await checkAuth();
      // Brief loading screen
      setTimeout(() => setIsInitializing(false), 800);
    };

    initApp();

    // Connect to socket
    socketService.connect();

    // Listen for real-time events
    socketService.on("NEW_HAZARDOUS_ASTEROID", (data) => {
      console.log("🚨 New hazardous asteroid:", data);
      addToast({
        type: "warning",
        title: "Hazardous Asteroid Detected",
        message: `${data.name || "New asteroid"} is approaching Earth`,
      });
    });

    socketService.on("DAILY_UPDATE", (data) => {
      console.log("📡 Daily update:", data);
      addToast({
        type: "info",
        title: "Data Updated",
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

      socketService.on("CLOSE_APPROACH_ALERT", (alert) => {
        console.log("🔔 Alert received:", alert);
        addAlert(alert);
        addToast({
          type: "warning",
          title: "Close Approach Alert",
          message: alert.message || "An asteroid is approaching",
        });
      });

      socketService.on("WATCHLIST_ALERT", (data) => {
        console.log("⭐ Watchlist alert:", data);
        addToast({
          type: "info",
          title: "Watchlist Update",
          message: data.message || "A watched asteroid has an update",
        });
      });
    }
  }, [isAuthenticated, user]);

  if (isInitializing) {
    return <LoadingScreen message="Initializing Astral..." />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-space-900 stars-bg flex flex-col">
          <Navbar />

          <main className="flex-1">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/asteroids" element={<AsteroidList />} />
                <Route path="/asteroid/:id" element={<AsteroidDetail />} />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <Watchlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <ProtectedRoute>
                      <Alerts />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/visualization" element={<Visualization />} />
                <Route path="/impact" element={<ImpactVisualizer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Footer />

          {/* Global Chat Sidebar */}
          <ChatSidebar />

          {/* Toast notifications */}
          <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
