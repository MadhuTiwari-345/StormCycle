import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, Plus, CheckCircle2, Activity, Wind, Brain, Frown, Sparkles, BatteryLow, BatteryFull, CloudRain, Smile, Zap } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

const cycleData = [
  { month: 'Jan', length: 28, period: 5 },
  { month: 'Feb', length: 29, period: 6 },
  { month: 'Mar', length: 27, period: 4 },
  { month: 'Apr', length: 28, period: 5 },
  { month: 'May', length: 28, period: 5 },
  { month: 'Jun', length: 30, period: 6 },
];

const symptomPattern = [
  { day: 1, cramps: 80, energy: 20 },
  { day: 5, cramps: 20, energy: 40 },
  { day: 10, cramps: 0, energy: 90 },
  { day: 14, cramps: 10, energy: 100 },
  { day: 20, cramps: 30, energy: 70 },
  { day: 28, cramps: 70, energy: 30 },
];

const SYMPTOM_CATEGORIES = [
  {
    category: 'Physical',
    items: [
      { id: 'Cramps', label: 'Cramps', icon: Activity },
      { id: 'Bloating', label: 'Bloating', icon: Wind },
      { id: 'Headache', label: 'Headache', icon: Brain },
      { id: 'Nausea', label: 'Nausea', icon: Frown },
      { id: 'Acne/Skin Issues', label: 'Acne/Skin', icon: Sparkles },
    ]
  },
  {
    category: 'Energy & Mood',
    items: [
      { id: 'Low Energy', label: 'Low Energy', icon: BatteryLow },
      { id: 'High Energy', label: 'High Energy', icon: BatteryFull },
      { id: 'Sad Mood', label: 'Sad/Down', icon: CloudRain },
      { id: 'Happy Mood', label: 'Happy', icon: Smile },
      { id: 'Irritability', label: 'Irritable', icon: Zap },
    ]
  }
];

