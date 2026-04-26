import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, ArrowLeft, CheckCircle2, Shield, AlertCircle, 
  ChevronRight, Info, Scale, Weight, Ruler, Activity, FileText, Bot
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import StormLoader from '../../components/shared/StormLoader';

const questions = [
  {
    id: 'bmi',
    title: 'Body Metrics',
    subtitle: 'Height and weight help us calculate your BMI',
    fields: [
      { id: 'height', label: 'Height (cm)', type: 'number', min: 100, max: 250, default: 160, icon: Ruler },
      { id: 'weight', label: 'Weight (kg)', type: 'number', min: 30, max: 200, default: 60, icon: Weight }
    ]
  },
  {
    id: 'cycle',
    title: 'Cycle Regularity',
    subtitle: 'Menstrual patterns are key PCOD indicators',
    fields: [
      { 
        id: 'regularity', 
        label: 'Are your cycles regular?', 
        type: 'select', 
        options: [
          { label: 'Regular (21-35 days)', value: 'regular' },
          { label: 'Irregular (often late/early)', value: 'irregular' },
          { label: 'Very Irregular (skip months)', value: 'very_irregular' }
        ]
      },
      { id: 'menarche', label: 'Age at first period', type: 'number', min: 8, max: 20, default: 13 }
    ]
  },
  {
    id: 'symptoms',
    title: 'Physical Signs',
    subtitle: 'Presence of androgenic symptoms',
    fields: [
      { 
        id: 'acne', 
        label: 'Acne severity & type', 
        type: 'select', 
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild (Face)', value: 1 },
          { label: 'Moderate (Face, back)', value: 2 },
          { label: 'Significant/Cystic (Face, chest, back)', value: 3 }
        ]
      },
      { 
        id: 'hirsutism', 
        label: 'Excess hair severity/areas', 
        type: 'select', 
        options: [
          { label: 'None', value: 0 },
          { label: 'Mild (Upper lip)', value: 1 },
          { label: 'Moderate (Upper lip, chin)', value: 2 },
          { label: 'Significant (Face, chest, back)', value: 3 }
        ]
      }
    ]
  },
  {
    id: 'family',
    title: 'Family History',
    subtitle: 'Genetic factors in hormonal health',
    fields: [
      { 
        id: 'family_history', 
        label: 'Does any close female relative have PCOS/PCOD?', 
        type: 'radio', 
        options: [{label: 'Yes', value: true}, {label: 'No', value: false}, {label: 'Unsure', value: 'unsure'}]
      }
    ]
  }
];

export default function PCODScreener() {
  const [stage, setStage] = useState<'info' | 'screening' | 'results'>('info');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({
    height: 160,
    weight: 60,
    menarche: 13,
    regularity: 'regular',
    acne: 0,
    hirsutism: 0,
    family_history: false
  });
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculateBMI = () => {
    const h = answers.height / 100;
    return (answers.weight / (h * h)).toFixed(1);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitScreening();
    }
  };

  const submitScreening = async () => {
    setLoading(true);
    
    // Updated weighted algorithm based on medical criteria
    let score = 0;
    // Regularity: heavier weight
    if (answers.regularity === 'irregular') score += 20;
    if (answers.regularity === 'very_irregular') score += 35;
    
    // Physical signs: androgenic markers
    score += (answers.acne * 5); // 0, 5, 10, 15
    score += (answers.hirsutism * 7); // 0, 7, 14, 21
    
    // Family history: heavier weight
    if (answers.family_history === true) score += 15;
    
    // Metabolic
    const bmi = parseFloat(calculateBMI());
    if (bmi > 25) score += 10;
    if (bmi > 30) score += 15;
    
    // Menarche
    if (answers.menarche < 12) score += 5;

    // Adjusted thresholds: low < 30, moderate < 60, high >= 60
    const riskLevel = score < 30 ? 'low' : score < 60 ? 'moderate' : 'high';
    const bmiStatus = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    
    // Collect risks for the report
    const risks: string[] = [];
    if (answers.regularity !== 'regular') risks.push('Irregular menstrual cycles');
    if (answers.acne > 0) risks.push('Active acne symptoms');
    if (answers.hirsutism > 0) risks.push('Significant hair growth markers (Hirsutism)');
    if (answers.family_history === true) risks.push('Family history of PCOD/PCOS');
    if (bmi > 25) risks.push('Elevated BMI (Metabolic risk)');

    const resultData = {
      answers,
      riskScore: score,
      riskLevel,
      details: {
        bmi: bmi.toFixed(1),
        bmiStatus,
        risks
      },
      createdAt: serverTimestamp(),
      breakdown: {
        metabolic: bmi > 25 ? 10 : 0,
        androgenic: (answers.acne > 1 ? 10 : 0) + (answers.hirsutism ? 15 : 0),
        cycle: answers.regularity === 'regular' ? 0 : answers.regularity === 'irregular' ? 15 : 25
      }
    };

    try {
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'users', auth.currentUser.uid, 'pcodScreenings'), resultData);
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${auth.currentUser.uid}/pcodScreenings`);
        }
      }
      setResult(resultData);
      setStage('results');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!result) return;

    // Create report content
    const reportContent = `
