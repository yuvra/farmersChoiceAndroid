import { create } from 'zustand';

export const useUIStore = create((set) => ({
  loading: false,
  setLoading: (value: any) => set({ loading: value }),
}));
