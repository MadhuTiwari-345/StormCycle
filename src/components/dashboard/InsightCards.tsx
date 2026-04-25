import { motion } from 'motion/react';
import { History, Zap, Activity, Heart } from 'lucide-react';

interface Insight {
  text: string;
  icon: any;
  delay?: number;
}

const defaultInsights: Insight[] = [
  { text: "Your cycle has been 1 day shorter this month.", icon: History },
  { text: "You report more energy on days 8–12.", icon: Zap },
  { text: "Cramps most common on days 1–2 for you.", icon: Activity },
];

interface InsightCardsProps {
  insights?: Insight[];
}

export default function InsightCards({ insights = defaultInsights }: InsightCardsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-serif text-xl flex items-center gap-2">
        <Heart className="text-storm-primary" size={20} /> AI Insights
      </h3>
      <div className="grid gap-4">
        {insights.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: (item.delay || i) * 0.1 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-storm-border flex items-start gap-3 hover:border-storm-primary transition-all duration-300 group"
          >
            <div className="w-8 h-8 rounded-lg bg-storm-blush flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <item.icon className="text-storm-primary" size={16} />
            </div>
            <p className="text-sm leading-relaxed text-storm-text/80">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
