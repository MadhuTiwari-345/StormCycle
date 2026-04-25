import React, { useState } from 'react';
import { motion, Variants } from 'motion/react';
import { 
  CalendarX, ShieldOff, AlertTriangle, ArrowRight, 
  CheckCircle2, Globe, FileText, Bot, Lock,
  Sparkles, Heart, Activity, Waves, Microscope, ShieldCheck,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../../components/layout/Logo';
import LanguageSwitcher from '../../components/layout/LanguageSwitcher';

const navItems = ["Features", "Science", "Privacy", "FAQ"];

export default function LandingPage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-storm-cream overflow-x-hidden selection:bg-storm-blush selection:text-storm-primary">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-storm-cream/80 backdrop-blur-md border-b border-storm-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/">
            <Logo size={40} />
          </Link>
          
          <div className="hidden md:flex items-center gap-10">
            {navItems.map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-storm-muted hover:text-storm-primary transition-colors tracking-wide">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <Link to="/login" className="text-sm font-medium text-storm-muted hover:text-storm-primary transition-colors">Log in</Link>
            <Link to="/signup" className="px-6 py-2.5 bg-storm-primary text-white text-sm font-medium rounded-full hover:bg-storm-secondary transition-all shadow-md shadow-storm-primary/10 hover:shadow-lg">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-28 px-6 overflow-hidden">
        {/* Abstract shapes for woman-centric feel */}
        <div className="absolute top-1/4 right-[-10%] w-[500px] h-[500px] bg-storm-blush/40 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-1/4 left-[-5%] w-[400px] h-[400px] bg-storm-secondary/5 rounded-full blur-[80px] -z-10" />
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-storm-blush text-storm-primary rounded-full text-xs font-semibold tracking-widest uppercase mb-8 border border-storm-primary/5">
              <Sparkles size={14} /> TEAM SHESTORM · FEMTECH × HEALTHTECH × AI
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-6xl md:text-[84px] font-serif text-storm-text leading-[1.05] mb-8">
              Your cycle is <span className="italic font-normal text-storm-secondary">unique.</span><br />
              Own your <span className="relative">
                flow
                <motion.svg 
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 100 20"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                >
                  <path d="M0,10 Q25,0 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" />
                </motion.svg>
              </span>.
            </motion.h1>

            <motion.p variants={itemVariants} className="text-xl md:text-2xl text-storm-muted mb-12 max-w-xl leading-relaxed font-light">
              We've moved beyond the "average" cycle. Experience clinical-grade tracking and PCOD screening designed for every body.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-6">
              <Link 
                to="/signup" 
                className="w-full sm:w-auto px-10 py-5 bg-storm-primary text-white text-lg font-medium rounded-full hover:bg-storm-secondary transition-all transform hover:translate-y-[-2px] shadow-xl shadow-storm-primary/20 flex items-center justify-center gap-3"
              >
                Join STORMCYCLE <ArrowRight size={22} strokeWidth={1.5} />
              </Link>
              <a href="#science" className="text-storm-primary font-medium hover:underline underline-offset-8 transition-all">
                The Science Behind It
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            <div className="relative z-10 bg-white rounded-[40px] p-8 shadow-2xl border border-storm-border/50 max-w-md mx-auto transform rotate-2">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-storm-blush flex items-center justify-center text-storm-primary">
                      <Heart size={20} fill="currentColor" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Health Score</div>
                      <div className="text-xs text-storm-muted">Daily Insight</div>
                    </div>
                  </div>
                  <div className="text-2xl font-serif text-storm-primary">84%</div>
               </div>
               
               <div className="space-y-6">
                  <div className="h-32 bg-storm-blush/20 rounded-2xl flex items-end gap-2 p-4">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: 1.5 + (i * 0.1), duration: 1 }}
                        className="flex-1 bg-storm-primary/20 rounded-t-lg"
                      />
                    ))}
                  </div>
                  <div className="p-4 bg-storm-cream rounded-2xl border border-storm-border/30">
                    <div className="text-xs font-semibold text-storm-primary uppercase tracking-widest mb-1">Today's Focus</div>
                    <div className="text-sm font-medium">Predicted cycle start in 3 days. Your energy levels may peak.</div>
                  </div>
               </div>
            </div>
            
            {/* Decals */}
            <div className="absolute top-1/2 -left-12 bg-storm-secondary text-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 animate-bounce shadow-storm-secondary/20">
               <Activity size={20} />
               <span className="text-sm font-medium">Anomaly Detected</span>
            </div>
            
            <div className="absolute -bottom-8 -right-4 bg-white p-6 rounded-2xl shadow-xl z-20 border border-storm-border">
               <div className="text-xs font-bold text-storm-muted mb-2">PCOD Risk Analysis</div>
               <div className="flex gap-1">
                 {[1, 2, 3, 4, 5].map(i => (
                   <div key={i} className={`w-6 h-2 rounded-full ${i <= 1 ? 'bg-storm-success' : 'bg-gray-100'}`} />
                 ))}
               </div>
               <div className="text-[10px] mt-2 font-medium text-storm-success uppercase tracking-wider">Low Probability</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6 bg-storm-cream/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">Why existing apps fail women</h2>
            <p className="text-storm-muted max-w-2xl mx-auto font-light leading-relaxed">
              5–10% of women globally have PCOS — yet most apps are designed for the 16% with a textbook 28-day cycle.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CalendarX,
                title: "The Average Cycle Fallacy",
                desc: "54% of fertility apps use calendar dates only — leading to errors of up to 8 days for irregular cycles.",
                stat: "54%",
                statDesc: "of apps fail"
              },
              {
                icon: ShieldOff,
                title: "No Disorder Detection",
                desc: "Most trackers don't flag PCOD risk indicators like long gaps, skipped cycles, or androgenic signs.",
                stat: "0",
                statDesc: "early warnings"
              },
              {
                icon: AlertTriangle,
                title: "False Positives Harm Users",
                desc: "Flo's PCOS tool flagged 38% of users — but actual prevalence is only 4.6–8% globally.",
                stat: "38%",
                statDesc: "false positives"
              }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-sm border border-storm-border/50 relative overflow-hidden group border-l-4 border-l-storm-primary"
              >
                <div className="w-12 h-12 rounded-2xl bg-storm-blush flex items-center justify-center text-storm-primary mb-6">
                  <card.icon size={24} />
                </div>
                <h3 className="text-xl font-serif mb-4">{card.title}</h3>
                <p className="text-storm-muted text-sm leading-relaxed mb-8">{card.desc}</p>
                <div className="pt-6 border-t border-storm-border/50 flex items-baseline gap-2">
                  <span className="text-3xl font-serif text-storm-primary">{card.stat}</span>
                  <span className="text-xs text-storm-muted uppercase tracking-wider">{card.statDesc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section id="science" className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-20">
          <div className="md:w-1/3">
            <div className="text-storm-secondary font-bold uppercase tracking-widest text-xs mb-6">Our Solution</div>
            <h2 className="text-5xl md:text-6xl font-serif mb-8 leading-tight">Personalized, <br/><span className="italic font-normal">not average.</span></h2>
            <p className="text-storm-muted mb-12 leading-relaxed font-light">
              StormCycle is built for the women textbook trackers ignore — irregular cycles, PCOD risk, real lives. Every feature is grounded in clinical evidence and your own history.
            </p>
            
            <Link to="/signup" className="group inline-flex items-center gap-4 p-4 pr-6 rounded-2xl bg-storm-cream border border-storm-border hover:border-storm-primary transition-all">
              <div className="w-12 h-12 rounded-xl bg-storm-primary text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRight size={20} className="-rotate-45" />
              </div>
              <div>
                <div className="text-sm font-bold">Built by Team SheStorm</div>
                <div className="text-[10px] text-storm-muted uppercase tracking-wide">Femtech research + AI/ML expertise + clinical advisory</div>
              </div>
            </Link>
          </div>

          <div className="md:w-2/3 grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Microscope,
                title: "Irregular Cycle Prediction",
                desc: "LSTM model trained on real cycles 26–50+ days. 91.3% accuracy.",
                tag: "91.3% Accuracy"
              },
              {
                icon: Activity,
                title: "PCOD Risk Scoring",
                desc: "Bayesian adaptive screener — only flags when clinical indicators add up.",
                tag: "Adaptive · Clinical"
              },
              {
                icon: Bot,
                title: "AI Health Chatbot",
                desc: "RAG-powered guidance with human-in-the-loop for high-risk flags.",
                tag: "ACOG · NHS · NIH Sourced"
              },
              {
                icon: FileText,
                title: "Doctor Report PDF",
                desc: "Structured clinical export you can share with your gynecologist.",
                tag: "One-Click Share"
              },
              {
                icon: Lock,
                title: "Privacy-First",
                desc: "AES-256 encryption, zero-knowledge analytics, DPDP Act 2023 compliant.",
                tag: "ISO 13485 · CDSCO"
              },
              {
                icon: Globe,
                title: "Multi-Language",
                desc: "Hindi, Tamil, Bengali & English — for every woman.",
                tag: "One India - Multilingual"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-storm-border shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-xl bg-storm-blush flex items-center justify-center text-storm-primary mb-6 group-hover:bg-storm-primary group-hover:text-white transition-colors">
                  <feature.icon size={20} />
                </div>
                <h4 className="text-xl font-serif mb-3">{feature.title}</h4>
                <p className="text-sm text-storm-muted leading-relaxed mb-6">{feature.desc}</p>
                <div className="text-[10px] font-black text-storm-secondary uppercase tracking-[0.2em]">{feature.tag}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Section Highlights */}
      <section id="features" className="py-20 px-6 bg-storm-cream border-y border-storm-border">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center">
             <div className="text-storm-secondary font-bold uppercase tracking-widest text-[10px] mb-4">Deep Dive</div>
             <h2 className="text-4xl md:text-6xl font-serif mb-4">PCOD Screening that <br className="hidden md:block"/><span className="italic font-normal">listens to your body.</span></h2>
             <p className="text-storm-muted max-w-2xl mx-auto font-light leading-relaxed">
               More than a static questionnaire.
             </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
               <p className="text-lg text-storm-muted mb-10 leading-relaxed font-light">
                 Our Bayesian adaptive engine goes beyond simple checklists. It analyzes patterns in your cycle, metabolic indicators, and symptomatic signs to provide a medical-grade risk assessment.
               </p>
               <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-storm-success" size={20} />
                    <span className="text-sm font-medium">Androgen Sign Logic</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-storm-success" size={20} />
                    <span className="text-sm font-medium">Cycle Variability Analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-storm-success" size={20} />
                    <span className="text-sm font-medium">PDF Doctor's Reports</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-storm-success" size={20} />
                    <span className="text-sm font-medium">Metabolic Data Sync</span>
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2 bg-white p-4 rounded-[40px] shadow-2xl border border-storm-border">
               <div className="bg-storm-cream rounded-[32px] p-10 h-80 flex flex-col justify-center items-center text-center">
                  <Activity className="text-storm-primary mb-6 animate-pulse" size={64} strokeWidth={1} />
                  <div className="text-2xl font-serif mb-2">Analyzing Patterns...</div>
                  <div className="text-storm-muted text-sm max-w-xs mx-auto">Evaluating cycle regularity against past 7 months of data</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Proof Section */}
      <section className="py-24 px-6 bg-storm-primary text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 text-[10px] uppercase tracking-widest font-bold mb-8"
            >
              <Activity size={12} /> Market Opportunity
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-serif mb-8 max-w-4xl mx-auto leading-[1.1]">
              A $13 billion market <br/><span className="italic">that's just getting started.</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto font-light leading-relaxed">
              India women-led tech: <span className="text-white font-medium">$1.1B raised in 2025</span> · median deal up from $2.4M to $3.8M.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { year: "2024", val: "1.69", label: "Global femtech market" },
              { year: "2030", val: "5.07", label: "Projected at ~20% CAGR" },
              { year: "2035", val: "13.11", label: "Extended forecast" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 p-10 rounded-[32px] relative overflow-hidden"
              >
                <div className="text-xs uppercase tracking-widest text-white/40 mb-8 font-bold">{stat.year}</div>
                <div className="flex items-baseline gap-1 mb-4 text-white">
                  <span className="text-3xl font-light">$</span>
                  <span className="text-6xl lg:text-7xl font-serif">{stat.val}B</span>
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
                {i < 2 && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-px bg-white/10 hidden lg:block" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Compliance Section */}
      <section id="privacy" className="py-20 px-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-storm-secondary font-bold uppercase tracking-[0.3em] text-[10px] mb-6"
          >
            Privacy & Compliance
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-serif mb-12">Your health data stays yours. <br/><span className="italic font-normal">Always.</span></h2>
          
          <div className="flex flex-wrap justify-center gap-4 mb-20">
            {[
              { label: "DPDP Act 2023", sub: "Data Principal rights" },
              { label: "AES-256", sub: "Encryption at rest" },
              { label: "ISO 13485", sub: "Quality management" },
              { label: "CDSCO SaMD", sub: "Class B medical software" }
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-storm-border bg-storm-cream/30">
                <div className="w-2 h-2 rounded-full bg-storm-success" />
                <span className="text-sm font-bold text-storm-primary">{badge.label}</span>
                <span className="text-[10px] text-storm-muted uppercase tracking-wide">{badge.sub}</span>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
            {[
              {
                icon: ShieldCheck,
                title: "Medical-grade encryption",
                desc: "AES-256 at rest, TLS 1.3 in transit. Sensitive fields like symptoms and chats are individually encrypted."
              },
              {
                icon: Microscope,
                title: "Zero-knowledge analytics",
                desc: "We use zk-SNARKs to learn patterns without ever seeing your raw data."
              },
              {
                icon: FileText,
                title: "Plain-language consent",
                desc: "Every permission asked in clear language. Right to erasure is automated on withdrawal."
              },
              {
                icon: Lock,
                title: "Tamper-proof audit log",
                desc: "Blockchain-anchored consent ledger so you can always verify what you allowed."
              }
            ].map((info, i) => (
              <div key={i} className="p-8 rounded-3xl border border-storm-border flex gap-6">
                <div className="w-12 h-12 rounded-2xl bg-storm-blush flex-shrink-0 flex items-center justify-center text-storm-primary">
                  <info.icon size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-serif mb-3">{info.title}</h4>
                  <p className="text-sm text-storm-muted leading-relaxed font-light">{info.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-storm-cream/30 border-y border-storm-border">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="text-storm-secondary font-bold uppercase tracking-widest text-[10px] mb-4">Pricing</div>
          <h2 className="text-4xl md:text-6xl font-serif mb-6">One platform, three <br/>ways to access.</h2>
          <p className="text-storm-muted max-w-2xl mx-auto font-light">Free for everyone. Premium for serious health tracking. B2B for workplaces that care.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free */}
          <div className="bg-white p-10 rounded-[32px] border border-storm-border flex flex-col">
            <h3 className="text-2xl font-serif mb-2">Free</h3>
            <p className="text-sm text-storm-muted mb-8 italic">Start tracking your cycle with the basics.</p>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-serif text-storm-primary">₹0</span>
              <span className="text-storm-muted text-sm italic">forever</span>
            </div>
            <ul className="space-y-4 mb-12 flex-1">
              {["Basic cycle tracking", "Calendar predictions", "3 months history", "Symptom logging"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-storm-success" /> {item}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="w-full py-4 bg-storm-primary text-white rounded-2xl text-center font-bold hover:bg-storm-secondary transition-colors">Start free</Link>
          </div>

          {/* Premium */}
          <div className="bg-storm-primary text-white p-10 rounded-[32px] shadow-2xl scale-105 relative z-10 flex flex-col">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-storm-blush text-storm-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-storm-primary/20">Most Popular</div>
            <h3 className="text-2xl font-serif mb-2">Premium</h3>
            <p className="text-sm text-white/60 mb-8 italic">Full AI-powered health insights for irregular cycles.</p>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-serif">₹99</span>
              <span className="text-white/60 text-sm italic font-light">per month</span>
            </div>
            <ul className="space-y-4 mb-12 flex-1 text-white/90">
              {["LSTM AI cycle prediction", "PCOD Bayesian screener", "AI health chatbot (RAG)", "Doctor PDF reports", "Unlimited history", "Multi-language support", "Priority support"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-storm-blush" /> {item}
                </li>
              ))}
            </ul>
            <Link to="/signup" className="w-full py-4 bg-white text-storm-primary rounded-2xl text-center font-bold hover:bg-storm-cream transition-colors">Start 14-day trial</Link>
          </div>

          {/* Business */}
          <div className="bg-white p-10 rounded-[32px] border border-storm-border flex flex-col">
            <h3 className="text-2xl font-serif mb-2">B2B Wellness</h3>
            <p className="text-sm text-storm-muted mb-8 italic">Corporate wellness program with anonymous analytics.</p>
            <div className="flex items-baseline gap-2 mb-10">
              <span className="text-5xl font-serif text-storm-primary">₹49</span>
              <span className="text-storm-muted text-sm italic font-light">per employee / mo</span>
            </div>
            <ul className="space-y-4 mb-12 flex-1">
              {["Everything in Premium", "HR dashboard", "Anonymous cohort analytics", "White-label option", "Dedicated CSM"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-storm-success" /> {item}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 bg-storm-primary text-white rounded-2xl text-center font-bold hover:bg-storm-secondary transition-colors">Talk to sales</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 bg-white relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif mb-4">Frequently Asked Questions</h2>
            <p className="text-storm-muted">Everything you need to know about StormCycle.</p>
          </div>
          
          <div className="space-y-6">
            {[
              {
                q: "How accurate are the predictions?",
                a: "StormCycle uses advanced LSTM (Long Short-Term Memory) neural networks trained on clinical data. While standard apps use averages, we adapt to your unique cycle irregularities, achieving high precision over time."
              },
              {
                q: "Is my personal data safe?",
                a: "Security is our foundation. We use AES-256 encryption and strictly follow data privacy laws like the DPDP Act 2023. We never sell your health data to third parties."
              },
              {
                q: "What is the PCOD Screening tool?",
                a: "It's a Bayesian-based risk assessment tool developed following clinical guidelines. It evaluates symptoms like hirsutism, acne, and cycle variability to provide a preliminary risk score you can discuss with a doctor."
              },
              {
                q: "Can I use StormCycle in my language?",
                a: "Yes! We support multiple Indian languages including Hindi, Marathi, and Tamil, alongside English, ensuring health intelligence is accessible to everyone."
              },
              {
                q: "How does your app handle users who log data inconsistently or forget to log for months?",
                a: "This is a real product challenge and we've addressed it at the model level. The LSTM is trained to handle sparse input sequences — gaps in the data are modeled as a feature, not a flaw. If a user has a large logging gap, the model widens its confidence interval and flags the prediction as lower confidence. In the UI, this is communicated transparently: we show a confidence range like '±4 days' instead of '±2 days' when data is sparse. We also send gentle reminder notifications when the app detects that a period should have started based on prediction but no log has been submitted — which prompts re-engagement without being intrusive."
              },
              {
                q: "What happens if the ML service is down? Does the app break?",
                a: "No. We've architected this with graceful degradation. The MVP uses a rolling average calculation for cycle prediction that runs entirely within the Next.js API layer — no ML service dependency. The LSTM model in our ML service is an enhancement layer. If it's unavailable, the app falls back to the rolling average prediction and informs the user transparently. For the PCOD screener, the Bayesian scoring logic is implemented in TypeScript within our main app — it doesn't depend on an external service at all. So the core product is resilient even if the ML service has downtime."
              }
            ].map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-storm-cream border border-storm-border/50"
              >
                <h4 className="text-lg font-bold text-storm-text mb-3">{faq.q}</h4>
                <p className="text-storm-muted text-sm leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-storm-cream text-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <Logo size={80} showText={false} className="mx-auto mb-8" />
          <h2 className="text-4xl md:text-6xl font-serif mb-12">Start your journey toward <br/><span className="italic">conscious health.</span></h2>
          <Link 
            to="/signup" 
            className="inline-flex items-center gap-3 px-12 py-5 bg-storm-primary text-white text-xl font-medium rounded-full hover:bg-storm-secondary transition-all hover:scale-105 shadow-2xl shadow-storm-primary/30"
          >
            Get Started for Free <ArrowRight size={24} />
          </Link>
          <p className="mt-8 text-storm-muted text-sm italic font-light">No credit card required. Free forever for clinical tracking.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-storm-cream border-t border-storm-border px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Logo size={48} />
              </div>
              <p className="text-storm-muted max-w-sm leading-relaxed mb-8 font-light italic">
                AI-powered menstrual health tracking for every woman's unique cycle.
              </p>
              <div className="text-[10px] text-storm-muted uppercase tracking-[0.3em] font-black">
                Team SheStorm · Madhu Tiwari
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.3em] mb-8 text-storm-primary">Product</h4>
              <ul className="space-y-4 text-storm-muted text-sm font-light">
                <li><a href="#science" className="hover:text-storm-primary transition-colors">Cycle Tracker</a></li>
                <li><a href="#features" className="hover:text-storm-primary transition-colors">PCOD Screener</a></li>
                <li><a href="#ai" className="hover:text-storm-primary transition-colors">AI Chatbot</a></li>
                <li><a href="#reports" className="hover:text-storm-primary transition-colors">Doctor Reports</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.3em] mb-8 text-storm-primary">Company</h4>
              <ul className="space-y-4 text-storm-muted text-sm font-light">
                <li><a href="#" className="hover:text-storm-primary transition-colors">About SheStorm</a></li>
                <li><a href="#" className="hover:text-storm-primary transition-colors">Research</a></li>
                <li><a href="#" className="hover:text-storm-primary transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-storm-primary transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-[0.3em] mb-8 text-storm-primary">Legal</h4>
              <ul className="space-y-4 text-storm-muted text-sm font-light">
                <li><a href="#" className="hover:text-storm-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-storm-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-storm-primary transition-colors">DPDP Act 2023</a></li>
                <li><button onClick={() => setShowDisclaimer(true)} className="hover:text-storm-primary text-storm-secondary transition-colors font-medium">Medical Disclaimer</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-storm-border/50 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] text-storm-muted uppercase tracking-widest">© 2026 © 2026 SheStorm. All rights reserved.</div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              {["EN", "HI", "TA", "BN"].map(lang => (
                <span key={lang} className="text-[10px] font-black text-storm-muted hover:text-storm-primary cursor-pointer transition-colors tracking-tighter">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Medical Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-storm-text/20 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 max-w-2xl w-full border border-storm-border shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button 
              onClick={() => setShowDisclaimer(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-storm-cream text-storm-muted hover:text-storm-primary hover:bg-storm-blush transition-colors"
            >
              <X size={20} />
            </button>
            <div className="mb-6 flex gap-4 items-start">
              <div className="w-12 h-12 rounded-2xl bg-storm-blush flex items-center justify-center text-storm-secondary shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-serif mb-2">Medical Disclaimer</h3>
                <div className="text-[10px] text-storm-muted uppercase tracking-widest font-black">Please read carefully</div>
              </div>
            </div>
            
            <div className="prose prose-sm prose-p:text-storm-muted prose-p:leading-relaxed prose-headings:font-serif prose-headings:text-storm-text max-w-none">
              <p>
                The content and tools provided by StormCycle (including but not limited to cycle predictions, PCOD risk screening, AI chatbot responses, and Doctor PDF reports) are for informational and educational purposes only. <strong>StormCycle is NOT a diagnostic tool and does not replace professional medical advice, diagnosis, or treatment.</strong>
              </p>
              
              <h4 className="text-sm font-bold uppercase tracking-widest mt-6 mb-2">1. No Medical Advice</h4>
              <p>
                The AI health insights and adaptive screening scores generated by our platform are based on statistical models and user-input data. They are designed to help you track symptoms and facilitate conversations with your healthcare provider. Never disregard professional medical advice or delay in seeking it because of information provided by StormCycle.
              </p>

              <h4 className="text-sm font-bold uppercase tracking-widest mt-6 mb-2">2. Emergency Situations</h4>
              <p>
                If you think you may have a medical emergency, call your doctor or local emergency number immediately. StormCycle is not designed for urgent care scenarios.
              </p>

              <h4 className="text-sm font-bold uppercase tracking-widest mt-6 mb-2">3. Accuracy & Variability</h4>
              <p>
                While our LSTM models and Bayesian screeners are trained on clinical datasets, human physiology is highly variable. Unpredictable factors (stress, lifestyle, medication) affect menstrual health. Predictions and risk scores may not be completely accurate.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-storm-border flex justify-end">
              <button 
                onClick={() => setShowDisclaimer(false)}
                className="px-6 py-3 bg-storm-primary text-white rounded-xl font-bold hover:bg-storm-secondary transition-colors"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
