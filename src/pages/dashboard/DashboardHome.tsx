import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../../lib/firebase';
import { DayPicker } from 'react-day-picker';
import { format, addDays, isSameDay, differenceInDays } from 'date-fns';
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
    confidence: 85,
    day: 14,
    total: 28,
    insights: [] as string[]
  });

  const [isAdjusting, setIsAdjusting] = useState(false);
  const [tempNextDate, setTempNextDate] = useState(() => format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [tempCycleLength, setTempCycleLength] = useState(28);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [symptomIntensity, setSymptomIntensity] = useState(5);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
    );
  };

  const handleLogSymptoms = async () => {
    if (!auth.currentUser || selectedSymptoms.length === 0) return;
    try {
      const logsRef = collection(db, 'users', auth.currentUser.uid, 'cycleLogs');
      await addDoc(logsRef, {
        date: serverTimestamp(),
        symptoms: selectedSymptoms,
        symptomIntensity,
        energyLevel,
        flowIntensity: 'none',
        isFirstDay: false
      });
      setSelectedSymptoms([]);
      setEnergyLevel(5);
      setSymptomIntensity(5);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/cycleLogs`);
    }
  };

  const getPhase = (day: number) => {
    if (day <= 5) return 'menstrual';
    if (day <= 13) return 'follicular';
    if (day <= 15) return 'ovulatory';
    return 'luteal';
  };

  const getPhaseName = () => {
    const phase = getPhase(prediction.day);
    return `your ${phase} phase`;
  };

  const getPhaseEnergy = () => {
    const phase = getPhase(prediction.day);
    if (phase === 'menstrual') return 'Rest and reflect.';
    if (phase === 'follicular') return 'Your energy should be rising.';
    if (phase === 'ovulatory') return 'You are at your peak energy.';
    return 'Time to slow down.';
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Reset state when user changes
    setUserData(null);
    setPrivateData(null);
    setPrediction({
      nextDate: addDays(new Date(), 14),
      confidence: 85,
      day: 14,
      total: 28,
      insights: []
    });
    setLoading(true);

    const logsRef = collection(db, 'users', auth.currentUser.uid, 'cycleLogs');
    const q = query(logsRef, orderBy('date', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date()
      })) as CycleLog[];
      setLogs(currentLogs);
      setLoading(false);
      
      // Calculate prediction with the fresh logs
      updatePrediction(currentLogs);
    });

    const updatePrediction = async (currentLogs: CycleLog[]) => {
        if (!auth.currentUser) return;
        
        // Fetch user profile and PCOD data
        const profileRef = doc(db, 'users', auth.currentUser.uid, 'private', 'profile');
        const profileSnap = await getDoc(profileRef);
        
        const pcodRef = collection(db, 'users', auth.currentUser.uid, 'pcodScreenings');
        const pcodQuery = query(pcodRef, orderBy('createdAt', 'desc'), limit(1));
        const pcodSnap = await getDocs(pcodQuery);
        let pcodData = !pcodSnap.empty ? pcodSnap.docs[0].data() : null;

        if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setPrivateData(profileData);
            
            if (profileData.lastPeriodDate && profileData.lastPeriodDate.toDate) {
                const lastPeriod = profileData.lastPeriodDate.toDate();
                const cycleLength = profileData.avgCycleLength || 28;
                
                // Calculate next upcoming date
                let nextDate = addDays(lastPeriod, cycleLength);
                const today = new Date();
                if (nextDate < today) {
                    const daysSinceLastPeriod = differenceInDays(today, lastPeriod);
                    const completedCycles = Math.floor(daysSinceLastPeriod / cycleLength);
                    nextDate = addDays(lastPeriod, cycleLength * (completedCycles + 1));
                }
                
                // Keep `dayDiff` logic robust
                let dayDiff = differenceInDays(today, lastPeriod) + 1;
                if (dayDiff > cycleLength) {
                   dayDiff = (dayDiff % cycleLength) || cycleLength;
                }
                dayDiff = Math.max(1, dayDiff);
                
                const currentPhase = getPhase(dayDiff);

                let confidence = 85;
                const insights: string[] = [];

                // 1. PCOD Factor
                if (pcodData?.riskLevel === 'high') {
                    confidence -= 15;
                    insights.push("High PCOD risk detected. This may cause cycle irregularities.");
                } else if (pcodData?.riskLevel === 'moderate') {
                    confidence -= 5;
                    insights.push("Moderate PCOD risk detected. Monitor for variations.");
                }

                // 2. Data Regularity Factor (Engagement)
                const last30Days = currentLogs.filter(l => differenceInDays(new Date(), l.date) <= 30);
                const regularityScore = Math.min(10, last30Days.length / 4); // Target: 1 log per week min
                confidence += (regularityScore * 2);
                
                if (last30Days.length === 0) {
                    insights.push("Start logging symptoms daily to improve prediction accuracy.");
                } else if (last30Days.length < 5) {
                    insights.push("More frequent logging helps our AI understand your patterns better.");
                }

                // 3. Symptom & Energy Pattern Analysis (last 7 logs)
                const recentLogs = currentLogs.slice(0, 7);
                if (recentLogs.length > 0) {
                    const avgSymptomIntensity = recentLogs.reduce((acc, l) => acc + (l.symptomIntensity || 0), 0) / recentLogs.length;
                    const avgEnergyLevel = recentLogs.reduce((acc, l) => acc + (l.energyLevel || 5), 0) / recentLogs.length;

                    // High intensity symptoms or low energy patterns
                    if (avgSymptomIntensity > 7) {
                        confidence -= 10;
                        insights.push("Your recent symptoms are intense. This might indicate higher hormonal flux.");
                        
                        // If in late luteal phase and symptoms are spiking, your period might be early
                        if (currentPhase === 'luteal' && dayDiff > 25) {
                            nextDate = addDays(nextDate, -2); // Adjust predicted date earlier
                            insights.push("Based on current symptoms, your period may arrive slightly earlier than expected.");
                        }
                    }
                    
                    if (avgEnergyLevel < 3 && currentPhase !== 'menstrual') {
                        insights.push("Tracking lower energy levels than usual for this phase.");
                    }
                }

                // 4. Regularity Factor (based on history)
                if (currentLogs.length > 20) {
                    confidence += 5;
                    insights.push("Refined by deep history analysis.");
                }

                setPrediction({
                    nextDate,
                    confidence: Math.max(40, Math.min(99, confidence)),
                    day: dayDiff,
                    total: cycleLength,
                    insights: insights.slice(0, 3) // Take top 3 insights
                });
            }
        }
    };

    // Helper fetch for initial state
    const fetchUser = async () => {
        if (!auth.currentUser) return;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
             setUserData(userSnap.data());
        }
    };
    fetchUser();

    // Check onboarding status
    const checkOnboarding = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && !userSnap.data().onboardingCompleted) {
        setShowOnboarding(true);
      }
    };
    
    checkOnboarding();
    
    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const handleOnboardingComplete = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, { onboardingCompleted: true }, { merge: true });
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
  
  // Calculate fertile window (approx 5 days leading up to ovulation and day of)
  // Ovulation is roughly 14 days before next period.
  const fertileWindow = [];
  if (prediction.nextDate) {
    const ovulationDate = addDays(prediction.nextDate, -14);
    for (let i = -4; i <= 1; i++) {
        fertileWindow.push(addDays(ovulationDate, i));
    }
  }

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
          <h1 className="text-3xl font-serif text-storm-text">
            {userData ? `Hello, ${userData.name || 'User'}` : 'Welcome'}
          </h1>
          <p className="text-storm-muted">You're in {getPhaseName()}. {getPhaseEnergy()}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-storm-blush rounded-full text-storm-primary font-medium text-sm">
          <Sparkles size={16} /> Day {prediction.day} of {prediction.total}
        </div>
      </header>

      {prediction.insights.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-storm-cream border border-storm-blush p-4 rounded-2xl flex flex-col gap-2"
        >
          <div className="flex items-center gap-2 text-storm-primary font-bold text-sm">
            <Sparkles size={16} /> AI Cycle Insights
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {prediction.insights.map((insight, idx) => (
              <div key={idx} className="flex gap-2 items-start text-xs text-storm-text bg-white/50 p-3 rounded-xl border border-white">
                <div className="w-1.5 h-1.5 rounded-full bg-storm-primary mt-1 shrink-0" />
                {insight}
              </div>
            ))}
          </div>
        </motion.section>
      )}

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
                  prediction: [prediction.nextDate],
                  fertile: fertileWindow
                }}
                modifiersClassNames={{
                  period: "bg-red-100 text-red-600 font-bold rounded-full",
                  prediction: "border-2 border-dashed border-storm-primary text-storm-primary font-bold rounded-full",
                  fertile: "bg-blue-100 text-blue-700 font-bold rounded-full"
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
            <div className="flex flex-wrap gap-3 mb-6">
              {['Cramps', 'Bloating', 'Mood Swings', 'Energy Dip', 'Acne/Skin', 'Pelvic Pain', 'Hair Fall', 'Weight Fluctuation'].map(s => (
                <button 
                  key={s} 
                  onClick={() => toggleSymptom(s)}
                  className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                    selectedSymptoms.includes(s)
                      ? 'bg-storm-primary text-white border-storm-primary'
                      : 'bg-storm-cream border-storm-border hover:bg-storm-blush'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {selectedSymptoms.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm text-storm-muted">Symptom Intensity: {symptomIntensity}/10</label>
                    <input type="range" min="1" max="10" value={symptomIntensity || 5} onChange={e => setSymptomIntensity(parseInt(e.target.value) || 5)} className="w-full h-2 bg-storm-cream rounded-lg appearance-none cursor-pointer accent-storm-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-storm-muted">Energy Level: {energyLevel}/10</label>
                    <input type="range" min="1" max="10" value={energyLevel || 5} onChange={e => setEnergyLevel(parseInt(e.target.value) || 5)} className="w-full h-2 bg-storm-cream rounded-lg appearance-none cursor-pointer accent-storm-primary" />
                  </div>
                  <button 
                    onClick={handleLogSymptoms}
                    className="w-full py-2 bg-storm-primary text-white rounded-full text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                  >
                    Save Logs
                  </button>
                </div>
            )}
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
                         onChange={(e) => setTempCycleLength(parseInt(e.target.value) || 28)}
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
