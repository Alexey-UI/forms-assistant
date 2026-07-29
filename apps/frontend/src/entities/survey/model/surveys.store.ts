import { create } from 'zustand';
import type { SurveySummaryDto } from '@forms-assistant/shared';
import { api } from '@/shared/api/client';

interface SurveysState {
  mySurveys: SurveySummaryDto[];
  sharedWithMe: SurveySummaryDto[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error: string | null;
  fetchMySurveys: () => Promise<void>;
  fetchSharedWithMe: () => Promise<void>;
  removeSurveyFromList: (surveyId: string) => void;
}

export const useSurveysStore = create<SurveysState>((set) => ({
  mySurveys: [],
  sharedWithMe: [],
  status: 'idle',
  error: null,

  fetchMySurveys: async () => {
    set({ status: 'loading', error: null });
    try {
      const mySurveys = await api.get<SurveySummaryDto[]>('/surveys/mine');
      set({ mySurveys, status: 'loaded' });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Не удалось загрузить опросы',
      });
    }
  },

  fetchSharedWithMe: async () => {
    try {
      const sharedWithMe = await api.get<SurveySummaryDto[]>('/surveys/shared-with-me');
      set({ sharedWithMe });
    } catch {
      // молча игнорируем — список участия не критичен для остального профиля
    }
  },

  removeSurveyFromList: (surveyId) =>
    set((state) => ({ mySurveys: state.mySurveys.filter((survey) => survey.id !== surveyId) })),
}));
