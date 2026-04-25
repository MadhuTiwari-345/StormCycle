import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'bn', name: 'বাংলা' },
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(() => {
    const saved = localStorage.getItem('preferred_language');
    return languages.find(l => l.code === saved) || languages[0];
  });

  // Initial setup: clear google translate cookie and hash if starting in EN
  useEffect(() => {
    const handleInitialLang = () => {
       const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
       if (select && current.code === 'en' && select.value !== 'en' && select.value !== '') {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
       }
    };
    // It might take a moment for GT element to render
    setTimeout(handleInitialLang, 1000);
  }, []);

  useEffect(() => {
    const handleLangChange = () => {
      const saved = localStorage.getItem('preferred_language');
      const lang = languages.find(l => l.code === saved);
      if (lang) setCurrent(lang);
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const handleLanguageChange = (lang: typeof languages[0]) => {
    setCurrent(lang);
    setIsOpen(false);
    localStorage.setItem('preferred_language', lang.code);
    localStorage.setItem('auto_detect_lang', 'false');
    window.dispatchEvent(new Event('languageChange'));
    
    // Find the Google Translate select element and trigger a change
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = lang.code;
      // We must dispatch the event to trigger the translation
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-storm-blush/50 transition-colors text-sm font-medium text-storm-muted group notranslate"
      >
        <Globe size={16} className="group-hover:text-storm-primary transition-colors" />
        <span>{current.code.toUpperCase()}</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-storm-border z-20 overflow-hidden notranslate"
            >
              <div className="p-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang)}
                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors flex items-center justify-between ${
                      current.code === lang.code 
                        ? 'bg-storm-primary text-white' 
                        : 'text-storm-text hover:bg-storm-blush'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {current.code === lang.code && (
                      <motion.div layoutId="active" className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
