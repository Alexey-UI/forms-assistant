import type { SurveyResultsDto } from '@forms-assistant/shared';
import styles from './SurveyResults.module.css';

export function SurveyResults({ results }: { results: SurveyResultsDto }) {
  return (
    <div>
      <p className={styles.total}>Всего ответов: {results.totalResponses}</p>
      {results.questions.map((question) => (
        <div key={question.questionId} className={styles.question}>
          <h3>{question.text}</h3>
          {question.options && (
            <div className={styles.options}>
              {question.options.map((option) => (
                <div key={option.optionId} className={styles.optionRow}>
                  <div className={styles.optionHeader}>
                    <span>{option.text}</span>
                    <span>
                      {option.count} ({option.percentage}%)
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${option.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {question.textAnswers && (
            <ul className={styles.textAnswers}>
              {question.textAnswers.length === 0 && (
                <li className={styles.muted}>Пока нет ответов</li>
              )}
              {question.textAnswers.map((answer, index) => (
                <li key={`${question.questionId}-${index}`}>{answer}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
