import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { LogIn } from 'lucide-react';
import StormLoader from '../../components/shared/StormLoader';
import Logo from '../../components/layout/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-storm-cream flex flex-col items-center justify-center p-4">
      <Link to="/" className="mb-8">
        <Logo size={48} />
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl"
      >
        <h2 className="text-2xl mb-6">Welcome back</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email"
            placeholder="Email address"
            className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            type="password"
            placeholder="Password"
            className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password"
            required
            className="w-full p-4 bg-storm-cream border-none rounded-xl focus:ring-2 focus:ring-storm-primary outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-storm-primary text-white rounded-2xl flex items-center justify-center gap-3 hover:bg-storm-secondary transition-all shadow-lg font-medium"
          >
            {loading ? (
              <>
                <StormLoader size="sm" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                Log in <LogIn size={20} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-storm-muted">
          Don't have an account? <Link to="/signup" className="text-storm-primary font-medium hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
