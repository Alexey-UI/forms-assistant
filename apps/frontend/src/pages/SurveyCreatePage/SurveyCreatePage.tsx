import { useNavigate } from 'react-router-dom';
import type { CreateSurveyInput, SurveyDetailDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useUiStore } from '@/shared/model/ui.store';
import { SurveyBuilderForm } from '@/features/survey/SurveyBuilderForm';

export function SurveyCreatePage() {
  const navigate = useNavigate();
  const notify = useUiStore((state) => state.notify);

  const handleSubmit = async (values: CreateSurveyInput) => {
    try {
      const survey = await api.post<SurveyDetailDto>('/surveys', values);
      notify('success', 'Опрос создан как черновик');
      navigate(`/surveys/${survey.id}/edit`);
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось создать опрос');
    }
  };

  return (
    <div>
      <h1>Новый опрос</h1>
      <SurveyBuilderForm submitLabel="Создать черновик" onSubmit={handleSubmit} />
    </div>
  );
}
