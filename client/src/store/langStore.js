import { create } from 'zustand';

export const useLangStore = create((set) => ({
  language: localStorage.getItem('language') || 'en',
  toggleLanguage: () =>
    set((state) => {
      const nextLang = state.language === 'en' ? 'bn' : 'en';
      localStorage.setItem('language', nextLang);
      return { language: nextLang };
    }),
}));