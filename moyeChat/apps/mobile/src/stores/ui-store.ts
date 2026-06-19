import { create } from 'zustand';

interface UiStore {
  actionPanelOpen: boolean;
  bottomAreaHeight: number;
  globalError?: string;
  inputHeight: number;
  inputValue: string;
  isDrawerOpen: boolean;
  isOffline: boolean;
  isScreenLoading: boolean;
  closeActionPanel(): void;
  closeDrawer(): void;
  openDrawer(): void;
  setBottomAreaHeight(height: number): void;
  setGlobalError(error?: string): void;
  setInputHeight(height: number): void;
  setInputValue(value: string): void;
  setOffline(isOffline: boolean): void;
  setScreenLoading(isLoading: boolean): void;
  toggleActionPanel(): void;
}

export const useUiStore = create<UiStore>((set) => ({
  actionPanelOpen: false,
  bottomAreaHeight: 170,
  inputHeight: 36,
  inputValue: '',
  isDrawerOpen: false,
  isOffline: false,
  isScreenLoading: false,

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

  setInputHeight(height) {
    set({ inputHeight: height });
  },

  setInputValue(value) {
    set({ inputValue: value });
  },

  setOffline(isOffline) {
    set({ isOffline });
  },

  setScreenLoading(isLoading) {
    set({ isScreenLoading: isLoading });
  },

  toggleActionPanel() {
    set((state) => ({ actionPanelOpen: !state.actionPanelOpen }));
  }
}));
