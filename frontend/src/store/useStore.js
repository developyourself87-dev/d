import { create } from 'zustand';

export const useStore = create((set) => ({
  siteSettings: null,
  setSiteSettings: (settings) => set({ siteSettings: settings }),
  
  // RTL/LTR support
  dir: 'rtl',
  setDir: (dir) => set({ dir }),
}));
