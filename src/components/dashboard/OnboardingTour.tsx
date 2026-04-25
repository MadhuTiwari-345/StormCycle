import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  Bot, 
  Activity, 
  ArrowRight, 
  CheckCircle2,
  Calendar,
  Target
} from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const slides = [
  {
    type: 'info',
    title: "Welcome to StormCycle",
    description: "Your health journey is unique. We're here to help you understand it with precision and care.",
    icon: Sparkles,
    color: "bg-storm-primary",
    image: "https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?q=80&w=2671&auto=format&fit=crop"
  },
  {
    type: 'info',
    title: "91.3% AI Accuracy",
    description: "Our LSTM-powered engine predicts your next cycle with industrial-grade precision, not just averages.",
    icon: Calendar,
    color: "bg-storm-secondary",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2631&auto=format&fit=crop"
  },
  {
    type: 'goals',
    title: "What are your goals?",
    description: "Help us personalize your experience by telling us what matters most to you.",
    icon: Target,
    color: "bg-storm-primary",
    image: "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=2670&auto=format&fit=crop"
  },
  {
    type: 'info',
    title: "Meet Storm, Your AI Ally",
    description: "Ask anything, anytime. Our culturally sensitive AI provides evidence-based health support 24/7.",
    icon: Bot,
    color: "bg-indigo-600",
    image: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?q=80&w=2506&auto=format&fit=crop"
  },
  {
    type: 'info',
    title: "Privacy by Design",
    description: "Your data is encrypted and protected under DPDP Act 2023. We never sell your health information.",
    icon: ShieldCheck,
    color: "bg-emerald-600",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2670&auto=format&fit=crop"
  }
];

const GOALS = [
  "Track my cycle accurately",
  "Understand PCOD/PCOS risk",
  "Monitor symptoms & moods",
  "Get AI health insights",
  "Prepare for doctor visits",
  "Improve overall wellness"
];

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [current, setCurrent] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const next = () => {
    if (current === slides.length - 1) {
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const slide = slides[current];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-storm-text/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
      >
        {/* Left: Image / Visual */}
        <div className="w-full md:w-1/2 relative bg-storm-blush overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={slide.image} 
                alt="" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-storm-text/80 via-transparent to-transparent md:bg-gradient-to-r" />
            </motion.div>
          </AnimatePresence>
          
          <div className="absolute bottom-8 left-8 right-8 text-white hidden md:block">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`w-12 h-12 ${slide.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}
            >
              <slide.icon size={24} />
            </motion.div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between bg-white">
          <div className="flex justify-between items-center mb-8">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-storm-primary' : 'w-2 bg-storm-blush'}`}
                />
              ))}
            </div>
            <button 
              onClick={onComplete}
              className="text-sm font-bold text-storm-muted uppercase tracking-widest hover:text-storm-primary transition-colors"
            >
              Skip
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="flex-1 flex flex-col justify-center"
            >
              <h2 className="text-4xl md:text-5xl font-serif text-storm-text mb-6 leading-tight">
                {slide.title}
              </h2>
              {slide.type === 'goals' ? (
                <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {GOALS.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                        selectedGoals.includes(goal) 
                        ? 'bg-storm-primary border-storm-primary text-white shadow-md' 
                        : 'bg-storm-cream/50 border-storm-border text-storm-text hover:border-storm-primary/40'
                      }`}
                    >
                      <span className="text-sm font-medium">{goal}</span>
                      {selectedGoals.includes(goal) && <CheckCircle2 size={16} />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-lg text-storm-muted leading-relaxed">
                  {slide.description}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12">
            <button 
              onClick={next}
              className="w-full py-5 bg-storm-primary text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-3 hover:bg-storm-secondary transition-all shadow-xl shadow-storm-primary/20 group"
            >
              {current === slides.length - 1 ? (
                <>Finish & Get Started <CheckCircle2 size={24} /></>
              ) : (
                <>Next <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E8D5DF;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6B1A3A;
        }
      `}</style>
    </div>
  );
}
