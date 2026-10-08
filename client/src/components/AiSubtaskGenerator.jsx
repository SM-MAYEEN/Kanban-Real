import { useState } from 'react';
import { useLangStore } from '../store/langStore';
import { translations } from '../utils/translations';

export default function AiSubtaskGenerator({ taskTitle, onAddSubtasks }) {
  const [loading, setLoading] = useState(false);
  const { language } = useLangStore();
  const t = translations[language] || translations.en;

  const generateSubtasks = () => {
    if (!taskTitle || !taskTitle.trim()) {
      alert(language === 'bn' ? 'অনুগ্রহ করে আগে টাস্কের টাইটেল দিন!' : 'Please enter a task title first!');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      const lower = taskTitle.toLowerCase();
      let generated = [];

      if (lower.includes('auth') || lower.includes('login') || lower.includes('signup')) {
        generated = language === 'bn' ? [
          'JWT অথেন্টিকেশন API ও টোকেন ভেরিফিকেশন তৈরি',
          'ডাটাবেজে হ্যাশড পাসওয়ার্ড স্কিমা সেটআপ',
          'লগইন ও রেজিস্ট্রেশন ফর্ম তৈরি',
          'প্রোটেক্টেড রাউট মিডলওয়্যার কনফিগারেশন'
        ] : [
          'Design JWT Authentication API & Token verification logic',
          'Create database User Schema with securely hashed passwords',
          'Build responsive Login & Register forms',
          'Implement protected route middleware & token persistence'
        ];
      } else {
        generated = language === 'bn' ? [
          `"${taskTitle}" এর প্রাথমিক রিকোয়ারমেন্ট নির্ধারণ`,
          'ডাটাবেজ মডেল ও API এন্ডপয়েন্ট তৈরি',
          'ফ্রন্টএন্ড ইন্টারফেস ডিজাইন ও স্টেট ম্যানেজমেন্ট',
          'টেস্টিং সম্পন্ন করে প্রোডাকশনে পুশ করা'
        ] : [
          `Research requirements and architecture for "${taskTitle}"`,
          'Set up database models and REST API endpoints',
          'Implement UI components and state management',
          'Run testing and push changes to production'
        ];
      }

      onAddSubtasks(generated);
      setLoading(false);
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={generateSubtasks}
      disabled={loading}
      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition flex items-center gap-1.5 active:scale-95 shrink-0"
    >
      <span>⚡</span>
      {loading ? t.aiGenerating : t.aiGenerateBtn}
    </button>
  );
}