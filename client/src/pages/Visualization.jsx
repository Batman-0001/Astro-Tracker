import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Maximize2, Minimize2, Play, Pause } from 'lucide-react';
import useAsteroidStore from '../stores/asteroidStore';
import Earth3D from '../components/Visualization/Earth3D';

const Visualization = () => {
    const { todayAsteroids } = useAsteroidStore();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInfo, setShowInfo] = useState(true);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className={`min-h-screen ${isFullscreen ? 'pt-0' : 'pt-20'} pb-0 relative`}>
            {/* 3D Visualization Container */}
            <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative h-[calc(100vh-80px)]'}`}>
                <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-space-900">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/50">Loading 3D visualization...</p>
                        </div>
                    </div>
                }>
                    <Earth3D
                        asteroids={todayAsteroids}
                        className="w-full h-full"
                    />
                </Suspense>

                {/* Controls Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <motion.button
                        onClick={() => setShowInfo(!showInfo)}
                        className="p-3 glass hover:bg-white/10 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Info className="w-5 h-5 text-white" />
                    </motion.button>
                    <motion.button
                        onClick={toggleFullscreen}
                        className="p-3 glass hover:bg-white/10 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-5 h-5 text-white" />
                        ) : (
                            <Maximize2 className="w-5 h-5 text-white" />
                        )}
                    </motion.button>
                </div>

                {/* Info Panel */}
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-4 left-4 glass p-6 max-w-sm"
                    >
                        <h3 className="text-lg font-bold text-white mb-3">
                            🌍 Earth & NEO Visualization
                        </h3>
                        <div className="space-y-3 text-sm text-white/70">
                            <p>
                                This 3D visualization shows Earth and nearby asteroids
                                tracked by NASA's NeoWs API.
                            </p>
                            <div className="space-y-2">
                                <p className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-risk-high inline-block" />
                                    High Risk Asteroids
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-risk-moderate inline-block" />
                                    Moderate Risk
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-risk-low inline-block" />
                                    Low Risk
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-risk-minimal inline-block" />
                                    Minimal Risk
                                </p>
                            </div>
                            <p className="pt-2 border-t border-white/10 text-white/50">
                                Drag to rotate • Scroll to zoom
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Stats Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-3"
                >
                    <div className="glass px-4 py-2 flex items-center gap-2">
                        <span className="text-accent-primary">📡</span>
                        <span className="text-white font-medium">{todayAsteroids.length}</span>
                        <span className="text-white/50 text-sm">Objects Tracked</span>
                    </div>
                    <div className="glass px-4 py-2 flex items-center gap-2">
                        <span className="text-risk-high">⚠️</span>
                        <span className="text-white font-medium">
                            {todayAsteroids.filter(a => a.isPotentiallyHazardous).length}
                        </span>
                        <span className="text-white/50 text-sm">Hazardous</span>
                    </div>
                    <div className="glass px-4 py-2 flex items-center gap-2">
                        <span className="text-risk-high">🔴</span>
                        <span className="text-white font-medium">
                            {todayAsteroids.filter(a => a.riskCategory === 'high').length}
                        </span>
                        <span className="text-white/50 text-sm">High Risk</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Visualization;
