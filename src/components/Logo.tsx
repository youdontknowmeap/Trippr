import { motion } from 'motion/react';

export const TripprLogo = ({ size = 120, className = "" }: { size?: number, className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Rotating Cartography Ring */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 opacity-40"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#4ade80"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </motion.svg>

      {/* Stylized 'T' Map Route */}
      <svg viewBox="0 0 100 100" className="w-1/2 h-1/2 z-10">
        <motion.path
          d="M30 30 H70 M50 30 V70 Q50 85 70 85"
          fill="none"
          stroke="#4ade80"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <motion.circle
          cx="70"
          cy="85"
          r="5"
          fill="#4ade80"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
        />
      </svg>
    </div>
  );
};
