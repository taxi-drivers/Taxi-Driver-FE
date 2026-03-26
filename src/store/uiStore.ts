import { create } from 'zustand'

type UiState = {
  isSurveyOpen: boolean
  setSurveyOpen: (next: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  isSurveyOpen: false,
  setSurveyOpen: (next) => set({ isSurveyOpen: next }),
}))
