import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { useState } from "react";
import useAuthStore from "../../stores/authStore";
import useAlertStore from "../../stores/alertStore";
import SearchModal from "../Common/SearchModal";

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useAlertStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/asteroids", label: "Asteroids" },
    { path: "/visualization", label: "3D View" },
    { path: "/impact", label: "Impact Sim" },
    { path: "/watchlist", label: "Watchlist" },
    { path: "/alerts", label: "Alerts" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="glass border-b border-white/5 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Globe className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold text-white">Astral</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-space-800/50 rounded-full p-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path}>
                  <motion.div
                    className={`px-5 py-2 rounded-full font-medium transition-all ${
                      isActive(link.path) ?
                        "bg-accent-primary text-space-900"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {link.label}
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <motion.button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="w-5 h-5 text-white/70" />
              </motion.button>

              {/* Notifications */}
              <Link to="/alerts">
                <motion.div
                  className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="w-5 h-5 text-white/70" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-risk-high rounded-full text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </motion.div>
              </Link>

              {/* Settings */}
              <Link to="/settings">
                <motion.div
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Settings className="w-5 h-5 text-white/70" />
                </motion.div>
              </Link>

              {/* User Menu */}
              {isAuthenticated ?
                <div className="relative">
                  <motion.button
                    className="flex items-center gap-2 p-1 pl-3 rounded-full bg-space-700 hover:bg-space-600 transition-colors"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-sm font-medium text-white/90 hidden sm:block">
                      {user?.displayName}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
                      <User className="w-4 h-4 text-space-900" />
                    </div>
                  </motion.button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 glass rounded-xl overflow-hidden"
                    >
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-white/5 transition-colors text-risk-high"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </div>
              : <Link to="/login">
                  <motion.button
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.button>
                </Link>
              }

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/5"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ?
                  <X className="w-6 h-6" />
                : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="md:hidden mt-4 pb-4"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <div
                    className={`px-4 py-3 rounded-lg ${
                      isActive(link.path) ?
                        "bg-accent-primary/20 text-accent-primary"
                      : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Navbar;
