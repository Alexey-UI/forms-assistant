import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { CreateSurveyInput, SurveyDetailDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useUiStore } from '@/shared/model/ui.store';
import { toDatetimeLocalValue } from '@/shared/lib/datetime';
import { SurveyBuilderForm } from '@/features/survey/SurveyBuilderForm';
import { SurveyManagementPanel } from '@/widgets/SurveyManagementPanel';
import { Card } from '@/shared/ui/Card';
import { PageHeading } from '@/shared/ui/PageHeading';
import { StateMessage } from '@/shared/ui/StateMessage';
import { BackLink } from '@/shared/ui/BackLink';

export function SurveyEditPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<SurveyDetailDto | null>(null);
  const notify = useUiStore((state) => state.notify);

  const load = useCallback(async () => {
    if (!surveyId) return;
    setSurvey(await api.get<SurveyDetailDto>(`/surveys/${surveyId}`));
  }, [surveyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!survey) {
    return <StateMessage>Загрузка…</StateMessage>;
  }

  const locked = survey.status !== 'DRAFT';

  const handleSubmit = async (values: CreateSurveyInput) => {
    try {
      const updated = await api.patch<SurveyDetailDto>(`/surveys/${survey.id}`, values);
      setSurvey(updated);
      notify('success', 'Изменения сохранены');
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось сохранить изменения');
    }
  };

  const defaultValues: CreateSurveyInput = {
    title: survey.title,
    description: survey.description ?? '',
    anonymityMode: survey.anonymityMode,
    allowMultipleSubmissions: survey.allowMultipleSubmissions,
    deadline: toDatetimeLocalValue(survey.deadline),
    isQuiz: survey.isQuiz,
    questions: survey.questions.map((question) => ({
      type: question.type,
      text: question.text,
      required: question.required,
      order: question.order,
      options: question.options.map((option) => ({
        text: option.text,
        isCorrect: option.isCorrect,
      })),
    })),
  };

  return (
    <div>
      <BackLink to="/profile">Назад к профилю</BackLink>
      <PageHeading eyebrow="Редактирование" title={survey.title} />
      <SurveyManagementPanel survey={survey} onChange={() => void load()} />
      <Card>
        <SurveyBuilderForm
          key={survey.updatedAt}
          defaultValues={defaultValues}
          submitLabel="Сохранить"
          locked={locked}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
