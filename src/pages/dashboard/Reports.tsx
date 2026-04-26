import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { PCODScreening } from '../../types';
import { FileText, Download, Share2, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import StormLoader from '../../components/shared/StormLoader';

export default function Reports() {
  const [reports, setReports] = useState<PCODScreening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const reportsRef = collection(db, 'users', auth.currentUser.uid, 'pcodScreenings');
    const q = query(reportsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      })) as PCODScreening[];
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleShare = async (report: PCODScreening) => {
    const text = `StormCycle Health Report\nDate: ${format(report.createdAt, 'MMMM d, yyyy')}\nRisk Level: ${report.riskLevel.toUpperCase()}\nBMI: ${report.details?.bmi || 'N/A'}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'StormCycle Health Report',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert('Report summary copied to clipboard!');
      } catch (err) {
        console.error('Clipboard error:', err);
      }
    }
  };

  const handleDownload = (report: PCODScreening) => {
    const content = `
STORM CYCLE - HEALTH REPORT
===========================
Date: ${format(report.createdAt, 'MMMM d, yyyy')}
Risk Level: ${report.riskLevel.toUpperCase()}
Risk Score: ${report.riskScore}/10

VITAL METRICS:
--------------
BMI: ${report.details?.bmi || 'N/A'} (${report.details?.bmiStatus || 'N/A'})
Cycle Regularity: ${report.details?.risks?.includes('Irregular period') ? 'Irregular' : 'Normal'}

REPORTED SYMPTOMS & RISKS:
--------------------------
${report.details?.risks?.map((r: string) => `- ${r}`).join('\n') || 'None reported'}

SYMPTOM SEVERITY:
-----------------
${Object.entries(report.details?.severities || {}).map(([key, val]) => `${key}: ${val}/10`).join('\n')}

Notes: This report is generated based on self-reported data and is not a clinical diagnosis. Please consult a healthcare professional.
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Storm_Report_${format(report.createdAt, 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-serif text-storm-text mb-2">Health Reports</h1>
        <p className="text-storm-muted">View and download your clinical screening summaries.</p>
      </header>

      <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-storm-border max-w-md shadow-sm">
        <Search className="text-storm-muted" size={20} />
        <input 
          type="text" 
          placeholder="Search reports..." 
          className="bg-transparent border-none outline-none text-sm w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-24 flex items-center justify-center">
            <StormLoader size="lg" label="Cataloging your health records" />
          </div>
        ) : (
          <>
            {reports.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-storm-cream rounded-2xl flex items-center justify-center mx-auto mb-4 text-storm-muted">
                  <FileText size={32} />
                </div>
                <h3 className="text-lg font-medium text-storm-text">No reports generated yet</h3>
                <p className="text-sm text-storm-muted max-w-xs mx-auto">Take a PCOD screening to generate your first professional report.</p>
              </div>
            )}

            {reports.map((report, i) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-3xl border border-storm-border shadow-sm flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-storm-blush flex items-center justify-center text-storm-primary">
                    <FileText size={24} />
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    report.riskLevel === 'low' ? 'bg-green-100 text-green-700' : 
                    report.riskLevel === 'moderate' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {report.riskLevel} Risk
                  </span>
                </div>
                
                <h3 className="text-lg font-serif mb-1">PCOD Screening Report</h3>
                <div className="flex items-center gap-2 text-xs text-storm-muted mb-6">
                  <Calendar size={14} /> {format(report.createdAt, 'MMMM d, yyyy')}
                </div>

                <div className="mt-auto flex gap-2 pt-4 border-t border-storm-cream">
                  <button 
                    onClick={() => handleDownload(report)}
                    className="flex-1 py-2.5 bg-storm-primary text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-storm-secondary transition-colors"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button 
                    onClick={() => handleShare(report)}
                    className="p-2.5 border border-storm-border rounded-xl text-storm-muted hover:bg-storm-cream transition-colors"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
