import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({
    icon,
    label,
    value,
    subValue,
    trend,
    trendValue,
    color = 'accent-primary',
    delay = 0,
}) => {
    const getTrendIcon = () => {
        if (trend === 'up') return <TrendingUp className="w-4 h-4 text-risk-high" />;
        if (trend === 'down') return <TrendingDown className="w-4 h-4 text-risk-minimal" />;
        return <Minus className="w-4 h-4 text-white/50" />;
    };

    return (
        <motion.div
            className="stat-card group hover:border-accent-primary/30 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
        >
            <div className="flex items-start justify-between">
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl`}
                    style={{
                        background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                    }}
                >
                    {icon}
                </div>
                {trend && (
                    <div className="flex items-center gap-1">
                        {getTrendIcon()}
                        {trendValue && (
                            <span className={`text-sm ${trend === 'up' ? 'text-risk-high' :
                                    trend === 'down' ? 'text-risk-minimal' :
                                        'text-white/50'
                                }`}>
                                {trendValue}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <p className="text-white/50 text-sm font-medium">{label}</p>
                <motion.p
                    className="text-3xl font-bold text-white mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: delay + 0.2 }}
                >
                    {value}
                </motion.p>
                {subValue && (
                    <p className="text-white/40 text-sm mt-1">{subValue}</p>
                )}
            </div>
        </motion.div>
    );
};

export default StatCard;
