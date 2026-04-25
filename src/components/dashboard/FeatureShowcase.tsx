import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Calendar, Activity, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
  image: string;
}

export const FEATURES: FeatureCard[] = [
  {
    id: 'cycle',
    title: 'Cycle Tracking',
    description: 'Log your symptoms daily and get accurate predictions for your next period and ovulation windows.',
    icon: Calendar,
    path: '/dashboard/cycle',
    color: 'bg-storm-primary',
    image: 'https://images.unsplash.com/photo-1518248428462-2e59b244795b?q=80&w=2670&auto=format&fit=crop'
  },
  {
    id: 'pcod',
    title: 'PCOD Screening',
    description: 'Use our scientifically-backed Bayesian tool to assess your risk for PCOD and get actionable reports.',
    icon: Activity,
    path: '/dashboard/pcod',
    color: 'bg-amber-600',
    image: 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?q=80&w=2670&auto=format&fit=crop'
  },
  {
    id: 'chatbot',
    title: 'AI Health Ally',
    description: 'Chat with Storm, our culturally sensitive AI assistant, for evidence-based answers to your health questions.',
    icon: Bot,
    path: '/dashboard/chatbot',
    color: 'bg-indigo-600',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2720&auto=format&fit=crop'
  }
];

interface FeatureShowcaseProps {
  feature: FeatureCard;
  onClose: () => void;
  onNext: () => void;
  isLast: boolean;
}

export default function FeatureShowcase({ feature, onClose, onNext, isLast }: FeatureShowcaseProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-storm-text/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative h-48">
          <img src={feature.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-storm-text/60 to-transparent" />
          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${feature.color} text-white shadow-lg`}>
              <feature.icon size={20} />
            </div>
            <h3 className="text-xl font-serif text-white font-bold">{feature.title}</h3>
          </div>
        </div>

        <div className="p-8">
          <p className="text-storm-muted leading-relaxed mb-8">
            {feature.description}
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => navigate(feature.path)}
              className="w-full py-4 bg-storm-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-storm-secondary transition-all shadow-lg shadow-storm-primary/20"
            >
              Learn More <ArrowRight size={18} />
            </button>
            <button 
              onClick={onNext}
              className="w-full py-3 text-storm-muted font-bold text-sm uppercase tracking-widest hover:text-storm-primary transition-colors"
            >
              {isLast ? "Done" : "Next Tip"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
