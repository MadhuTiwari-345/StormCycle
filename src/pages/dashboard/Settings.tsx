import { useState, useEffect } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { User, Globe, Bell, Lock, Trash2, Download, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || '',
    language: 'en',
    cycleReminders: true,
    pcodRiskAlerts: true,
    lastPeriodDate: '',
    avgCycleLength: 28
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchProfile = async () => {
      const userRef = doc(db, 'users', auth.currentUser!.uid, 'private', 'profile');
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setFormData(prev => ({
          ...prev,
          cycleReminders: data.cycleReminders !== false,
          pcodRiskAlerts: data.pcodRiskAlerts !== false,
          lastPeriodDate: data.lastPeriodDate?.toDate ? format(data.lastPeriodDate.toDate(), 'yyyy-MM-dd') : (data.lastPeriodDate ? format(new Date(data.lastPeriodDate), 'yyyy-MM-dd') : ''),
          avgCycleLength: data.avgCycleLength || 28,
        }));
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const updateData: any = {
          preferredLanguage: formData.language
        };
        if (formData.name && formData.name.trim().length > 0) {
          updateData.name = formData.name.trim();
        }
        console.log("About to setDoc (merge) users...", updateData);
        await setDoc(userRef, updateData, { merge: true });
        console.log("setDoc users successful.");

        // Save preferences to private profile
        const profileRef = doc(db, 'users', auth.currentUser.uid, 'private', 'profile');
        const profileUpdateData = {
          cycleReminders: formData.cycleReminders,
          pcodRiskAlerts: formData.pcodRiskAlerts,
          lastPeriodDate: formData.lastPeriodDate ? new Date(formData.lastPeriodDate) : null,
          avgCycleLength: formData.avgCycleLength
        };
        console.log("About to setDoc private/profile...", profileUpdateData);
        await setDoc(profileRef, profileUpdateData, { merge: true });
        console.log("setDoc private/profile successful.");

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      console.error("FIREBASE ERROR:", err, err.message, err.code);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-serif text-storm-text mb-2">Settings</h1>
        <p className="text-storm-muted">Manage your account, privacy, and preferences.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id ? 'bg-storm-primary text-white shadow-md' : 'text-storm-muted hover:bg-storm-blush hover:text-storm-primary'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </aside>

        <section className="flex-1 bg-white p-8 rounded-[2rem] border border-storm-border shadow-sm">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-serif mb-6">Profile Settings</h2>
                
                <div className="flex items-center gap-6 mb-8 p-4 bg-storm-cream rounded-2xl">
                  <div className="w-20 h-20 rounded-full bg-storm-primary flex items-center justify-center text-white text-3xl font-serif font-bold">
                    {formData.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-storm-text">{formData.name}</div>
                    <div className="text-sm text-storm-muted">{auth.currentUser?.email}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-storm-muted">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-storm-muted">Email Address</label>
                    <input 
                      type="email" 
                      disabled
                      className="w-full p-4 bg-storm-cream/50 border-none rounded-xl text-storm-muted cursor-not-allowed"
                      value={auth.currentUser?.email || ''}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <h2 className="text-xl font-serif mb-6">Application Preferences</h2>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                     <h3 className="text-lg font-serif">Cycle Details</h3>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-storm-muted">Last Period Date</label>
                        <input 
                          type="date" 
                          className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                          value={formData.lastPeriodDate}
                          onChange={e => setFormData({...formData, lastPeriodDate: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-storm-muted">Average Cycle Length (Days)</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                          value={formData.avgCycleLength}
                          onChange={e => setFormData({...formData, avgCycleLength: parseInt(e.target.value) || 28})}
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-storm-muted flex items-center gap-2">
                      <Globe size={16} /> Preferred Language
                    </label>
                    <select 
                      className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                      value={formData.language}
                      onChange={e => setFormData({...formData, language: e.target.value})}
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-storm-cream rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-storm-blush flex items-center justify-center text-storm-primary">
                          <Bell size={20} />
                        </div>
                        <div>
                          <div className="font-medium">Cycle Reminders</div>
                          <div className="text-xs text-storm-muted">Daily reminders and predictions</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, cycleReminders: !formData.cycleReminders})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.cycleReminders ? 'bg-storm-primary' : 'bg-storm-border'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.cycleReminders ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-storm-cream rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-storm-blush flex items-center justify-center text-storm-primary">
                          <Bell size={20} />
                        </div>
                        <div>
                          <div className="font-medium">PCOD Risk Alerts</div>
                          <div className="text-xs text-storm-muted">Notifications for concerning symptoms</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, pcodRiskAlerts: !formData.pcodRiskAlerts})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.pcodRiskAlerts ? 'bg-storm-primary' : 'bg-storm-border'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.pcodRiskAlerts ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                <h2 className="text-xl font-serif mb-6">Data & Privacy</h2>
                
                <div className="p-4 bg-storm-blush rounded-2xl border border-storm-primary/20 text-sm text-storm-primary leading-relaxed">
                  Your data is protected under the <strong>DPDP Act 2023</strong>. You have the right to access, rectify, and delete your data at any time.
                </div>

                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-storm-cream rounded-2xl hover:bg-storm-blush transition-colors group text-left">
                    <div className="flex items-center gap-3">
                      <Download size={20} className="text-storm-muted group-hover:text-storm-primary" />
                      <div>
                        <div className="font-medium">Export My Data</div>
                        <div className="text-xs text-storm-muted">Download all logs and screenings in JSON</div>
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 border border-red-100 rounded-2xl hover:bg-red-50 transition-colors group text-left">
                    <div className="flex items-center gap-3">
                      <Trash2 size={20} className="text-red-400 group-hover:text-red-600" />
                      <div>
                        <div className="font-medium text-red-600">Delete Account</div>
                        <div className="text-xs text-red-400">Permanently remove all health data</div>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-storm-cream flex items-center justify-between">
            {saved && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-storm-success font-medium text-sm"
              >
                <CheckCircle2 size={16} /> All changes saved
              </motion.div>
            )}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="ml-auto px-8 py-3 bg-storm-primary text-white rounded-xl font-medium hover:bg-storm-secondary transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'} <Save size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
