import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { ArrowRight, ArrowLeft, Check, Search } from 'lucide-react';
import StormLoader from '../../components/shared/StormLoader';
import Logo from '../../components/layout/Logo';

const steps = [
  { id: 1, title: 'Account' },
  { id: 2, title: 'Profile' },
  { id: 3, title: 'Cycle' },
  { id: 4, title: 'Consent' }
];

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: '',
    language: 'en',
    lastPeriod: '',
    avgCycle: 28,
    avgPeriod: 5,
    isRegular: 'yes'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      console.log("Saving user data:", {
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        preferredLanguage: formData.language,
        onboardingCompleted: false
      });
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        preferredLanguage: formData.language,
        onboardingCompleted: false,
        createdAt: serverTimestamp()
      });

      // Create private profile
      console.log("Saving private profile:", {
        avgCycleLength: formData.avgCycle,
        avgPeriodLength: formData.avgPeriod,
        lastPeriodDate: formData.lastPeriod ? new Date(formData.lastPeriod) : null,
        cycleRegularity: formData.isRegular
      });
      await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
        avgCycleLength: formData.avgCycle,
        avgPeriodLength: formData.avgPeriod,
        lastPeriodDate: formData.lastPeriod ? new Date(formData.lastPeriod) : null,
        cycleRegularity: formData.isRegular
      });

      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead, or use a different email.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, if not create basic one
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'User',
          email: user.email,
          onboardingCompleted: false,
          createdAt: serverTimestamp()
        });
        // Create initial private profile
        await setDoc(doc(db, 'users', user.uid, 'private', 'profile'), {
          avgCycleLength: 28,
          avgPeriodLength: 5,
        });
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-storm-cream flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-8">
        <Logo size={48} />
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-storm-blush flex">
          {steps.map(step => (
            <div 
              key={step.id} 
              className={`flex-1 transition-all duration-500 ${currentStep >= step.id ? 'bg-storm-primary' : ''}`}
            />
          ))}
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                <h2 className="text-2xl mb-6">Create your account</h2>
                <button 
                  onClick={handleGoogleSignup}
                  className="w-full flex items-center justify-center gap-3 py-3 border border-storm-border rounded-xl hover:bg-storm-cream transition-colors mb-6"
                >
                  <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  Continue with Google
                </button>
                <div className="relative mb-6 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-storm-border"></div></div>
                  <span className="relative px-4 bg-white text-sm text-storm-muted uppercase tracking-wider">or email</span>
                </div>
                <div className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Email address"
                    className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                  <input 
                    type="password" 
                    placeholder="Password"
                    className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                <h2 className="text-2xl mb-6">Basic profile</h2>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Full name"
                    className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <div>
                    <label className="text-sm text-storm-muted ml-2 mb-1 block">Date of birth</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>
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
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div 
                key="step3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                <h2 className="text-2xl mb-6">Cycle history</h2>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-storm-muted ml-2 mb-1 block">Last period start date</label>
                    <input 
                      type="date" 
                      className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
                      value={formData.lastPeriod}
                      onChange={e => setFormData({...formData, lastPeriod: e.target.value})}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                    <label className="text-storm-muted ml-2">Average cycle length</label>
                    <span className="font-medium text-storm-primary">{formData.avgCycle} days</span>
                    </div>
                    <input 
                      type="range" min="21" max="45"
                      className="w-full accent-storm-primary"
                      value={formData.avgCycle}
                      onChange={e => setFormData({...formData, avgCycle: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-storm-muted ml-2 mb-2 block">Are your cycles regular?</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['yes', 'somewhat', 'no'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => setFormData({...formData, isRegular: opt})}
                          className={`py-2 rounded-lg border flex items-center justify-center capitalize transition-colors ${formData.isRegular === opt ? 'bg-storm-primary border-storm-primary text-white' : 'border-storm-border text-storm-muted'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div 
                key="step4"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
              >
                <h2 className="text-2xl mb-6">Privacy & Consent</h2>
                <div className="p-4 bg-storm-cream rounded-xl text-sm leading-relaxed text-storm-muted mb-6">
                  StormCycle collects and analyzes your health data to provide personalized cycle predictions and PCOD screening. Your data is encrypted and protected under the DPDP Act 2023. You can request deletion of your data at any time.
                </div>
                <div className="space-y-4">
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input type="checkbox" className="mt-1 accent-storm-primary" required />
                    <span className="text-sm text-storm-text">I consent to StormCycle collection my health data for predictions.</span>
                  </label>
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input type="checkbox" className="mt-1 accent-storm-primary" required />
                    <span className="text-sm text-storm-text">I agree to the Terms of Service and Privacy Policy.</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <div className="mt-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

          <div className="mt-12 flex justify-between gap-4">
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-4 border border-storm-border text-storm-muted rounded-2xl flex items-center justify-center gap-2 hover:bg-storm-cream disabled:opacity-50"
              >
                <ArrowLeft size={20} /> Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                onClick={handleNext}
                className="flex-1 py-4 bg-storm-primary text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-storm-secondary transition-all"
              >
                Next <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 py-4 bg-storm-primary text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-storm-secondary transition-all disabled:opacity-50 shadow-lg font-medium"
              >
                {loading ? (
                  <>
                    <StormLoader size="sm" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    Create Account <Check size={20} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-storm-muted">
        Already have an account? <Link to="/login" className="text-storm-primary font-medium hover:underline">Log in</Link>
      </p>
    </div>
  );
}
