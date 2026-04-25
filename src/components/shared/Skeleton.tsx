import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export default function Skeleton({ className = "", variant = 'rect' }: SkeletonProps) {
  const baseClasses = "bg-storm-cream/60 relative overflow-hidden";
  const roundedClasses = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded-md h-4 w-full"
  };

  return (
    <motion.div 
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={`${baseClasses} ${roundedClasses[variant]} ${className}`}
    >
      <motion.div
        animate={{
          x: ["-150%", "150%"]
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full h-full skew-x-[-15deg]"
      />
    </motion.div>
  );
}
