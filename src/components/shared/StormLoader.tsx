import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';

interface StormLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  isFullPage?: boolean;
}

const loadingMessages = [
  'Initializing',
  'Loading your cycle data',
  'Calibrating AI model',
  'Almost ready'
];

export default function StormLoader({ size = 'md', label, className = '', isFullPage = false }: StormLoaderProps) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % loadingMessages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Generate stable particle positions
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
      tx: (Math.random() - 0.5) * 60,
      ty: -(Math.random() * 80 + 40),
    }));
  }, []);

  const containerClasses = isFullPage 
    ? "fixed inset-0 z-[9999] bg-[#1A0510]" 
    : `relative ${className}`;

  if (isFullPage) {
    return (
      <div className={containerClasses}>
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0510] via-[#3D0B22] to-[#5A1230]" />
        
        {/* Expanding Rings */}
        {[200, 360, 520, 680].map((dim, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-full border border-pink-500/15"
            style={{ width: dim, height: dim, x: '-50%', y: '-50%' }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ 
              scale: [0.85, 1.05],
              opacity: [0, 1, 0] 
            }}
            transition={{ 
              duration: 3, 
              delay: i * 0.6, 
              repeat: Infinity, 
              ease: "easeOut" 
            }}
          />
        ))}

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-pink-400/30"
              style={{ width: p.size, height: p.size, left: p.left, top: p.top }}
              animate={{ 
                x: [0, p.tx], 
                y: [0, p.ty],
                opacity: [0.2, 0.5, 0] 
              }}
              transition={{ 
                duration: p.duration, 
                delay: p.delay, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          {/* Moon Orbit */}
          <div className="relative w-[130px] h-[130px] mb-8">
            <motion.div 
              className="absolute inset-0 rounded-full border border-dashed border-pink-400/35"
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute -top-[5px] left-1/2 -ml-[5px] w-[10px] h-[10px] rounded-full bg-[#E8799A] shadow-[0_0_12px_3px_rgba(232,121,154,0.6)]" />
            </motion.div>
            
            <div className="absolute inset-[18px] rounded-full bg-gradient-to-br from-[#7A1F40] to-[#3D0B22] border border-pink-500/50 flex items-center justify-center overflow-hidden">
              <motion.svg 
                className="w-[50px] h-[50px]" 
                viewBox="0 0 60 60" 
                fill="none" 
                animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M30 8 C30 8, 38 20, 38 30 C38 40, 30 52, 30 52 C30 52, 22 40, 22 30 C22 20, 30 8, 30 8Z" fill="rgba(240,180,200,0.9)" />
                <path d="M8 30 C8 30, 20 22, 30 22 C40 22, 52 30, 52 30 C52 30, 40 38, 30 38 C20 38, 8 30, 8 30Z" fill="rgba(200,100,140,0.7)" />
                <circle cx="30" cy="30" r="5" fill="rgba(255,220,235,0.95)" />
              </motion.svg>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl font-serif font-bold text-[#F5DDE6] tracking-wider">StormCycle</h1>
            <p className="text-[12px] font-medium tracking-[0.4em] uppercase text-pink-300/70 mt-2">by Team SheStorm</p>
            <p className="mt-4 text-[13px] text-pink-200/60 italic font-medium tracking-wide">AI-powered menstrual health for every cycle</p>
          </motion.div>

          <motion.div 
            className="mt-10 w-[180px] h-[2px] bg-white/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div 
              className="h-full bg-gradient-to-r from-[#C0406A] to-[#E8799A]"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: [0.4, 0, 0.2, 1], delay: 0.9 }}
            />
          </motion.div>

          <div className="mt-4 h-6 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={msgIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-pink-300/50"
              >
                {loadingMessages[msgIdx]}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-pink-300/50"
                animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 right-8 text-[10px] font-bold text-pink-400/40 uppercase tracking-widest">
          Femtech · AI/ML
        </div>
        <div className="absolute bottom-6 left-8 text-[10px] font-bold text-pink-400/40 uppercase tracking-widest">
          v1.0
        </div>
      </div>
    );
  }

  // Minimal version for inline loading
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <motion.div 
          className="w-12 h-12 rounded-full border border-dashed border-storm-primary/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-storm-primary shadow-[0_0_8px_rgba(107,26,58,0.5)]" />
        </motion.div>
      </div>
      {label && (
        <span className="mt-3 text-[9px] uppercase tracking-[0.3em] font-bold text-storm-muted opacity-60">
          {label}
        </span>
      )}
    </div>
  );
}
