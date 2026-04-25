import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { DayPicker } from 'react-day-picker';
import { format, addDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CycleLog } from '../../types';
import { Calendar as CalendarIcon, Sparkles, Heart, Zap, History, ChevronRight, Activity, Moon } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import Skeleton from '../../components/shared/Skeleton';
import StormLoader from '../../components/shared/StormLoader';

import InsightCards from '../../components/dashboard/InsightCards';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';
import OnboardingTour from '../../components/dashboard/OnboardingTour';
import FeatureShowcase, { FEATURES } from '../../components/dashboard/FeatureShowcase';

export default function DashboardHome() {
  const [logs, setLogs] = useState<CycleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showcaseIdx, setShowcaseIdx] = useState(-1);
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  
  const [userData, setUserData] = useState<any>(null);
  const [privateData, setPrivateData] = useState<any>(null);

  const [prediction, setPrediction] = useState({
    nextDate: addDays(new Date(), 14),
    confidence: 91.3,
    day: 14,
    total: 28,
    phase: 'follicular',
    phaseDescription: 'follicular phase. Your energy should be rising.'
  });

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [tempNextDate, setTempNextDate] = useState(() => format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [tempCycleLength, setTempCycleLength] = useState(28);

  // Helper function to calculate cycle phase
  const calculatePhase = (lastPeriodDate: Date, cycleLength: number) => {
    const now = new Date();
    const daysSinceLastPeriod = Math.floor((now.getTime() - lastPeriodDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayInCycle = daysSinceLastPeriod % cycleLength;
    
    let phase = 'follicular';
    let phaseDescription = 'follicular phase. Your energy should be rising.';
    
    if (dayInCycle < 5) {
      phase = 'menstrual';
      phaseDescription = 'menstrual phase. Rest and hydrate well.';
    } else if (dayInCycle < 14) {
      phase = 'follicular';
      phaseDescription = 'follicular phase. Your energy should be rising.';
    } else if (dayInCycle < 16) {
      phase = 'ovulation';
      phaseDescription = 'ovulation phase. You&apos;re at peak energy and fertility.';
    } else if (dayInCycle < cycleLength) {
      phase = 'luteal';
      phaseDescription = 'luteal phase. Focus on self-care and nutrition.';
    }

    return {
      phase,
      phaseDescription,
      day: dayInCycle + 1,
      total: cycleLength
    };
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user and profile data
    const fetchData = async () => {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        console.log("Fetched user data:", userSnap.data());
        if (userSnap.exists()) {
             setUserData(userSnap.data());
        }

        const profileRef = doc(db, 'users', auth.currentUser.uid, 'private', 'profile');
        const profileSnap = await getDoc(profileRef);
        console.log("Fetched profile data:", profileSnap.data());
        if (profileSnap.exists()) {
             const data = profileSnap.data();
             setPrivateData(data);
             if (data.lastPeriodDate) {
                const lastPeriod = data.lastPeriodDate.toDate();
                const cycleLength = data.avgCycleLength || 28;
                const nextDate = addDays(lastPeriod, cycleLength);
                
                // Calculate the current phase and day
                const phaseInfo = calculatePhase(lastPeriod, cycleLength);
                
                setPrediction(prev => ({ 
                  ...prev, 
                  nextDate,
                  phase: phaseInfo.phase,
                  phaseDescription: phaseInfo.phaseDescription,
                  day: phaseInfo.day,
                  total: phaseInfo.total
                }));
             }
        }
    };
    fetchData();

    // Check onboarding status
    const checkOnboarding = async () => {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && !userSnap.data().onboardingCompleted) {
        setShowOnboarding(true);
      }
    };
    
    checkOnboarding();
    
    const logsRef = collection(db, 'users', auth.currentUser.uid, 'cycleLogs');
    const q = query(logsRef, orderBy('date', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as CycleLog[];
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { onboardingCompleted: true });
      setShowOnboarding(false);
      setShowcaseIdx(0); // Start feature showcase
    } catch (err) {
      console.error("Error updating onboarding status:", err);
      setShowOnboarding(false);
    }
  };

  const handleNextShowcase = () => {
    if (showcaseIdx < FEATURES.length - 1) {
      setShowcaseIdx(showcaseIdx + 1);
    } else {
      setShowcaseIdx(-1);
    }
  };

  const handleSaveAdjustment = async () => {
    if (!auth.currentUser) return;
    
    // Parse midnight date based on the input
    const [year, month, day] = tempNextDate.split('-').map(Number);
    const updatedDate = new Date(year, month - 1, day);

    setPrediction(prev => ({
      ...prev,
      nextDate: updatedDate,
      total: tempCycleLength,
      confidence: 100 // manually overridden
    }));
    setIsAdjusting(false);

    try {
      const predictionSettingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'cycleConfig');
      await setDoc(predictionSettingsRef, {
        manualNextDate: tempNextDate,
        manualCycleLength: tempCycleLength,
        updatedAt: new Date()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save prediction settings", err);
    }
  };

  const periodDays = logs.filter(l => l.isFirstDay || l.flowIntensity !== 'none').map(l => l.date);

  const personalizedInsights = [
    { text: logs.length > 5 ? "Your cycle seems stable this month." : "Log more data to see patterns.", icon: History },
    { text: "Focus on gentle movement during luteal phase.", icon: Zap },
    { text: "Maintain hydration while reporting bloating.", icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <StormLoader size="lg" label="Synchronizing cycle data" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTour onComplete={handleOnboardingComplete} />
        )}
        {showcaseIdx >= 0 && (
          <FeatureShowcase 
            feature={FEATURES[showcaseIdx]} 
            onClose={() => setShowcaseIdx(-1)} 
            onNext={handleNextShowcase}
            isLast={showcaseIdx === FEATURES.length - 1}
          />
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-storm-text">Hello, {userData?.displayName || userData?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-storm-muted">You&apos;re in your {prediction.phaseDescription}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-storm-blush rounded-full text-storm-primary font-medium text-sm">
          <Sparkles size={16} /> Day {prediction.day} of {prediction.total}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Calendar Column */}
        <div className="xl:col-span-7 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-storm-border">
            <div className="flex items-center gap-2 mb-6 text-storm-primary font-serif font-bold text-xl">
              <CalendarIcon size={24} />
              Cycle Calendar
            </div>
            <div className="flex justify-center custom-calendar overflow-x-auto">
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={setSelectedDay}
                modifiers={{
                  period: periodDays,
                  prediction: [prediction.nextDate]
                }}
                modifiersClassNames={{
                  period: "bg-red-100 text-red-600 font-bold rounded-full",
                  prediction: "border-2 border-dashed border-storm-primary text-storm-primary font-bold rounded-full"
                }}
                className="mx-auto"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-100 rounded-full border border-red-200"></div> Period</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-dashed border-storm-primary rounded-full"></div> Predicted</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 rounded-full"></div> Fertile</div>
            </div>
          </section>

          {/* Quick Logs */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-storm-border">
            <h3 className="text-lg mb-4">How are you feeling today?</h3>
            <div className="flex flex-wrap gap-3">
              {['Cramps', 'Bloating', 'Mood', 'Energy', 'Skin'].map(s => (
                <button key={s} className="px-4 py-2 bg-storm-cream border border-storm-border rounded-full text-sm hover:bg-storm-blush transition-colors">
                  {s}
                </button>
              ))}
              <button className="px-4 py-2 bg-storm-primary text-white rounded-full text-sm">+ Log More</button>
            </div>
          </section>
        </div>

        {/* Prediction & Insights Column */}
        <div className="xl:col-span-5 space-y-6">
          <section className="bg-storm-primary text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm opacity-80 uppercase tracking-wider">Next Period Prediction</div>
                <button 
                  onClick={() => setIsAdjusting(!isAdjusting)} 
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full backdrop-blur-md transition-colors"
                >
                  {isAdjusting ? 'Cancel' : 'Adjust'}
                </button>
              </div>

              {isAdjusting ? (
                 <div className="space-y-4 mb-4 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
                    <div>
                      <label className="block text-xs opacity-80 mb-1">Predicted Start Date</label>
                      <input 
                         type="date"
                         value={tempNextDate}
                         onChange={(e) => setTempNextDate(e.target.value)}
                         className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/30 text-white focus:outline-none focus:border-white/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs opacity-80 mb-1">Estimated Cycle Length (Days)</label>
                      <input 
                         type="number"
                         min="15"
                         max="60"
                         value={tempCycleLength}
                         onChange={(e) => setTempCycleLength(parseInt(e.target.value))}
                         className="w-full px-3 py-2 bg-white/20 rounded-lg border border-white/30 text-white focus:outline-none focus:border-white/50 text-sm"
                      />
                    </div>
                    <button 
                      onClick={handleSaveAdjustment} 
                      className="w-full py-2 bg-white text-storm-primary rounded-lg text-sm font-bold shadow-md hover:bg-storm-cream transition-colors"
                    >
                       Save Adjustment
                    </button>
                 </div>
              ) : (
                <>
                  <div className="text-4xl font-serif mb-4">{format(prediction.nextDate, 'MMM d')}</div>
                  <div className="flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                    <Sparkles size={14} /> {prediction.confidence}% AI Accuracy
                  </div>
                </>
              )}
            </div>
            <Zap className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-storm-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg">PCOD Risk Level</h3>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">LOW</span>
              </div>
              <p className="text-sm text-storm-muted mb-4 leading-relaxed">
                Based on your screening from 12 days ago, your risk score is 18%. 
              </p>
              <button className="w-full py-3 bg-storm-cream border border-storm-border rounded-xl text-sm font-medium hover:bg-storm-blush transition-colors flex items-center justify-center gap-2">
                Retake Screener <ChevronRight size={16} />
              </button>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-storm-border">
              <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                Health Sync
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-storm-cream rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-storm-muted">Daily Steps</p>
                      <p className="text-sm font-bold">8,432</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">Synced</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-storm-cream rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                        <Moon size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-storm-muted">Sleep Pattern</p>
                        <p className="text-sm font-bold">7h 20m</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">Synced</div>
                  </div>
              </div>
            </section>
          </div>

          <InsightCards insights={personalizedInsights} />
        </div>
      </div>
      
      <style>{`
        .custom-calendar .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #6B1A3A;
          --rdp-background-color: #F0E6ED;
          margin: 0;
        }
        .rdp-day_selected { background-color: #6B1A3A !important; }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #F0E6ED !important; }
      `}</style>
    </div>
  );
}
