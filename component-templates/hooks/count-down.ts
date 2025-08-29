// countdownStore.ts
import { create } from 'zustand';

export type CountdownState = {
  timeLeft: number;
  isRunning: boolean;
  freezing: boolean;
  setTime: (time: number) => void;
  decrement: () => void;
  reset: () => void;
  start: () => void;
  stop: () => void;
  freeze: () => void;
  defrost: () => void;
}

export const useCountdownStore = create<CountdownState>((set) => ({
  timeLeft: 0,
  isRunning: false,
  freezing: false,

  setTime: (time) => set({ timeLeft: time }),

  decrement: () =>
    set((state) =>
      state.timeLeft > 0 ? { timeLeft: state.timeLeft - 1 } : state
    ),

  reset: () => set({ timeLeft: 0, isRunning: false }),

  start: () => set({ isRunning: true }),

  stop: () => set({ isRunning: false }),

  freeze: () => set({ freezing: true }),

  defrost: () => set({ freezing: false }),
}));