STORMCYCLE - PCOD SCREENING REPORT
----------------------------------
Date: ${new Date().toLocaleDateString()}
Result: ${result.riskLevel.toUpperCase()} RISK
Score: ${result.riskScore}/100

User Details:
- BMI: ${result.details.bmi} (${result.details.bmiStatus})

Symptoms Flagged:
${result.details.risks.length > 0 
  ? result.details.risks.map((r: string) => `- ${r}`).join('\n')
  : '- No significant symptoms flagged'}

Note: This is a screening tool, not a diagnostic report. Please consult a healthcare professional.
    `.trim();

    // Create a blob and download it
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pcod_screening_report_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {stage === 'info' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl border border-storm-border text-center"
        >
          <div className="w-20 h-20 bg-storm-blush rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="text-storm-primary" size={40} />
          </div>
          <h1 className="text-4xl mb-6">Smart PCOD Screening</h1>
          <p className="text-lg text-storm-muted mb-10 leading-relaxed max-w-xl mx-auto">
            Our adaptive algorithm analyzes your hormonal, metabolic, and cycle indicators to estimate PCOD risk. This takes less than 3 minutes.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
            {[
              { icon: Activity, title: "Hormonal", desc: "Cycle patterns & regularity" },
              { icon: Scale, title: "Metabolic", desc: "BMI & weight indicators" },
              { icon: Info, title: "Clinical", desc: "Androgenic markers" }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-storm-cream rounded-2xl">
                <item.icon className="text-storm-primary mb-2" size={20} />
                <div className="font-bold text-sm mb-1">{item.title}</div>
                <div className="text-xs text-storm-muted">{item.desc}</div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setStage('screening')}
            className="w-full py-4 bg-storm-primary text-white rounded-2xl text-lg font-medium hover:bg-storm-secondary transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Start Screener <ArrowRight />
          </button>
          <p className="mt-6 text-xs text-storm-muted italic flex items-center justify-center gap-2">
            <AlertCircle size={14} /> This tool provides an indicator, not a definitive medical diagnosis.
          </p>
        </motion.div>
      )}

      {stage === 'screening' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-storm-muted uppercase tracking-widest leading-none">
              Step {currentStep + 1} of {questions.length}
            </div>
            <div className="text-sm font-bold text-storm-primary">
              {Math.round(((currentStep + 1) / questions.length) * 100)}%
            </div>
          </div>
          <div className="h-2 bg-storm-blush rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-storm-primary" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-storm-border"
            >
              <h2 className="text-3xl mb-2">{questions[currentStep].title}</h2>
              <p className="text-storm-muted mb-10">{questions[currentStep].subtitle}</p>

              <div className="space-y-8">
                {questions[currentStep].fields.map(field => (
                  <div key={field.id} className="space-y-3">
                    <label className="text-lg font-medium flex items-center gap-2">
                      {field.icon && <field.icon size={20} className="text-storm-primary" />}
                      {field.label}
                    </label>
                    
                    {field.type === 'number' && (
                      <div className="space-y-4">
                        <input 
                          type="range" 
                          min={field.min} max={field.max}
                          value={answers[field.id]}
                          onChange={e => setAnswers({...answers, [field.id]: parseInt(e.target.value) || 0})}
                          className="w-full h-2 bg-storm-blush rounded-lg appearance-none cursor-pointer accent-storm-primary"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-storm-muted">{field.min}</span>
                          <span className="px-6 py-2 bg-storm-cream border border-storm-border rounded-xl font-bold text-storm-primary text-xl">
                            {answers[field.id]} {field.id === 'height' ? 'cm' : field.id === 'weight' ? 'kg' : ''}
                          </span>
                          <span className="text-sm text-storm-muted">{field.max}</span>
                        </div>
                      </div>
                    )}

                    {field.type === 'select' && (
                      <div className="grid grid-cols-1 gap-3">
                        {field.options?.map((opt: any) => (
                          <button
                            key={opt.value.toString()}
                            onClick={() => setAnswers({...answers, [field.id]: opt.value})}
                            className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${answers[field.id] === opt.value ? 'bg-storm-blush border-storm-primary' : 'border-storm-cream hover:border-storm-border'}`}
                          >
                            <span className="font-medium">{opt.label}</span>
                            {answers[field.id] === opt.value && <CheckCircle2 size={24} className="text-storm-primary" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {field.type === 'radio' && (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {field.options?.map((opt: any) => (
                          <button
                            key={opt.value.toString()}
                            onClick={() => setAnswers({...answers, [field.id]: opt.value})}
                            className={`p-4 rounded-xl border-2 transition-all ${answers[field.id] === opt.value ? 'bg-storm-blush border-storm-primary text-storm-primary font-bold' : 'border-storm-cream text-storm-muted'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-16 flex justify-between gap-4">
                <button 
                  onClick={() => currentStep === 0 ? setStage('info') : setCurrentStep(prev => prev - 1)}
                  className="px-6 py-4 border border-storm-border rounded-2xl text-storm-muted flex items-center gap-2 hover:bg-storm-cream"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                <button 
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 py-4 bg-storm-primary text-white rounded-2xl text-lg font-medium hover:bg-storm-secondary shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 relative overflow-hidden group"
                >
                  {loading ? (
                    <div className="flex items-center gap-3 relative z-10 font-bold uppercase tracking-widest text-sm">
                      <StormLoader size="sm" />
                      <span>AI Analyzing...</span>
                    </div>
                  ) : (
                    <>
                      {currentStep === questions.length - 1 ? 'Get Results' : 'Continue'} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {stage === 'results' && result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-storm-border"
        >
          <div className={`p-12 text-center text-white ${result.riskLevel === 'low' ? 'bg-storm-success' : result.riskLevel === 'moderate' ? 'bg-storm-warning' : 'bg-storm-danger'}`}>
            <h2 className="text-sm uppercase tracking-widest mb-4 opacity-80">Screening Result</h2>
            <div className="text-6xl font-serif mb-4">{result.riskScore}%</div>
            <div className="text-2xl font-medium tracking-wide uppercase">
              {result.riskLevel} RISK
            </div>
          </div>

          <div className="p-12">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h3 className="text-2xl mb-4">Breakdown</h3>
                {Object.entries(result.breakdown as Record<string, number>).map(([key, value]) => {
                  let max = 25;
                  if (key === 'metabolic') max = 20;
                  if (key === 'genetic' || key === 'family_history') max = 10;
                  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{key.replace('_', ' ')} Indicators</span>
                        <span className="text-storm-muted">{value}/{max}</span>
                      </div>
                      <div className="h-2.5 bg-storm-blush rounded-full overflow-hidden flex">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={`h-full ${percentage > 50 ? 'bg-storm-burgundy' : percentage > 0 ? 'bg-storm-primary' : 'bg-storm-muted'}`} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-6 bg-storm-cream p-8 rounded-3xl">
                <h3 className="text-xl flex items-center gap-2"><CheckCircle2 className="text-storm-primary" size={24} /> Recommended Steps</h3>
                <ul className="space-y-4 text-sm leading-relaxed">
                  {result.riskLevel === 'high' ? (
                    <>
                      <li className="flex gap-3"><strong>Consultation:</strong> Based on high score, schedule an appointment with a gynecologist or endocrinologist.</li>
                      <li className="flex gap-3"><strong>Labs:</strong> Discuss checking Thyroid, Hormonal profile (LH, FSH, Testosterone), and Insulin levels.</li>
                      <li className="flex gap-3"><strong>Lifestyle:</strong> Prioritize consistent sleep, stress reduction, and blood sugar balancing with low-GI foods.</li>
                      <li className="flex gap-3"><strong>Tracking:</strong> Continue logging symptoms daily to show your doctor concrete data.</li>
                    </>
                  ) : result.riskLevel === 'moderate' ? (
                    <>
                      <li className="flex gap-3"><strong>Monitoring:</strong> Your results suggest some markers to watch. Consult your primary physician.</li>
                      <li className="flex gap-3"><strong>Lifestyle:</strong> Small adjustments to insulin-friendly diet and reducing sugar may provide symptom relief.</li>
                      <li className="flex gap-3"><strong>Tracking:</strong> Log cycle data daily to identify trigger patterns.</li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-3"><strong>Routine:</strong> Maintain regular cycle tracking and annual wellness exams.</li>
                      <li className="flex gap-3"><strong>Balanced Lifestyle:</strong> Continue Prioritizing balanced nutrition and activity.</li>
                      <li className="flex gap-3"><strong>Observations:</strong> If cycles become irregular, log immediately for future assessment.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 py-4 bg-storm-primary text-white rounded-2xl font-medium shadow-lg hover:bg-storm-secondary transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait relative overflow-hidden"
                  >
                    {downloading ? (
                      <>
                        <motion.div 
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-white/20"
                        />
                        <FileText size={20} className="animate-pulse" />
                        <span>Preparing Report...</span>
                      </>
                    ) : (
                      <>
                        <FileText size={20} />
                        Download Doctor's Report
                      </>
                    )}
                  </button>
              <button 
                onClick={() => setStage('info')}
                className="px-8 py-4 border border-storm-border rounded-2xl text-storm-muted font-medium hover:bg-storm-cream transition-all"
              >
                Retake
              </button>
            </div>

            <p className="mt-12 text-center text-[10px] text-storm-muted leading-relaxed uppercase tracking-wider">
              CLINICAL DISCLAIMER: This screening is based on statistical models and does not constitute a medical diagnosis. Consult a qualified professional for clinical evaluation.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
