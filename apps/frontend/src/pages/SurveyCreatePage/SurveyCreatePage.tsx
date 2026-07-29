import { useNavigate } from 'react-router-dom';
import type { CreateSurveyInput, SurveyDetailDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useUiStore } from '@/shared/model/ui.store';
import { SurveyBuilderForm } from '@/features/survey/SurveyBuilderForm';
import { Card } from '@/shared/ui/Card';
import { PageHeading } from '@/shared/ui/PageHeading';

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
      <PageHeading eyebrow="Новый опрос" title="Создание опроса" />
      <Card>
        <SurveyBuilderForm submitLabel="Создать черновик" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
