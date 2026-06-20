import { create } from 'zustand';

interface UiStore {
  actionPanelOpen: boolean;
  bottomAreaHeight: number;
  globalError?: string;
  isDrawerOpen: boolean;
  isOffline: boolean;
  closeActionPanel(): void;
  closeDrawer(): void;
  openDrawer(): void;
  setBottomAreaHeight(height: number): void;
  setGlobalError(error?: string): void;
  setOffline(isOffline: boolean): void;
  toggleActionPanel(): void;
}

export const useUiStore = create<UiStore>((set) => ({
  actionPanelOpen: false,
  bottomAreaHeight: 170,
  isDrawerOpen: false,
  isOffline: false,

  closeActionPanel() {
    set({ actionPanelOpen: false });
  },

  closeDrawer() {
    set({ isDrawerOpen: false });
  },

  openDrawer() {
    set({ isDrawerOpen: true });
  },

  setBottomAreaHeight(height) {
    set({ bottomAreaHeight: height });
  },

  setGlobalError(error) {
    set({ globalError: error });
  },

  setOffline(isOffline) {
    set({ isOffline });
  },

  toggleActionPanel() {
    set((state) => ({ actionPanelOpen: !state.actionPanelOpen }));
  }
}));
