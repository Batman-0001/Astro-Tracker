import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, ChevronLeft, ChevronRight, AlertTriangle,
    ArrowUpDown, X, RefreshCw, Loader2
} from 'lucide-react';
import AsteroidCard from '../components/Asteroid/AsteroidCard';
import useAsteroidStore from '../stores/asteroidStore';

const AsteroidList = () => {
    const { asteroids, fetchAsteroids, isLoading, error } = useAsteroidStore();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 12;

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        riskCategory: '',
        hazardousOnly: false,
        sortBy: 'closeApproachDate',
        order: 'asc',
    });

    // Fetch asteroids on mount and when filters change
    useEffect(() => {
        loadAsteroids();
    }, [currentPage, filters]);

    const loadAsteroids = async () => {
        const params = {
            page: currentPage,
            limit: itemsPerPage,
            sortBy: filters.sortBy,
            order: filters.order,
        };

        if (filters.riskCategory) {
            params.riskCategory = filters.riskCategory;
        }
        if (filters.hazardousOnly) {
            params.hazardousOnly = 'true';
        }

        const result = await fetchAsteroids(params);
        if (result?.pagination) {
            setTotalPages(result.pagination.pages);
            setTotalCount(result.pagination.total);
        }
    };

    // Filter asteroids by search query (client-side)
    const filteredAsteroids = useMemo(() => {
        if (!searchQuery.trim()) return asteroids;

        const query = searchQuery.toLowerCase();
        return asteroids.filter(asteroid =>
            asteroid.name?.toLowerCase().includes(query) ||
            asteroid.neo_reference_id?.includes(query)
        );
    }, [asteroids, searchQuery]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            riskCategory: '',
            hazardousOnly: false,
            sortBy: 'closeApproachDate',
            order: 'asc',
        });
        setSearchQuery('');
        setCurrentPage(1);
    };

    const hasActiveFilters = filters.riskCategory || filters.hazardousOnly || searchQuery;

    return (
        <div className="min-h-screen pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-white mb-2">
                        All Asteroids
                    </h1>
                    <p className="text-white/50">
                        Browse and filter {totalCount.toLocaleString()} tracked Near-Earth Objects
                    </p>
                </motion.div>

                {/* Search and Filters Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-4 mb-6"
                >
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[250px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'border-accent-primary' : ''}`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {hasActiveFilters && (
                                <span className="w-2 h-2 bg-accent-primary rounded-full" />
                            )}
                        </button>

                        {/* Refresh */}
                        <button
                            onClick={loadAsteroids}
                            disabled={isLoading}
                            className="btn-ghost p-2.5"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Expanded Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 mt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Risk Category */}
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">Risk Category</label>
                                        <select
                                            value={filters.riskCategory}
                                            onChange={(e) => handleFilterChange('riskCategory', e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">All Categories</option>
                                            <option value="high">High Risk</option>
                                            <option value="moderate">Moderate Risk</option>
                                            <option value="low">Low Risk</option>
                                            <option value="minimal">Minimal Risk</option>
                                        </select>
                                    </div>

                                    {/* Sort By */}
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">Sort By</label>
                                        <select
                                            value={filters.sortBy}
                                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="closeApproachDate">Approach Date</option>
                                            <option value="riskScore">Risk Score</option>
                                            <option value="missDistanceKm">Distance</option>
                                            <option value="estimatedDiameterMax">Size</option>
                                            <option value="relativeVelocityKmS">Velocity</option>
                                        </select>
                                    </div>

                                    {/* Order */}
                                    <div>
                                        <label className="block text-sm text-white/50 mb-2">Order</label>
                                        <select
                                            value={filters.order}
                                            onChange={(e) => handleFilterChange('order', e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="asc">Ascending</option>
                                            <option value="desc">Descending</option>
                                        </select>
                                    </div>

                                    {/* Hazardous Only */}
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-space-800/50 rounded-xl border border-white/10 w-full">
                                            <input
                                                type="checkbox"
                                                checked={filters.hazardousOnly}
                                                onChange={(e) => handleFilterChange('hazardousOnly', e.target.checked)}
                                                className="w-5 h-5 rounded border-white/20 bg-space-700 text-accent-primary focus:ring-accent-primary/50"
                                            />
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-risk-high" />
                                                <span className="text-white">Hazardous Only</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {hasActiveFilters && (
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-white/50 hover:text-white flex items-center gap-1"
                                        >
                                            <X className="w-4 h-4" />
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Results info */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-white/50">
                        Showing {filteredAsteroids.length} of {totalCount.toLocaleString()} asteroids
                        {currentPage > 1 && ` • Page ${currentPage} of ${totalPages}`}
                    </p>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="glass p-8 text-center">
                        <p className="text-risk-high mb-4">{error}</p>
                        <button onClick={loadAsteroids} className="btn-primary">
                            Try Again
                        </button>
                    </div>
                )}

                {/* Asteroids Grid */}
                {!isLoading && !error && (
                    <>
                        {filteredAsteroids.length === 0 ? (
                            <div className="glass p-12 text-center">
                                <p className="text-white/50 text-lg mb-4">No asteroids found</p>
                                <button onClick={clearFilters} className="btn-secondary">
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                            >
                                {filteredAsteroids.map((asteroid, index) => (
                                    <AsteroidCard
                                        key={asteroid.neo_reference_id}
                                        asteroid={asteroid}
                                        index={index}
                                    />
                                ))}
                            </motion.div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center gap-2 mt-8"
                            >
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="btn-secondary p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                {/* Page numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all ${currentPage === pageNum
                                                        ? 'bg-accent-primary text-space-900'
                                                        : 'bg-space-700/50 text-white/70 hover:bg-space-600/50 hover:text-white'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="btn-secondary p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AsteroidList;