export default function CycleTracker() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [flowIntensity, setFlowIntensity] = useState('none');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'cycleLogs'),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      const fetchedLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(fetchedLogs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${auth.currentUser?.uid}/cycleLogs`);
    }
  };

  const getSymptomFrequency = () => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      log.symptoms?.forEach((s: string) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getSymptomPattern = () => {
    // Take the last 10 logs and reverse them so chronological
    const recentLogs = [...logs].slice(0, 10).reverse();
    return recentLogs.map((log) => {
      // Format date if possible
      let dateString = '';
      if (log.date && typeof log.date.toDate === 'function') {
        const d = log.date.toDate();
        dateString = `${d.getDate()}/${d.getMonth() + 1}`;
      } else if (log.date) {
        // Fallback for string dates if any or other formats
        const d = new Date(log.date);
        if (!isNaN(d.getTime())) {
          dateString = `${d.getDate()}/${d.getMonth() + 1}`;
        }
      }
      return {
        date: dateString || 'Log',
        intensity: log.symptomIntensity || 0,
        energy: log.energyLevel || 0
      };
    });
  };

  const dynamicSymptomPattern = getSymptomPattern();

  const frequencyData = getSymptomFrequency();

  const handleExport = () => {
    setIsExporting(true);
    
    // Create CSV content
    const headers = ['Month', 'Cycle Length', 'Period Length', 'Status'];
    const rows = cycleData.map(row => [
      row.month,
      row.length,
      row.period,
      'Normal'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cycle_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Reset state after short delay
    setTimeout(() => {
      setIsExporting(false);
    }, 500);
  };

  const handleToggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveLog = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'cycleLogs'), {
        date: Timestamp.fromDate(new Date(selectedDate)),
        flowIntensity,
        symptoms: selectedSymptoms,
        notes,
        createdAt: serverTimestamp()
      });
      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      setNotes(''); // Clear notes after save
      fetchLogs();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/cycleLogs`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-storm-text mb-2">Cycle Trends</h1>
          <p className="text-storm-muted">Analyze your history to find patterns.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 border border-storm-border rounded-xl text-sm font-medium hover:bg-storm-blush transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isExporting ? (
             <div className="w-4 h-4 border-2 border-storm-primary/30 border-t-storm-primary rounded-full animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </header>

      <div className="flex gap-4 border-b border-storm-border overflow-x-auto no-scrollbar">
        {['Overview', 'Symptoms', 'History', 'Phases'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab.toLowerCase())}
            className={`px-4 py-2 text-sm font-medium transition-all relative ${activeTab === tab.toLowerCase() ? 'text-storm-primary' : 'text-storm-muted'}`}
          >
            {tab}
            {activeTab === tab.toLowerCase() && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-storm-primary" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
{/* 
            <section className="bg-white p-6 rounded-3xl border border-storm-border shadow-sm">
              <h3 className="text-lg font-serif mb-6">Cycle Length History</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cycleData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8D5DF" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#8A6070', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#8A6070', fontSize: 12}} domain={[20, 35]} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="length" 
                      stroke="#6B1A3A" 
                      strokeWidth={3} 
                      dot={{fill: '#6B1A3A', strokeWidth: 2, r: 4}}
                      activeDot={{r: 8}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
            */}

            {/* Symptom Pattern Chart */}
            <section className="bg-white p-6 rounded-3xl border border-storm-border shadow-sm">
              <h3 className="text-lg font-serif mb-6">Symptom vs Energy Intensity</h3>
              <div className="h-64 min-h-[256px] w-full min-w-0">
                {dynamicSymptomPattern.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={dynamicSymptomPattern}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8D5DF" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#8A6070', fontSize: 12}} label={{value: 'Date', position: 'insideBottom', offset: -5}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#8A6070', fontSize: 12}} hide />
                      <Tooltip />
                      <Line name="Symptom Intensity" type="monotone" dataKey="intensity" stroke="#DC2626" strokeWidth={2} dot={true} strokeDasharray="5 5" />
                      <Line name="Energy Level" type="monotone" dataKey="energy" stroke="#F59E0B" strokeWidth={2} dot={true} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-center border-2 border-dashed border-storm-border rounded-2xl w-full h-full bg-storm-cream/30">
                    <Sparkles className="text-storm-muted" size={24} />
                    <p className="text-sm text-storm-muted italic max-w-[200px]">Log some symptoms to unlock your personal health patterns.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-center gap-6 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-600 border-dashed border-t border-red-600"></div> Symptom Intensity</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500"></div> Energy</div>
              </div>
            </section>

            {/* Symptom Frequency Chart */}
            <section className="bg-white p-6 rounded-3xl border border-storm-border shadow-sm flex flex-col">
              <h3 className="text-lg font-serif mb-6">Symptom Frequency</h3>
              <div className="h-64 min-h-[256px] w-full min-w-0 flex-1 flex items-center justify-center">
                {frequencyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={frequencyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8D5DF" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8A6070', fontSize: 10}} interval={0} angle={-35} textAnchor="end" height={60} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#8A6070', fontSize: 12}} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6B1A3A" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-6 text-center border-2 border-dashed border-storm-border rounded-2xl w-full h-full bg-storm-cream/30">
                    <Sparkles className="text-storm-muted" size={24} />
                    <p className="text-sm text-storm-muted italic max-w-[200px]">Log some symptoms to unlock your personal health patterns.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {activeTab === 'symptoms' && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-storm-border shadow-sm p-6 lg:p-8"
        >
          <h2 className="text-2xl font-serif text-storm-primary mb-6">Log Daily Symptoms</h2>
          
          <div className="space-y-8 max-w-2xl">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-storm-muted mb-2">Select Date</label>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-storm-border bg-storm-cream/50 focus:outline-none focus:border-storm-primary"
              />
            </div>

            {/* Flow Intensity */}
            <div>
              <label className="block text-sm font-medium text-storm-muted mb-3">Flow Intensity (if any)</label>
              <div className="flex flex-wrap gap-3">
                {['none', 'light', 'medium', 'heavy'].map((flow) => (
                  <button
                    key={flow}
                    onClick={() => {
                      setFlowIntensity(flow);
                      setHasUnsavedChanges(true);
                    }}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${flowIntensity === flow ? 'bg-storm-primary text-white border-storm-primary shadow-md' : 'bg-white border-storm-border text-storm-primary hover:bg-storm-blush'}`}
                  >
                    {flow}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms Selection (Visual Icons) */}
            <div>
              <label className="block text-sm font-medium text-storm-muted mb-3">What are you feeling today?</label>
              <div className="space-y-6">
                {SYMPTOM_CATEGORIES.map(category => (
                  <div key={category.category}>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-storm-muted/70 mb-3">{category.category}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {category.items.map((symptom) => {
                        const isSelected = selectedSymptoms.includes(symptom.id);
                        const Icon = symptom.icon;
                        return (
                          <button
                            key={symptom.id}
                            onClick={() => handleToggleSymptom(symptom.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${isSelected ? 'bg-storm-primary text-white border-storm-primary shadow-md transform scale-[1.02]' : 'bg-white border-storm-border text-storm-primary hover:border-storm-primary hover:bg-storm-blush'}`}
                          >
                            <Icon size={24} strokeWidth={isSelected ? 2.5 : 1.5} />
                            <span className="text-xs font-medium text-center">{symptom.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <label className="block text-sm font-medium text-storm-muted mb-3">Notes</label>
              <textarea 
                value={notes} 
                onChange={(e) => {
                  setNotes(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="w-full h-32 p-3 bg-white rounded-xl border border-storm-border focus:outline-none focus:border-storm-primary"
                placeholder="Add more details about your symptoms or day..."
              />
            </div>

            {/* Save Button (Conditionally appear or animate out) */}
            <AnimatePresence>
              {(hasUnsavedChanges || saveSuccess) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '1.5rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, overflow: 'hidden' }}
                  className="pt-6 border-t border-storm-border flex items-center justify-between"
                >
                  <span className="text-sm text-storm-muted">
                    {saveSuccess ? (
                      <span className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 size={16} /> Saved successfully!
                      </span>
                    ) : 'Unsaved changes... Your data helps improve AI insights.'}
                  </span>
                  <button 
                    onClick={handleSaveLog}
                    disabled={isSaving || !hasUnsavedChanges}
                    className="px-6 py-3 bg-storm-primary text-white rounded-xl font-medium hover:bg-storm-primary/90 transition-all shadow-md disabled:opacity-75 disabled:cursor-wait flex items-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Plus size={18} />
                    )}
                    {isSaving ? 'Saving...' : 'Save Log'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      )}

      {activeTab === 'history' && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-storm-border shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-storm-border">
            <h3 className="text-lg font-serif">Detailed Logs</h3>
          </div>
          <div className="overflow-x-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-storm-muted">No symptoms logged yet.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-storm-cream text-storm-muted uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Flow</th>
                    <th className="px-6 py-4 font-medium">Symptoms Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-storm-border">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-storm-blush transition-colors">
                      <td className="px-6 py-4 font-medium">
                        {log.date?.toDate ? new Date(log.date.toDate()).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 capitalize">{log.flowIntensity || 'None'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {log.symptoms?.length > 0 ? log.symptoms.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-storm-cream rounded-md text-[11px] font-medium text-storm-primary">{s}</span>
                          )) : <span className="text-storm-muted text-xs">None</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.section>
      )}

      {activeTab === 'phases' && (
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-storm-border shadow-sm p-6 lg:p-8"
        >
          <div className="mb-6 border-b border-storm-border pb-6">
            <h3 className="text-lg font-serif">Cycle Phases Overview</h3>
            <p className="text-sm text-storm-muted mt-2">A generalized view of hormonal phases during a typical 28-day cycle.</p>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#FFE4E6]/50 border border-[#FECDD3]">
              <div className="w-24 shrink-0 font-serif font-bold text-[#BE123C] text-lg">Menstrual</div>
              <div>
                <div className="font-medium text-storm-primary text-sm mb-1">Days 1 - 5</div>
                <p className="text-sm text-storm-muted">Estrogen and progesterone drop. Uterine lining sheds. Energy is typically at its lowest and rest is crucial.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#E0E7FF]/50 border border-[#C7D2FE]">
              <div className="w-24 shrink-0 font-serif font-bold text-[#4338CA] text-lg">Follicular</div>
              <div>
                <div className="font-medium text-storm-primary text-sm mb-1">Days 6 - 14</div>
                <p className="text-sm text-storm-muted">Estrogen levels rise. Energy levels increase and mood brightens. Great time for challenging workouts.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#FEF3C7]/50 border border-[#FDE68A]">
              <div className="w-24 shrink-0 font-serif font-bold text-[#B45309] text-lg">Ovulation</div>
              <div>
                <div className="font-medium text-storm-primary text-sm mb-1">Days 15 - 17</div>
                <p className="text-sm text-storm-muted">Estrogen peaks, causing luteinizing hormone surge. Highest fertility, typically peak energy and social confidence.</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#F3E8FF]/50 border border-[#E9D5FF]">
              <div className="w-24 shrink-0 font-serif font-bold text-[#7E22CE] text-lg">Luteal</div>
              <div>
                <div className="font-medium text-storm-primary text-sm mb-1">Days 18 - 28</div>
                <p className="text-sm text-storm-muted">Progesterone rises. Energy begins winding down. PMS symptoms may appear near the end of this phase.</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
