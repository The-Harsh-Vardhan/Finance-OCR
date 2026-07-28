import React, { useState } from 'react';
import { Search, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface Term {
  term: string;
  transliteration: string;
  language: string;
  category: string;
  definition: string;
  standard_accounting_term: string;
  example: string;
}

const INDIC_DICTIONARY: Term[] = [
  {
    term: 'बही-खाता (Bahi-Khata)',
    transliteration: 'Bahi Khata',
    language: 'Hindi / Gujarati / Marathi',
    category: 'Bookkeeping',
    definition: 'Traditional bound ledger notebook used by Indian farmers and merchants for daily credit/debit records.',
    standard_accounting_term: 'General Ledger / Accounting Daybook',
    example: 'आज के बही-खाते में यूरिया का खर्च 530 रुपये दर्ज किया गया।'
  },
  {
    term: 'मजदूरी (Majduri)',
    transliteration: 'Majduri / Hamali',
    language: 'Hindi / Marathi',
    category: 'Labor',
    definition: 'Wage payments made to daily farm laborers for sowing, weeding, harvesting, or loading.',
    standard_accounting_term: 'Direct Farm Labor Expense',
    example: '3 मजदूरों की 1 दिन की मजदूरी = 900 रु'
  },
  {
    term: 'खाद (Khad)',
    transliteration: 'Khad / Khat',
    language: 'Hindi / Marathi / Gujarati',
    category: 'Inputs',
    definition: 'Chemical fertilizers (Urea, DAP, NPK) or organic farm manure applied to crops.',
    standard_accounting_term: 'Fertilizer Input Cost',
    example: '2 बोरी यूरिया खाद 530 रु'
  },
  {
    term: 'जमा (Jama)',
    transliteration: 'Jama',
    language: 'Hindi / Urdu',
    category: 'Accounting Entry',
    definition: 'Money received or credited to the farmer’s account (Crop sale income, subsidies).',
    standard_accounting_term: 'Credit (Cr.) / Revenue Receipt',
    example: 'मंडी से गेहूं बिक्री 45,000 रु जमा'
  },
  {
    term: 'नामे / उधार (Naame / Udhaar)',
    transliteration: 'Udhaar / Naame',
    language: 'Hindi / Marathi',
    category: 'Accounting Entry',
    definition: 'Debit entry or loan purchase from input dealer / credit given to laborer.',
    standard_accounting_term: 'Debit (Dr.) / Account Receivable',
    example: 'खाद की दुकान से 1200 रु का उधार'
  },
  {
    term: 'बोरी / कट्टा (Bori / Kattah)',
    transliteration: 'Bori / Katta',
    language: 'Regional Vernacular',
    category: 'Units & Measures',
    definition: 'Standard 45kg or 50kg bag measure used for fertilizer and harvested crops.',
    standard_accounting_term: 'Standard Sack / Bag (45-50 kg)',
    example: '5 बोरी DAP खाद'
  },
  {
    term: 'क्विंटल (Quintal)',
    transliteration: 'Quintal',
    language: 'Pan-Indian',
    category: 'Units & Measures',
    definition: 'Metric weight unit equal to 100 Kilograms used in Mandi grain auctions.',
    standard_accounting_term: '100 Kilograms (0.1 Metric Ton)',
    example: '20 क्विंटल गेहूं @ 2250 रु/क्विंटल'
  }
];

export const KnowledgeExplorer: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = INDIC_DICTIONARY.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.definition.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.standard_accounting_term.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Indic Agricultural & Financial Knowledge Base</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search regional Bahi-Khata terminology, Indian crop slang, dialect units, and their mapped GAAP accounting equivalents.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Hindi, Marathi, units, or accounting terms..."
            className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Grid of Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <div key={idx} className="glass-card-interactive rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="badge-cyan text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {item.category}
                </span>
                <span className="text-[10px] text-slate-400">{item.language}</span>
              </div>

              <h3 className="text-sm font-bold text-cyan-300 mb-1">{item.term}</h3>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">{item.definition}</p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>GAAP Equivalent:</span>
                <span className="font-semibold text-emerald-400">{item.standard_accounting_term}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-slate-400 font-mono italic text-[10px] mt-1">
                Example: "{item.example}"
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
